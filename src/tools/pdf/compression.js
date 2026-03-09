import { PDFDocument } from 'pdf-lib';
import { pdfjsLib } from './pdfjs';

/**
 * Compression presets inspired by common PDF export profiles.
 * - low: light optimization, preserves most fidelity
 * - medium: balanced quality/size
 * - high: strong compression for sharing
 * - extreme: maximum size reduction (visible quality loss)
 */
export const COMPRESSION_LEVELS = {
  none: {
    name: 'None',
    description: 'No compression (keep original quality)',
    mode: 'lossless',
    removeMetadata: false,
  },
  low: {
    name: 'Low',
    description: 'Preserve quality',
    mode: 'lossless',
    removeMetadata: true,
  },
  medium: {
    name: 'Medium (Recommended)',
    description: 'Balanced quality and file size',
    mode: 'raster',
    dpi: 140,
    jpegQuality: 0.86,
    removeMetadata: true,
  },
  high: {
    name: 'High',
    description: 'Minimal quality',
    mode: 'raster',
    dpi: 115,
    jpegQuality: 0.72,
    removeMetadata: true,
  },
  extreme: {
    name: 'Extreme',
    description: 'Discard quality',
    mode: 'raster',
    dpi: 96,
    jpegQuality: 0.58,
    removeMetadata: true,
  },
};

function sanitizeMetadata(pdfDoc) {
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer('');
  pdfDoc.setCreator('');
  pdfDoc.setCreationDate(new Date(0));
  pdfDoc.setModificationDate(new Date(0));
}

async function applyLosslessCompression(pdfBytes, settings) {
  const pdfDoc = await PDFDocument.load(pdfBytes);

  if (settings.removeMetadata) {
    sanitizeMetadata(pdfDoc);
  }

  return pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });
}

async function applyRasterCompression(pdfBytes, settings) {
  if (typeof document === 'undefined') {
    return applyLosslessCompression(pdfBytes, settings);
  }

  const sourcePdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
  const outPdf = await PDFDocument.create();
  const renderScale = (settings.dpi || 140) / 72;

  for (let i = 1; i <= sourcePdf.numPages; i += 1) {
    const srcPage = await sourcePdf.getPage(i);
    const baseViewport = srcPage.getViewport({ scale: 1 });
    const renderViewport = srcPage.getViewport({ scale: renderScale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = Math.max(1, Math.floor(renderViewport.width));
    canvas.height = Math.max(1, Math.floor(renderViewport.height));

    await srcPage.render({ canvasContext: context, viewport: renderViewport }).promise;

    const jpegDataUrl = canvas.toDataURL(
      'image/jpeg',
      Math.max(0.3, Math.min(0.95, settings.jpegQuality || 0.86))
    );
    const jpg = await outPdf.embedJpg(jpegDataUrl);
    const outPage = outPdf.addPage([baseViewport.width, baseViewport.height]);
    outPage.drawImage(jpg, {
      x: 0,
      y: 0,
      width: baseViewport.width,
      height: baseViewport.height,
    });
  }

  if (settings.removeMetadata) {
    sanitizeMetadata(outPdf);
  }

  return outPdf.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
  });
}

export async function compressPdfBytes(pdfBytes, level = 'medium') {
  const settings = COMPRESSION_LEVELS[level] || COMPRESSION_LEVELS.medium;

  if (level === 'none') {
    return new Uint8Array(pdfBytes);
  }

  if (settings.mode === 'lossless') {
    return applyLosslessCompression(pdfBytes, settings);
  }

  return applyRasterCompression(pdfBytes, settings);
}

export async function compressPdf(file, level = 'medium') {
  const arrayBuffer = await file.arrayBuffer();
  return compressPdfBytes(arrayBuffer, level);
}

export function getCompressionStats(originalSize, compressedSize) {
  const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
  return {
    originalSize: (originalSize / 1024 / 1024).toFixed(2),
    compressedSize: (compressedSize / 1024 / 1024).toFixed(2),
    ratio: `${ratio}%`,
    saved: ((originalSize - compressedSize) / 1024 / 1024).toFixed(2),
  };
}
