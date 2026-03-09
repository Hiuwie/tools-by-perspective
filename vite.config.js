// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })


// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';

// export default defineConfig({
//   plugins: [react()],
//   optimizeDeps: {
//     exclude: ['react-pdf'],
//   },
// });


import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const signatureSessions = new Map();

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function signatureSessionApiPlugin() {
  return {
    name: 'signature-session-api',
    configureServer(server) {
      server.middlewares.use('/api/signature-sessions', async (req, res, next) => {
        try {
          const method = req.method || 'GET';
          const url = new URL(req.url || '/', 'http://localhost');
          const parts = url.pathname.split('/').filter(Boolean);

          if (method === 'POST' && parts.length === 0) {
            const body = await readJsonBody(req);
            const sessionId = body?.sessionId;
            if (!sessionId) {
              sendJson(res, 400, { error: 'sessionId is required' });
              return;
            }

            signatureSessions.set(sessionId, {
              sessionId,
              status: 'waiting',
              signature: null,
              createdAt: Date.now(),
            });

            sendJson(res, 200, { ok: true, sessionId });
            return;
          }

          if (parts.length === 1) {
            const [sessionId] = parts;
            const session = signatureSessions.get(sessionId);

            if (method === 'GET') {
              if (!session) {
                sendJson(res, 404, { error: 'Session not found' });
                return;
              }
              sendJson(res, 200, session);
              return;
            }

            if (method === 'DELETE') {
              signatureSessions.delete(sessionId);
              sendJson(res, 200, { ok: true });
              return;
            }
          }

          if (parts.length === 2 && parts[1] === 'complete' && method === 'POST') {
            const [sessionId] = parts;
            const session = signatureSessions.get(sessionId);
            if (!session) {
              sendJson(res, 404, { error: 'Session not found' });
              return;
            }

            const body = await readJsonBody(req);
            if (!body?.signature) {
              sendJson(res, 400, { error: 'signature is required' });
              return;
            }

            signatureSessions.set(sessionId, {
              ...session,
              status: 'complete',
              signature: body.signature,
              completedAt: Date.now(),
            });

            sendJson(res, 200, { ok: true });
            return;
          }

          next();
        } catch (err) {
          console.error('Signature session API error:', err);
          sendJson(res, 500, { error: 'Internal server error' });
        }
      });
    },
  };
}

function parseAmount(value) {
  const match = String(value || '').match(/(?:R|\$|USD|ZAR)?\s*(-?\d{1,3}(?:[\s,]\d{3})*(?:\.\d{1,2})|-?\d+(?:\.\d{1,2})?)/i);
  if (!match) return null;
  const normalized = match[1].replace(/[\s,]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildFallbackModel(prompt) {
  const text = String(prompt || '').trim();
  const itemRegex = /(part|item|service|product)\s*([\w-]*)\s*[:=-]\s*([^,;\n]+)/gi;
  const items = [];
  let m;

  while ((m = itemRegex.exec(text)) !== null) {
    const label = `${m[1]} ${m[2] || ''}`.trim().replace(/\s+/g, ' ');
    const valueText = String(m[3] || '').trim();
    items.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      valueText,
      amount: parseAmount(valueText),
    });
  }

  const explicitTotalMatch = text.match(/total\s*[:=-]\s*([^,;\n]+)/i);
  const explicitTotal = explicitTotalMatch ? parseAmount(explicitTotalMatch[1]) : null;
  const calculated = items
    .map((item) => item.amount)
    .filter((amount) => Number.isFinite(amount))
    .reduce((acc, value) => acc + value, 0);
  const hasItemAmounts = items.some((item) => Number.isFinite(item.amount));

  const title = /\binvoice\b/i.test(text)
    ? 'Invoice'
    : /\bquote|quotation\b/i.test(text)
      ? 'Quotation'
      : /\breceipt\b/i.test(text)
        ? 'Receipt'
        : 'Generated Document';

  const model = {
    type: /\b(recipe|cook|ingredients)\b/i.test(text) ? 'recipe' : 'invoice',
    title,
    summary: text.slice(0, 220),
    includeDate: /\bdate\b/i.test(text) || /\binvoice\b/i.test(text),
    includeSignature: /\bsign(?:ature)?\b/i.test(text) || /\binvoice\b/i.test(text),
    items,
    total: Number.isFinite(explicitTotal)
      ? explicitTotal
      : hasItemAmounts
        ? calculated
        : null,
    ingredients: [],
    steps: [],
    imagePrompt: /\b(image|photo|illustration|diagram|logo|picture|cover)\b/i.test(text)
      ? `Clean professional illustration for document topic: ${text.slice(0, 140)}`
      : '',
  };

  return {
    enhancedPrompt: text,
    assistantReply:
      'I structured your prompt into a clean PDF layout with items, totals, date, and signature areas where detected.',
    model,
    provider: 'fallback',
  };
}

function aiPdfAssistantPlugin(env) {
  async function callOpenRouterAssistant({ prompt, apiKey, model }) {
    const system = [
      'You are a PDF document planning assistant.',
      'Return strict JSON only.',
      'Schema:',
      '{ "assistantReply": string, "enhancedPrompt": string, "model": { "type": "invoice"|"recipe"|"document", "title": string, "summary": string, "includeDate": boolean, "includeSignature": boolean, "items": [{ "label": string, "valueText": string, "amount": number|null }], "ingredients": string[], "steps": string[], "total": number|null, "imagePrompt": string } }',
      'When user asks for image/logo/photo/diagram, provide a concise "imagePrompt".',
    ].join('\n');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `User request: ${prompt}` },
        ],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async function callHfTextToImage({ prompt, apiKey, model }) {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        options: { wait_for_model: true },
      }),
    });

    if (!response.ok) return null;
    const contentType = response.headers.get('content-type') || 'image/png';
    if (!contentType.includes('image')) return null;
    const imageBuffer = await response.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');
    return `data:${contentType};base64,${imageBase64}`;
  }

  function shouldGenerateImage(prompt, aiModel) {
    const text = `${prompt || ''} ${aiModel?.imagePrompt || ''}`.toLowerCase();
    return /\b(image|photo|illustration|diagram|logo|picture|cover)\b/.test(text);
  }

  return {
    name: 'ai-pdf-assistant-api',
    configureServer(server) {
      server.middlewares.use('/api/ai/pdf-assistant', async (req, res, next) => {
        try {
          if ((req.method || 'GET') !== 'POST') {
            next();
            return;
          }

          const body = await readJsonBody(req);
          const prompt = String(body?.prompt || '').trim();
          if (!prompt) {
            sendJson(res, 400, { error: 'prompt is required' });
            return;
          }

          const apiKey = env.OPENAI_API_KEY;
          const baseUrl = env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
          const model = env.OPENAI_MODEL || 'gpt-4o-mini';
          const openRouterKey = env.OPENROUTER_API_KEY;
          const openRouterModel = env.OPENROUTER_MODEL || 'openrouter/auto';
          const hfKey = env.HUGGINGFACE_API_KEY;
          const hfImageModel =
            env.HUGGINGFACE_IMAGE_MODEL || 'stabilityai/stable-diffusion-xl-base-1.0';

          if (!apiKey && !openRouterKey) {
            const fallback = buildFallbackModel(prompt);
            if (hfKey && shouldGenerateImage(prompt, fallback.model)) {
              const imagePrompt =
                fallback.model?.imagePrompt ||
                `Professional document illustration for: ${prompt.slice(0, 120)}`;
              const imageDataUrl = await callHfTextToImage({
                prompt: imagePrompt,
                apiKey: hfKey,
                model: hfImageModel,
              });
              if (imageDataUrl) {
                fallback.model.images = [{ dataUrl: imageDataUrl, caption: 'Generated image' }];
              }
            }
            sendJson(res, 200, {
              ...fallback,
              imageGenerationEnabled: Boolean(hfKey),
              imageGenerated: Boolean(fallback.model?.images?.length),
            });
            return;
          }

          let parsed;
          if (openRouterKey) {
            parsed = await callOpenRouterAssistant({
              prompt,
              apiKey: openRouterKey,
              model: openRouterModel,
            });
          }

          if (!parsed && apiKey) {
            const system = [
              'You are a PDF document planning assistant.',
              'Return strict JSON only.',
              'Schema:',
              '{ "assistantReply": string, "enhancedPrompt": string, "model": { "type": "invoice"|"recipe"|"document", "title": string, "summary": string, "includeDate": boolean, "includeSignature": boolean, "items": [{ "label": string, "valueText": string, "amount": number|null }], "ingredients": string[], "steps": string[], "total": number|null, "imagePrompt": string } }',
            ].join('\n');

            const response = await fetch(`${baseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model,
                temperature: 0.2,
                response_format: { type: 'json_object' },
                messages: [
                  { role: 'system', content: system },
                  { role: 'user', content: `User request: ${prompt}` },
                ],
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const raw = data?.choices?.[0]?.message?.content;
              try {
                parsed = JSON.parse(raw);
              } catch {
                parsed = null;
              }
            }
          }

          const fallback = buildFallbackModel(prompt);
          const finalModel = parsed?.model || fallback.model;
          const enhancedPrompt = parsed?.enhancedPrompt || prompt;
          const assistantReply =
            parsed?.assistantReply ||
            `${fallback.assistantReply}\n(LLM unavailable; using fallback parser.)`;

          if (hfKey && shouldGenerateImage(prompt, finalModel)) {
            const imagePrompt =
              String(finalModel?.imagePrompt || '').trim() ||
              `Professional document image for: ${enhancedPrompt.slice(0, 180)}`;
            const imageDataUrl = await callHfTextToImage({
              prompt: imagePrompt,
              apiKey: hfKey,
              model: hfImageModel,
            });
            if (imageDataUrl) {
              finalModel.images = [{ dataUrl: imageDataUrl, caption: 'Generated image' }];
            }
          }

          sendJson(res, 200, {
            assistantReply,
            enhancedPrompt,
            model: finalModel,
            provider: parsed ? (openRouterKey ? 'openrouter' : 'openai') : 'fallback',
            imageGenerationEnabled: Boolean(hfKey),
            imageGenerated: Boolean(finalModel?.images?.length),
          });
        } catch (err) {
          console.error('AI assistant API error:', err);
          const fallback = buildFallbackModel('');
          sendJson(res, 200, {
            ...fallback,
            imageGenerationEnabled: false,
            imageGenerated: false,
          });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), signatureSessionApiPlugin(), aiPdfAssistantPlugin(env)],
    server: {
      host: true,
    },
    optimizeDeps: {
      include: ['warning'],
      exclude: ['react-pdf'],
    },
  };
});
