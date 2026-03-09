import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN_X = 48;
const MARGIN_Y = 52;
const BRAND_COLOR = rgb(1, 0.3725, 0.2275);
const BODY_COLOR = rgb(0.13, 0.13, 0.13);
const MUTED_COLOR = rgb(0.42, 0.42, 0.42);

function wrapText(text, font, size, maxWidth) {
  if (!text) return [];

  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const candidateWidth = font.widthOfTextAtSize(candidate, size);

    if (candidateWidth <= maxWidth || current.length === 0) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function extractAmount(value) {
  if (!value) return null;
  const amountMatch = String(value).match(/(?:R|\$|USD|ZAR)?\s*(-?\d{1,3}(?:[\s,]\d{3})*(?:\.\d{1,2})|-?\d+(?:\.\d{1,2})?)/i);
  if (!amountMatch) return null;

  const normalized = amountMatch[1].replace(/[\s,]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatAmount(value) {
  if (!Number.isFinite(value)) return '';
  return `R ${value.toFixed(2)}`;
}

function inferTitle(promptText) {
  const text = promptText.toLowerCase();
  if (text.includes('recipe') || text.includes('cook') || text.includes('ingredients')) return 'Recipe';
  if (text.includes('invoice')) return 'Invoice';
  if (text.includes('quote') || text.includes('quotation')) return 'Quotation';
  if (text.includes('receipt')) return 'Receipt';
  if (text.includes('report')) return 'Report';
  return 'Generated Document';
}

function buildModel(promptText) {
  const text = promptText.trim();
  const lower = text.toLowerCase();
  const isRecipe =
    /\b(recipe|cook|cooking|ingredients|method|steps)\b/i.test(lower);
  const items = [];
  const itemRegex = /(part|item|service|product)\s*([\w-]*)\s*[:=-]\s*([^,;\n]+)/gi;

  let itemMatch;
  while ((itemMatch = itemRegex.exec(text)) !== null) {
    const kind = itemMatch[1];
    const suffix = itemMatch[2] ? ` ${itemMatch[2]}` : '';
    const valuePart = itemMatch[3].trim();

    items.push({
      label: `${kind}${suffix}`.trim().replace(/\s+/g, ' ').replace(/^./, (c) => c.toUpperCase()),
      valueText: valuePart,
      amount: extractAmount(valuePart),
    });
  }

  const totalMatch = text.match(/total\s*[:=-]\s*([^,;\n]+)/i);
  const explicitTotalAmount = totalMatch ? extractAmount(totalMatch[1]) : null;

  const numericItemAmounts = items
    .map((item) => item.amount)
    .filter((amount) => Number.isFinite(amount));

  const calculatedTotal =
    numericItemAmounts.length > 0
      ? numericItemAmounts.reduce((acc, value) => acc + value, 0)
      : null;

  const includeDate = /\bdate\b/i.test(text) || /\binvoice\b/i.test(text);
  const includeSignature = /\bsign(?:ature)?\b/i.test(text) || /\binvoice\b/i.test(text);

  const summary = text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);

  return {
    type: isRecipe ? 'recipe' : 'invoice',
    title: inferTitle(text),
    summary,
    items,
    includeDate,
    includeSignature,
    total: Number.isFinite(explicitTotalAmount) ? explicitTotalAmount : calculatedTotal,
    ingredients: [],
    steps: [],
  };
}

function normalizeAiModel(aiModel, fallbackPrompt) {
  if (!aiModel || typeof aiModel !== 'object') return null;

  const title = String(aiModel.title || '').trim() || inferTitle(fallbackPrompt || '');
  const summary = String(aiModel.summary || fallbackPrompt || '').trim().slice(0, 220);
  const includeDate = Boolean(aiModel.includeDate);
  const includeSignature = Boolean(aiModel.includeSignature);
  const total = Number.isFinite(aiModel.total) ? aiModel.total : null;
  const items = Array.isArray(aiModel.items)
    ? aiModel.items
        .map((item) => {
          const label = String(item?.label || '').trim();
          const valueText = String(item?.valueText || '').trim();
          const amount = Number.isFinite(item?.amount) ? Number(item.amount) : extractAmount(valueText);
          if (!label && !valueText && !Number.isFinite(amount)) return null;
          return {
            label: label || 'Item',
            valueText,
            amount: Number.isFinite(amount) ? amount : null,
          };
        })
        .filter(Boolean)
    : [];

  return {
    type: String(aiModel.type || '').trim().toLowerCase() || undefined,
    title,
    summary,
    includeDate,
    includeSignature,
    total,
    items,
    ingredients: Array.isArray(aiModel.ingredients)
      ? aiModel.ingredients.map((it) => String(it || '').trim()).filter(Boolean)
      : [],
    steps: Array.isArray(aiModel.steps)
      ? aiModel.steps.map((it) => String(it || '').trim()).filter(Boolean)
      : [],
    images: Array.isArray(aiModel.images)
      ? aiModel.images
          .map((img) => ({
            dataUrl: String(img?.dataUrl || '').trim(),
            caption: String(img?.caption || '').trim(),
          }))
          .filter((img) => img.dataUrl.startsWith('data:image/'))
      : [],
  };
}

function inferRecipeFromPrompt(promptText) {
  const text = String(promptText || '').trim();
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const lower = text.toLowerCase();
  const ingredientHints = /(cup|cups|tbsp|tsp|gram|grams|kg|ml|l|salt|water|rice|oil|onion|garlic|sugar|flour)\b/i;
  const stepHints = /^(step\s*\d+|then|next|after|finally|boil|cook|add|stir|mix|cover|serve)\b/i;

  const ingredients = [];
  const steps = [];
  for (const line of lines) {
    const clean = line.replace(/^[-*]\s*/, '');
    if (ingredientHints.test(clean) && !stepHints.test(clean)) {
      ingredients.push(clean);
      continue;
    }
    if (stepHints.test(clean) || /\b(minute|minutes|until)\b/i.test(clean)) {
      steps.push(clean);
    }
  }

  if (ingredients.length === 0 && lower.includes('rice')) {
    ingredients.push('1 cup rice', '2 cups water', 'Pinch of salt (optional)');
  }
  if (steps.length === 0 && lower.includes('rice')) {
    steps.push(
      'Rinse the rice with clean water.',
      'Add rice and water to a pot and bring to a boil.',
      'Reduce heat, cover, and simmer for 12-15 minutes.',
      'Turn off heat and let it rest for 5 minutes before serving.'
    );
  }

  return {
    ingredients,
    steps,
  };
}

function drawHeader(page, fonts, model) {
  const { bold, regular } = fonts;
  const pageWidth = page.getWidth();

  page.drawText('Perspective POV Tools', {
    x: MARGIN_X,
    y: A4_HEIGHT - MARGIN_Y + 8,
    size: 11,
    color: BRAND_COLOR,
    font: bold,
  });

  page.drawText('AI-assisted PDF generator', {
    x: MARGIN_X,
    y: A4_HEIGHT - MARGIN_Y - 6,
    size: 9,
    color: MUTED_COLOR,
    font: regular,
  });

  page.drawText(model.title, {
    x: MARGIN_X,
    y: A4_HEIGHT - MARGIN_Y - 46,
    size: 26,
    color: BODY_COLOR,
    font: bold,
  });

  page.drawLine({
    start: { x: MARGIN_X, y: A4_HEIGHT - MARGIN_Y - 56 },
    end: { x: pageWidth - MARGIN_X, y: A4_HEIGHT - MARGIN_Y - 56 },
    color: rgb(0.87, 0.87, 0.87),
    thickness: 1,
  });
}

function drawSummary(page, fonts, model, startY) {
  const { regular, bold } = fonts;
  const width = page.getWidth() - MARGIN_X * 2;
  let y = startY;

  page.drawText('Prompt summary', {
    x: MARGIN_X,
    y,
    size: 11,
    color: MUTED_COLOR,
    font: bold,
  });

  y -= 18;
  const lines = wrapText(model.summary || 'Generated from user prompt.', regular, 11, width);
  for (const line of lines) {
    page.drawText(line, {
      x: MARGIN_X,
      y,
      size: 11,
      color: BODY_COLOR,
      font: regular,
    });
    y -= 14;
  }

  return y - 10;
}

function drawInvoiceTable(page, fonts, model, startY) {
  const { regular, bold } = fonts;
  const pageWidth = page.getWidth();
  const tableWidth = pageWidth - MARGIN_X * 2;
  const amountColumnWidth = 140;
  const leftColumnWidth = tableWidth - amountColumnWidth;
  const rowHeight = 28;
  let y = startY;

  page.drawRectangle({
    x: MARGIN_X,
    y: y - rowHeight,
    width: tableWidth,
    height: rowHeight,
    color: rgb(0.97, 0.97, 0.97),
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 1,
  });

  page.drawText('Description', {
    x: MARGIN_X + 10,
    y: y - 18,
    size: 11,
    color: BODY_COLOR,
    font: bold,
  });

  page.drawText('Amount', {
    x: MARGIN_X + leftColumnWidth + 10,
    y: y - 18,
    size: 11,
    color: BODY_COLOR,
    font: bold,
  });

  y -= rowHeight;

  const rows = model.items.length > 0
    ? model.items
    : [{ label: 'Item 1', valueText: 'Add item details and amount', amount: null }];

  for (const row of rows) {
    page.drawRectangle({
      x: MARGIN_X,
      y: y - rowHeight,
      width: tableWidth,
      height: rowHeight,
      borderColor: rgb(0.9, 0.9, 0.9),
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });

    const labelText = row.label;
    const amountText = Number.isFinite(row.amount)
      ? formatAmount(row.amount)
      : row.valueText || '';

    page.drawText(labelText, {
      x: MARGIN_X + 10,
      y: y - 18,
      size: 10,
      color: BODY_COLOR,
      font: regular,
    });

    page.drawText(amountText, {
      x: MARGIN_X + leftColumnWidth + 10,
      y: y - 18,
      size: 10,
      color: BODY_COLOR,
      font: regular,
    });

    y -= rowHeight;
  }

  if (Number.isFinite(model.total)) {
    page.drawRectangle({
      x: MARGIN_X,
      y: y - rowHeight,
      width: tableWidth,
      height: rowHeight,
      color: rgb(1, 0.9725, 0.955),
      borderColor: BRAND_COLOR,
      borderWidth: 1,
    });

    page.drawText('Total', {
      x: MARGIN_X + 10,
      y: y - 18,
      size: 11,
      color: BODY_COLOR,
      font: bold,
    });

    page.drawText(formatAmount(model.total), {
      x: MARGIN_X + leftColumnWidth + 10,
      y: y - 18,
      size: 11,
      color: BODY_COLOR,
      font: bold,
    });

    y -= rowHeight;
  }

  return y - 12;
}

function drawRecipeSections(page, fonts, model, startY) {
  const { regular, bold } = fonts;
  const width = page.getWidth() - MARGIN_X * 2;
  let y = startY;

  const fallback = inferRecipeFromPrompt(model.summary || '');
  const ingredients = (model.ingredients && model.ingredients.length > 0)
    ? model.ingredients
    : fallback.ingredients;
  const steps = (model.steps && model.steps.length > 0)
    ? model.steps
    : fallback.steps;

  page.drawText('Ingredients', {
    x: MARGIN_X,
    y,
    size: 12,
    color: BODY_COLOR,
    font: bold,
  });
  y -= 18;

  for (const ingredient of ingredients.slice(0, 12)) {
    const lines = wrapText(`- ${ingredient}`, regular, 10.5, width);
    for (const line of lines) {
      page.drawText(line, {
        x: MARGIN_X,
        y,
        size: 10.5,
        color: BODY_COLOR,
        font: regular,
      });
      y -= 14;
    }
  }

  y -= 8;
  page.drawText('Method', {
    x: MARGIN_X,
    y,
    size: 12,
    color: BODY_COLOR,
    font: bold,
  });
  y -= 18;

  steps.slice(0, 12).forEach((step, index) => {
    const lines = wrapText(`${index + 1}. ${step}`, regular, 10.5, width);
    for (const line of lines) {
      page.drawText(line, {
        x: MARGIN_X,
        y,
        size: 10.5,
        color: BODY_COLOR,
        font: regular,
      });
      y -= 14;
    }
    y -= 2;
  });

  return y;
}

async function drawGeneratedImage(page, model, pdfDoc, startY) {
  const image = model.images?.[0];
  if (!image?.dataUrl) return startY;

  try {
    const embedded = image.dataUrl.includes('image/jpeg') || image.dataUrl.includes('image/jpg')
      ? await pdfDoc.embedJpg(image.dataUrl)
      : await pdfDoc.embedPng(image.dataUrl);

    const maxWidth = page.getWidth() - MARGIN_X * 2;
    const maxHeight = 220;
    const scale = Math.min(maxWidth / embedded.width, maxHeight / embedded.height, 1);
    const width = embedded.width * scale;
    const height = embedded.height * scale;
    const x = MARGIN_X + (maxWidth - width) / 2;
    const y = startY - height;

    page.drawImage(embedded, { x, y, width, height });

    if (image.caption) {
      return y - 22;
    }
    return y - 12;
  } catch {
    return startY;
  }
}

function drawFooterSections(page, fonts, model, startY) {
  const { regular, bold } = fonts;
  let y = startY;

  if (model.includeDate) {
    page.drawText('Invoice Date', {
      x: MARGIN_X,
      y,
      size: 11,
      color: MUTED_COLOR,
      font: bold,
    });

    y -= 16;
    page.drawLine({
      start: { x: MARGIN_X, y },
      end: { x: MARGIN_X + 180, y },
      color: rgb(0.7, 0.7, 0.7),
      thickness: 1,
    });

    y -= 28;
  }

  if (model.includeSignature) {
    page.drawText('Customer Signature', {
      x: MARGIN_X,
      y,
      size: 11,
      color: MUTED_COLOR,
      font: bold,
    });

    y -= 18;
    page.drawLine({
      start: { x: MARGIN_X, y },
      end: { x: MARGIN_X + 250, y },
      color: rgb(0.7, 0.7, 0.7),
      thickness: 1,
    });

    page.drawText('Sign here', {
      x: MARGIN_X,
      y: y - 14,
      size: 9,
      color: MUTED_COLOR,
      font: regular,
    });
  }
}

export async function generatePdfFromPrompt(prompt, aiModel = null) {
  const trimmedPrompt = String(prompt || '').trim();
  if (!trimmedPrompt) {
    throw new Error('Prompt is required to generate a PDF');
  }

  const model = normalizeAiModel(aiModel, trimmedPrompt) || buildModel(trimmedPrompt);
  const isRecipe = model.type === 'recipe' || /\b(recipe|cook|ingredients)\b/i.test(trimmedPrompt);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  drawHeader(page, { regular, bold }, model);

  let cursorY = A4_HEIGHT - MARGIN_Y - 88;
  cursorY = drawSummary(page, { regular, bold }, model, cursorY);
  cursorY = await drawGeneratedImage(page, model, pdfDoc, cursorY - 6);
  if (isRecipe) {
    drawRecipeSections(page, { regular, bold }, model, cursorY);
  } else {
    cursorY = drawInvoiceTable(page, { regular, bold }, model, cursorY);
    drawFooterSections(page, { regular, bold }, model, cursorY);
  }

  const bytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });

  const filenameStem = model.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'generated-document';

  return new File([bytes], `${filenameStem}.pdf`, { type: 'application/pdf' });
}
