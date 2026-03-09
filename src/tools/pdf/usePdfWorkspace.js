import { useState } from 'react';
import { PDFDocument, degrees, PDFPage } from 'pdf-lib';
import { nanoid } from 'nanoid';
import { pdfjsLib } from './pdfjs';
import { generatePdfFromPrompt } from './generatePdfFromPrompt';

export function usePdfWorkspace() {
  const [files, setFiles] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);

  const addFiles = async (newFiles) => {
    setLoading(true);

    const newPages = [];

    for (let fileIndex = 0; fileIndex < newFiles.length; fileIndex++) {
      const file = newFiles[fileIndex];
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();

      for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
       newPages.push({
          id: nanoid(), // ← stable unique ID
          file,
          fileIndex,
          pageIndex,
          // thumbnail: null,
          selected: false,
          rotation: 0, // degrees
          signatures: [], // ← NEW
          texts: [],
        });
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setPages((prev) => [...prev, ...newPages]);
    setLoading(false);
    return newPages.map((page) => page.id);
  };

  const addGeneratedPdfFromPrompt = async (prompt, aiModel = null) => {
    const generatedFile = await generatePdfFromPrompt(prompt, aiModel);
    const pageIds = await addFiles([generatedFile]);
    return { generatedFile, pageIds };
  };

  const resetWorkspace = () => {
    setFiles([]);
    setPages([]);
  };

  const togglePageSelection = (id) => {
  setPages((prev) =>
    prev.map((page) =>
      page.id === id
        ? { ...page, selected: !page.selected }
        : page
    )
  );
};

const clearSelection = () => {
  setPages((prev) =>
    prev.map((page) => ({ ...page, selected: false }))
  );
};

const mergeAndExport = async () => {
  const pagesToMerge = pages.filter(
    (page) => page.selected || pages.every(p => !p.selected)
  );

  if (pagesToMerge.length === 0) return;

  const mergedPdf = await PDFDocument.create();

  for (const page of pagesToMerge) {
    // Load the original PDF page
    const arrayBuffer = await page.file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const [copiedPage] = await mergedPdf.copyPages(
      pdf,
      [page.pageIndex]
    );
    copiedPage.setRotation(
      degrees(page.rotation)
    );
    
    // If there are signatures for this page, render them on canvas and embed
    if (page.signatures && page.signatures.length > 0) {
      // Create a temporary canvas to render the page with signatures
      const canvas = typeof document !== 'undefined' 
        ? document.createElement('canvas')
        : null;
      
      if (canvas) {
        try {
          // Render the page using PDF.js
          const pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
          const pdfPage = await pdfDoc.getPage(page.pageIndex + 1);
          const scale = 2; // Higher resolution for export
          const viewport = pdfPage.getViewport({ scale });
          
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          const context = canvas.getContext('2d');
          const renderTask = pdfPage.render({
            canvasContext: context,
            viewport,
          });
          
          await renderTask.promise;
          
          // Draw signatures on top
          for (const sig of page.signatures) {
            const sigImg = new Image();
            await new Promise((resolve, reject) => {
              sigImg.onload = resolve;
              sigImg.onerror = reject;
              sigImg.src = sig.dataUrl;
            });
            
            // Calculate signature dimensions on the canvas
            const sigX = (sig.x || 0) * viewport.width;
            const sigY = (sig.y || 0) * viewport.height;
            const sigWidth = (sig.width || 0.2) * viewport.width;
            const sigHeight = (sigImg.height / sigImg.width) * sigWidth;
            
            context.drawImage(sigImg, sigX, sigY, sigWidth, sigHeight);
          }
          
          // Embed the canvas as an image in the PDF
          const pngData = canvas.toDataURL('image/png');
          const pngImage = await mergedPdf.embedPng(pngData);
          
          const { width, height } = copiedPage.getSize();
          copiedPage.drawImage(pngImage, 0, 0, width, height);
        } catch (err) {
          console.error('Error rendering signatures on page:', err);
          // Continue without signatures if there's an error
        }
      }
    }
    
    mergedPdf.addPage(copiedPage);
  }

  const mergedBytes = await mergedPdf.save();
  const blob = new Blob([mergedBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'merged.pdf';
  link.click();

  URL.revokeObjectURL(url);
};

const deleteSelectedPages = () => {
  setPages((prev) => prev.filter((page) => !page.selected));
};

const rotateSelectedPages = (direction = 'right') => {
  setPages((prev) =>
    prev.map((page) => {
      if (!page.selected) return page;

      const delta = direction === 'right' ? 90 : -90;
      return {
        ...page,
        rotation: (page.rotation + delta + 360) % 360,
      };
    })
  );
};

const reorderPages = (fromIndex, toIndex) => {
  setPages((pages) => {
    const updated = Array.from(pages);
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    return updated;
  });
};

const addSignatureToPage = (pageId, signature) => {
  const signatureId =
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : nanoid();

  setPages((pages) =>
    pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            signatures: [
              ...page.signatures,
              {
                id: signatureId,
                ...signature,
                rotation: Number(signature.rotation) || 0,
              },
            ],
          }
        : page
    )
  );
};

const updateSignatureRotation = (pageId, signatureId, rotation) => {
  const normalized = ((Number(rotation) || 0) % 360 + 360) % 360;
  setPages((pages) =>
    pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            signatures: page.signatures.map((sig) =>
              sig.id === signatureId ? { ...sig, rotation: normalized } : sig
            ),
          }
        : page
    )
  );
};

const updateSignaturePosition = (pageId, signatureId, x, y) => {
  setPages((pages) =>
    pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            signatures: page.signatures.map((sig) =>
              sig.id === signatureId ? { ...sig, x, y } : sig
            ),
          }
        : page
    )
  );
};

const updateSignatureSize = (pageId, signatureId, width) => {
  const clampedWidth = Math.max(0.05, Math.min(1, width));

  setPages((pages) =>
    pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            signatures: page.signatures.map((sig) =>
              sig.id === signatureId ? { ...sig, width: clampedWidth } : sig
            ),
          }
        : page
    )
  );
};

const addTextToPage = (pageId, textAnnotation) => {
  const textId =
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : nanoid();

  setPages((pages) =>
    pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            texts: [
              ...(page.texts || []),
              {
                id: textId,
                text: textAnnotation.text || '',
                x: textAnnotation.x || 0.1,
                y: textAnnotation.y || 0.1,
                fontSize: textAnnotation.fontSize || 14,
                color: textAnnotation.color || '#111111',
                fontWeight: textAnnotation.fontWeight || '400',
                italic: Boolean(textAnnotation.italic),
                underline: Boolean(textAnnotation.underline),
                strikethrough: Boolean(textAnnotation.strikethrough),
                fontFamily: textAnnotation.fontFamily || 'Helvetica, Arial, sans-serif',
                rotation: Number(textAnnotation.rotation) || 0,
                boxWidthNorm: Number(textAnnotation.boxWidthNorm) || 0,
                boxHeightNorm: Number(textAnnotation.boxHeightNorm) || 0,
                pageIndex: typeof textAnnotation.pageIndex === 'number' ? textAnnotation.pageIndex : page.pageIndex,
              },
            ],
          }
        : page
    )
  );
};

const updateTextRotation = (pageId, textId, rotation) => {
  const normalized = ((Number(rotation) || 0) % 360 + 360) % 360;
  setPages((pages) =>
    pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            texts: (page.texts || []).map((item) =>
              item.id === textId ? { ...item, rotation: normalized } : item
            ),
          }
        : page
    )
  );
};

const updateTextPosition = (pageId, textId, x, y) => {
  setPages((pages) =>
    pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            texts: (page.texts || []).map((item) =>
              item.id === textId ? { ...item, x, y } : item
            ),
          }
        : page
    )
  );
};

const updateTextContent = (pageId, textId, updates) => {
  setPages((pages) =>
    pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            texts: (page.texts || []).map((item) =>
              item.id === textId ? { ...item, ...updates } : item
            ),
          }
        : page
    )
  );
};

const removeTextFromPage = (pageId, textId) => {
  setPages((pages) =>
    pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            texts: (page.texts || []).filter((item) => item.id !== textId),
          }
        : page
    )
  );
};

// const previewUrl = URL.createObjectURL(file);

  return {
    files,
    pages,
    loading,
    addFiles,
    addGeneratedPdfFromPrompt,
    resetWorkspace,
    togglePageSelection,
    clearSelection,
    mergeAndExport,
    deleteSelectedPages,
    rotateSelectedPages,
    reorderPages,
    addSignatureToPage,
    updateSignaturePosition,
    updateSignatureSize,
    updateSignatureRotation,
    addTextToPage,
    updateTextPosition,
    updateTextContent,
    updateTextRotation,
    removeTextFromPage,
    //  previewUrl,
  };

}
