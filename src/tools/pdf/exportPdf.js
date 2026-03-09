// import { PDFDocument } from 'pdf-lib';
// import { compressPdf } from './compression';

// export async function exportPdf(file, signatures = [], pageIndices = [], options = {}) {
//   const { 
//     compressionLevel = 'medium',
//     includeSignatures = true 
//   } = options;
  
//   let pdfBytes = await file.arrayBuffer();
  
//   // Apply compression if requested (skip only for 'none')
//   if (compressionLevel && compressionLevel !== 'none') {
//     try {
//       pdfBytes = await compressPdf(file, compressionLevel);
//     } catch (err) {
//       console.warn('Compression failed, using original:', err);
//       pdfBytes = await file.arrayBuffer();
//     }
//   }
  
//   const pdfDoc = await PDFDocument.load(pdfBytes);

//   const pages = pdfDoc.getPages();

//   // Determine which pages to export
//   // If pageIndices provided, use those; otherwise export all
//   const indicesToExport =
//     pageIndices.length > 0
//       ? pageIndices
//       : pages.map((_, index) => index);

//   // Create a new PDF with only the selected pages
//   const newPdfDoc = await PDFDocument.create();
  
//   for (const pageIndex of indicesToExport) {
//     const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageIndex]);
//     newPdfDoc.addPage(copiedPage);
//   }

//   // Apply signatures to the new PDF if included
//   if (includeSignatures && signatures.length > 0) {
//     const newPages = newPdfDoc.getPages();
    
//     for (const sig of signatures) {
//       // Only process signatures for pages that are being exported
//       if (!indicesToExport.includes(sig.pageIndex)) continue;
      
//       // Find the position of this page in the new PDF
//       const newPageIndex = indicesToExport.indexOf(sig.pageIndex);
//       const page = newPages[newPageIndex];
//       if (!page) continue;

//       const pngImage = await newPdfDoc.embedPng(sig.dataUrl);

//       const { width: pageWidth, height: pageHeight } = page.getSize();

//       // Signature size (relative → absolute)
//       const sigWidth = (sig.width || 0.2) * pageWidth;
//       const sigHeight = (pngImage.height / pngImage.width) * sigWidth;

//       // IMPORTANT: PDF Y-axis is bottom-left
//       const x = (sig.x || 0) * pageWidth;
//       const y =
//         pageHeight -
//         (sig.y || 0) * pageHeight -
//         sigHeight;

//       page.drawImage(pngImage, {
//         x,
//         y,
//         width: sigWidth,
//         height: sigHeight,
//       });

//       console.log({
//         pageIndex: sig.pageIndex,
//         x,
//         y,
//         sigWidth,
//         sigHeight,
//         pageWidth,
//         pageHeight,
//       });
//     }
//   }

//   return await newPdfDoc.save();
// }


import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { compressPdfBytes } from "./compression";

function resolveCssFontWeight(weight = "400") {
  const raw = String(weight || "400").toLowerCase();
  if (raw === "regular") return 400;
  if (raw === "semibold") return 600;
  if (raw === "bold") return 700;
  const parsed = Number(raw);
  if (Number.isFinite(parsed)) return Math.max(300, Math.min(900, parsed));
  return 400;
}

function normalizeRotation(rotation = 0) {
  const raw = Number(rotation) || 0;
  const normalized = ((raw % 360) + 360) % 360;
  if (normalized >= 315 || normalized < 45) return 0;
  if (normalized >= 45 && normalized < 135) return 90;
  if (normalized >= 135 && normalized < 225) return 180;
  return 270;
}

function getRotatedViewportSize(pageWidth, pageHeight, rotation) {
  const r = normalizeRotation(rotation);
  if (r === 90 || r === 270) {
    return { width: pageHeight, height: pageWidth };
  }
  return { width: pageWidth, height: pageHeight };
}

function inverseRotatePointTopLeft(xRot, yRot, pageWidth, pageHeight, rotation) {
  const r = normalizeRotation(rotation);
  if (r === 90) return { x: yRot, y: pageHeight - xRot };
  if (r === 180) return { x: pageWidth - xRot, y: pageHeight - yRot };
  if (r === 270) return { x: pageWidth - yRot, y: xRot };
  return { x: xRot, y: yRot };
}

function mapRotatedRectToUnrotatedTopLeft({
  xNorm,
  yNorm,
  widthRot,
  heightRot,
  pageWidth,
  pageHeight,
  rotation,
}) {
  const rotatedViewport = getRotatedViewportSize(pageWidth, pageHeight, rotation);
  const xRot = xNorm * rotatedViewport.width;
  const yRot = yNorm * rotatedViewport.height;

  const corners = [
    inverseRotatePointTopLeft(xRot, yRot, pageWidth, pageHeight, rotation),
    inverseRotatePointTopLeft(xRot + widthRot, yRot, pageWidth, pageHeight, rotation),
    inverseRotatePointTopLeft(xRot, yRot + heightRot, pageWidth, pageHeight, rotation),
    inverseRotatePointTopLeft(xRot + widthRot, yRot + heightRot, pageWidth, pageHeight, rotation),
  ];

  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);

  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const width = Math.max(...xs) - x;
  const height = Math.max(...ys) - y;

  return { x, y, width, height };
}

function resolveImageDrawOriginTopLeft({
  anchorX,
  anchorYTop,
  width,
  height,
  pageHeight,
  rotation,
}) {
  const angle = ((Number(rotation) || 0) % 360 + 360) % 360;
  const theta = (angle * Math.PI) / 180;

  // Desired fixed point is the top-left anchor in preview coordinates.
  const topLeftPdfX = anchorX;
  const topLeftPdfY = pageHeight - anchorYTop;

  // pdf-lib image rotation is applied from image lower-left origin.
  // Convert so rotating keeps top-left anchored like CSS transform-origin: top left.
  const x = topLeftPdfX + height * Math.sin(theta);
  const y = topLeftPdfY - height * Math.cos(theta);

  return { x, y, angle };
}

function renderTextAnnotationToPng(annotation) {
  if (typeof document === "undefined") return null;

  const text = String(annotation.text || "").trim();
  if (!text) return null;

  const size = Math.max(8, Math.min(48, Number(annotation.fontSize) || 14));
  const fontWeight = resolveCssFontWeight(annotation.fontWeight);
  const fontStyle = annotation.italic ? "italic" : "normal";
  const fontFamily = String(annotation.fontFamily || "Helvetica, Arial, sans-serif");
  const color = String(annotation.color || "#111111");
  const lines = text.split(/\r?\n/);
  const lineHeight = size * 1.2;
  const padX = 2;
  const padY = 2;

  const measureCanvas = document.createElement("canvas");
  const measureCtx = measureCanvas.getContext("2d");
  if (!measureCtx) return null;
  measureCtx.font = `${fontStyle} ${fontWeight} ${size}px ${fontFamily}`;

  const maxLineWidth = Math.max(
    1,
    ...lines.map((line) => Math.ceil(measureCtx.measureText(line).width))
  );
  const width = Math.max(1, maxLineWidth + padX * 2);
  const height = Math.max(1, Math.ceil(lines.length * lineHeight + padY * 2));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, width, height);
  ctx.font = `${fontStyle} ${fontWeight} ${size}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = "top";

  lines.forEach((line, index) => {
    const y = padY + index * lineHeight;
    ctx.fillText(line, padX, y);
    const lineWidth = ctx.measureText(line).width;

    if (annotation.underline) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, y + size * 0.95);
      ctx.lineTo(padX + lineWidth, y + size * 0.95);
      ctx.stroke();
    }

    if (annotation.strikethrough) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, y + size * 0.45);
      ctx.lineTo(padX + lineWidth, y + size * 0.45);
      ctx.stroke();
    }
  });

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width,
    height,
  };
}

export async function exportPdf(pages = [], options = {}) {
  const { includeSignatures = true, compressionLevel = "none" } = options;

  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error("No pages provided for export");
  }

  const newPdfDoc = await PDFDocument.create();

  // Use file.name + file.size as stable key
  const loadedPdfCache = {};

  for (const pageItem of pages) {
    const { file, pageIndex, rotation = 0 } = pageItem;
    if (!file || typeof pageIndex !== "number") {
      throw new Error("Invalid page data provided for export");
    }

    const fileKey = `${file.name}_${file.size}`;

    if (!loadedPdfCache[fileKey]) {
      const bytes = await file.arrayBuffer();
      loadedPdfCache[fileKey] = await PDFDocument.load(bytes);
    }

    const sourcePdf = loadedPdfCache[fileKey];

    const [copiedPage] = await newPdfDoc.copyPages(
      sourcePdf,
      [pageIndex]
    );
    copiedPage.setRotation(degrees(rotation));

    newPdfDoc.addPage(copiedPage);
  }

  /* ---------------------------------------------
     Apply signatures
  --------------------------------------------- */

  if (includeSignatures) {
    const newPages = newPdfDoc.getPages();

    for (let i = 0; i < pages.length; i++) {
    const pageItem = pages[i];
    const page = newPages[i];

    if (!pageItem.signatures?.length) continue;

    for (const sig of pageItem.signatures) {
      const pngImage = await newPdfDoc.embedPng(sig.dataUrl);

      const { width: pageWidth, height: pageHeight } =
          page.getSize();
      const rotation = pageItem.rotation || 0;
      const rotatedViewport = getRotatedViewportSize(pageWidth, pageHeight, rotation);

      const sigWidthRot = (sig.width || 0.2) * rotatedViewport.width;
      const sigHeightRot = (pngImage.height / pngImage.width) * sigWidthRot;
      const mapped = mapRotatedRectToUnrotatedTopLeft({
        xNorm: sig.x || 0,
        yNorm: sig.y || 0,
        widthRot: sigWidthRot,
        heightRot: sigHeightRot,
        pageWidth,
        pageHeight,
        rotation,
      });

      const draw = resolveImageDrawOriginTopLeft({
        anchorX: mapped.x,
        anchorYTop: mapped.y,
        width: mapped.width,
        height: mapped.height,
        pageHeight,
        rotation: sig.rotation,
      });

        page.drawImage(pngImage, {
          x: draw.x,
          y: draw.y,
          width: mapped.width,
          height: mapped.height,
          rotate: degrees(draw.angle),
        });
      }
    }
  }

  const newPages = newPdfDoc.getPages();
  const watermarkFont = await newPdfDoc.embedFont(StandardFonts.Helvetica);
  const exportDate = new Date();
  const exportTimeIso = exportDate.toISOString();
  const exportTimeLocal = exportDate.toLocaleString("en-ZA", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
  const watermarkText = [
    "Perspective POV Tools",
    "@tools.perspectivepov.co.za",
    "@perspectivepov.co.za",
    "www.perspectivepov.co.za",
    "www.tools.perspectivepov.co.za",
    `Exported: ${exportTimeLocal} (${exportTimeIso})`,
  ].join(" | ");
  const watermarkSize = 8;

  for (let i = 0; i < pages.length; i++) {
    const pageItem = pages[i];
    const page = newPages[i];
    const texts = pageItem.texts || [];
    if (!texts.length) continue;

    const { width: pageWidth, height: pageHeight } = page.getSize();

    for (const annotation of texts) {
      const text = String(annotation.text || "").trim();
      if (!text) continue;

      const rotation = pageItem.rotation || 0;
      const renderedText = renderTextAnnotationToPng(annotation);
      if (!renderedText?.dataUrl) continue;

      const textPng = await newPdfDoc.embedPng(renderedText.dataUrl);
      const rotatedViewport = getRotatedViewportSize(pageWidth, pageHeight, rotation);
      const widthRot = annotation.boxWidthNorm
        ? Math.max(1, annotation.boxWidthNorm * rotatedViewport.width)
        : renderedText.width;
      const heightRot = annotation.boxHeightNorm
        ? Math.max(1, annotation.boxHeightNorm * rotatedViewport.height)
        : renderedText.height;
      const mappedText = mapRotatedRectToUnrotatedTopLeft({
        xNorm: annotation.x || 0,
        yNorm: annotation.y || 0,
        widthRot,
        heightRot,
        pageWidth,
        pageHeight,
        rotation,
      });
      const draw = resolveImageDrawOriginTopLeft({
        anchorX: mappedText.x,
        anchorYTop: mappedText.y,
        width: mappedText.width,
        height: mappedText.height,
        pageHeight,
        rotation: annotation.rotation,
      });

      page.drawImage(textPng, {
        x: draw.x,
        y: draw.y,
        width: mappedText.width,
        height: mappedText.height,
        rotate: degrees(draw.angle),
      });
    }
  }

  // Add invisible/selectable watermark to each exported page.
  for (const page of newPages) {
    const { width: pageWidth } = page.getSize();
    const textWidth = watermarkFont.widthOfTextAtSize(watermarkText, watermarkSize);
    const x = Math.max(12, pageWidth - textWidth - 12);
    const y = 10;

    page.drawText(watermarkText, {
      x,
      y,
      size: watermarkSize,
      font: watermarkFont,
      color: rgb(1, 1, 1),
      opacity: 0.01,
    });
  }

  const rawOutput = await newPdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });
  const output = await compressPdfBytes(rawOutput, compressionLevel);
  if (!(output instanceof Uint8Array) || output.length === 0) {
    throw new Error("Failed to generate PDF");
  }

  return output;
}
