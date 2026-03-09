import { usePdfWorkspace } from '../tools/pdf/usePdfWorkspace';
import PageThumbnail from '../tools/pdf/PageThumbnail';

// import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import SignatureModal from '../tools/pdf/signature/SignatureModal';
import ExportModal from '../tools/pdf/ExportModal';
import { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PagePreview from '../tools/pdf/PagePreview';
import { exportPdf } from '../tools/pdf/exportPdf';
import { useSeo } from '../hooks/useSeo';
import { getExportCount, incrementExportCount } from '../tools/analytics/exportCounter';




function PDFWorkspace() {
useSeo({
  title: 'PDF Workspace',
  description:
    'Upload, reorder, rotate, sign, and export PDF pages in one browser-based workspace.',
  path: '/pdf-workspace',
});

// const {
//   files,
//   pages,
//   loading,
//   addFiles,
//   resetWorkspace,
//   togglePageSelection,
//   mergeAndExport,
//   deleteSelectedPages,
//   rotateSelectedPages,
//   reorderPages,
//   addSignatureToPage,
//   updateSignaturePosition,
// } = usePdfWorkspace();

const {
  files,
  pages,
  loading,
  addFiles,
  resetWorkspace,
  togglePageSelection,
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
} = usePdfWorkspace();

  const processUploadedFiles = (incomingFiles = []) => {
    const uploadedFiles = incomingFiles.filter(
      (file) => file && file.type === 'application/pdf'
    );
    if (uploadedFiles.length > 0) {
      addFiles(uploadedFiles);
      setLastActionLabel('Uploaded PDF');
    }
  };

  const handleUpload = (e) => {
    processUploadedFiles(Array.from(e.target.files || []));
  };

  const onDragEnd = (result) => {
  if (!result.destination) return;

  reorderPages(
    result.source.index,
    result.destination.index
  );
  setLastActionLabel('Reordered Pages');
};

// const { signatureDataUrl, saveSignature } = useSignature();
const [signatureModalOpen, setSignatureModalOpen] = useState(false);
const [exportModalOpen, setExportModalOpen] = useState(false);
const [isExporting, setIsExporting] = useState(false);
const [textToolActive, setTextToolActive] = useState(false);
const [lastActionLabel, setLastActionLabel] = useState('Processed PDF');
const [activePageId, setActivePageId] = useState(null);
const [exportCount, setExportCount] = useState(0);
const [isDragOverUpload, setIsDragOverUpload] = useState(false);
const activePage = pages.find((p) => p.id === activePageId);
const previewPage = activePage || pages[0] || null;



useEffect(() => {
  if (pages.length === 0) {
    setActivePageId(null);
    return;
  }

  const activeStillExists = pages.some((p) => p.id === activePageId);
  if (!activeStillExists) {
    setActivePageId(pages[0].id);
  }
}, [pages, activePageId]);

useEffect(() => {
  let cancelled = false;
  getExportCount()
    .then((count) => {
      if (!cancelled) {
        setExportCount(count);
      }
    })
    .catch(() => {
      // Non-critical analytics path: ignore failures.
    });

  return () => {
    cancelled = true;
  };
}, []);

const handleExportClick = () => {
  console.log('Export clicked, pages:', pages.length);
  if (pages.length === 0) {
    console.log('No pages to export');
    return;
  }
  console.log('Opening export modal...');
  setExportModalOpen(true);
};

const handleExport = async (options = {}) => {
  console.log('handleExport called with options:', options);
  if (pages.length === 0) {
    console.log('No pages to export');
    return;
  }
  setIsExporting(true);

  try {
    // Determine which pages to export: selected pages or all if none selected
    const hasSelectedPages = pages.some((page) => page.selected);
    const pagesToExport = hasSelectedPages
      ? pages.filter((page) => page.selected)
      : pages;

    console.log('Pages to export:', pagesToExport.length);
    if (pagesToExport.length === 0) {
      console.log('No pages to export after filtering');
      return;
    }

    console.log('Calling exportPdf with page count:', pagesToExport.length);
    const pdfBytes = await exportPdf(pagesToExport, options);
    if (!(pdfBytes instanceof Uint8Array) || pdfBytes.length === 0) {
      throw new Error('Export produced invalid PDF bytes');
    }

    console.log('PDF bytes received:', pdfBytes?.length);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const safeAction = String(lastActionLabel || 'Processed PDF')
      .replace(/[^a-z0-9 ]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    a.download = `Perspective Point of View ${safeAction || 'Processed PDF'}.pdf`;
    a.click();

    URL.revokeObjectURL(url);
    const newCount = await incrementExportCount();
    setExportCount(newCount);
    setExportModalOpen(false);
    console.log('Export completed successfully');
    alert('PDF exported successfully!');
  } catch (err) {
    console.error('Export failed:', err);
    alert('Failed to export PDF: ' + err.message);
  } finally {
    setIsExporting(false);
  }
};


  return (
    <div className="app-container">
      <Header />

      <main>
        {pages.length > 0 && (
      <div className="workspace-toolbar">
        <div className="toolbar-left">
          <button
            onClick={() => {
              rotateSelectedPages('left');
              setLastActionLabel('Rotated Pages');
            }}
            className="toolbar-btn-icon"
            title="Rotate left"
          >
            ↶
          </button>
          <button
            onClick={() => {
              rotateSelectedPages('right');
              setLastActionLabel('Rotated Pages');
            }}
            className="toolbar-btn-icon"
            title="Rotate right"
          >
            ↷
          </button>
          {/* <span className="toolbar-label">Rotate</span> */}
        </div>

        <div className="toolbar-middle">
          <button
            onClick={() => {
              deleteSelectedPages();
              setLastActionLabel('Deleted Pages');
            }}
            className="toolbar-btn-action delete"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Delete page
          </button>
          <button
            onClick={() => {
              setSignatureModalOpen(true);
              setLastActionLabel('Signing Started');
            }}
            className="toolbar-btn-action sign"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 21h6l11-11a2.121 2.121 0 0 0-3-3L6 18v3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 6l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Sign PDF
          </button>
          <button
            onClick={() => {
              setTextToolActive((prev) => !prev);
              setLastActionLabel('Text Tool Used');
            }}
            className={`toolbar-btn-action text ${textToolActive ? 'active' : ''}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 6h16M12 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add Text
          </button>
          <div className="zoom-control"> <span className="zoom-icon"></span></div>
        </div>

        <div className="toolbar-right">
          <button
            onClick={resetWorkspace}
            className="toolbar-btn-reset"
          >
            Reset
          </button>
        </div>
      </div>
      )}

      {pages.length === 0 && (
        <section className="hero">
          <div className="inner text-center">
            <h1 className="hero-title">PDF Workplace</h1>
            <p className="hero-sub">Merge, reorder, rotate, sign and organise your PDF pages all in one place</p>
            <p className="subtle">Your files never leave your device</p>

            <div className="upload-wrap" style={{marginTop:36}}>
              <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={handleUpload}
                className="hidden"
                id="pdf-upload"
              />

              <label
                htmlFor="pdf-upload"
                className={`upload-large drop-zone ${isDragOverUpload ? 'is-drag-over' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOverUpload(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOverUpload(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragOverUpload(false);
                  processUploadedFiles(Array.from(e.dataTransfer?.files || []));
                }}
              >
                <div className="upload-inner">
                  <div className="dashed">
                    {isDragOverUpload
                      ? 'Drop your PDF files here'
                      : 'Upload one or more PDF files to get started (or drag and drop)'}
                  </div>
                </div>
              </label>
            </div>

            <div className="export-counter-wrap">
              <div className="text-sm text-gray-600">Forms exported to date. Give us a try.</div>
              <div className="export-count">{String(exportCount).padStart(2, '0')}</div>
            </div>
          </div>
        </section>
      )}

      {/* Uploaded Files List (temporary UI) */}
      {loading && (
        <p className="text-sm text-gray-500">
          Processing PDFs…
        </p>
      )}

      {pages.length > 0 && (
        <div className="pdf-workspace-layout">
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleUpload}
            className="hidden"
            id="pdf-upload-mobile"
          />
          {/* LEFT: Thumbnails */}
          <div className="workspace-sidebar">
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleUpload}
              className="hidden"
              id="pdf-upload-more"
            />
            <label htmlFor="pdf-upload-more" className="upload-more-btn">
              + Upload more PDFs
            </label>

            {/* <h2 className="sidebar-title">
              Pages ({pages.length})
            </h2> */}

            <p>✥ Drag to reorder</p> 

            <div className="workspace-thumbnails-scroll">
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="pages" direction="vertical">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="grid grid-cols-2 gap-y-0 gap-x-6"

                    >
                      {pages.map((page, index) => (
                        <Draggable
                          key={page.id}
                          draggableId={page.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="thumbnail-item relative m-0 p-0"
                            >
                              {/* Drag handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab select-none m-0 p-0 leading-none"
                              >
                              
                                {/* Thumbnail card */}
                                <div
                                  onClick={() => setActivePageId(page.id)}
                                  className={`thumbnail-card cursor-pointer p-0 rounded-lg transition relative border-2
                                      ${
                                        activePageId === page.id
                                          ? 'border-[#FF5F3A]'
                                          : 'border-transparent'

                                    }`}
                                >
                                  {/* Selection checkbox */}
                                  <input
                                    type="checkbox"
                                    checked={page.selected}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      togglePageSelection(page.id);
                                      setActivePageId(page.id);
                                    }}
                                    className="absolute top-1 right-1 w-4 h-4 cursor-pointer z-10"
                                  />

                                 <div className="border-none ring-0 outline-none [&_*]:border-none [&_*]:ring-0">
                                  <PageThumbnail
                                    file={page.file}
                                    pageIndex={page.pageIndex}
                                    rotation={page.rotation}
                                    isActive={activePageId === page.id}
                                  />
                                </div>

                                  <div
                                    className="text-center mt-0 mb-0 text-gray-600 leading-none"
                                    style={{ fontSize: '12px' }}
                                  >
                                    Page {page.pageIndex + 1}
                                  </div>
                                </div>

                              </div>

                            </div>
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            <div className="workspace-sidebar-footer">
              <div>{pages.length} Pages</div>
              <div>{pages.filter(p => p.selected).length} Selected</div>
            </div>
          </div>

          {/* RIGHT: Preview */}
          <div className="workspace-preview">
            <PagePreview
              file={previewPage?.file}
              pageIndex={previewPage?.pageIndex}
              rotation={previewPage?.rotation}
              signatures={previewPage?.signatures || []}
              textAnnotations={previewPage?.texts || []}
              isTextMode={textToolActive}
              onTextToolChange={setTextToolActive}
              onSignatureMove={(signatureId, x, y) => {
                if (previewPage) {
                  updateSignaturePosition(previewPage.id, signatureId, x, y);
                  setLastActionLabel('Moved Signature');
                }
              }}
              onSignatureResize={(signatureId, width) => {
                if (previewPage) {
                  updateSignatureSize(previewPage.id, signatureId, width);
                  setLastActionLabel('Resized Signature');
                }
              }}
              onSignatureRotate={(signatureId, rotation) => {
                if (previewPage) {
                  updateSignatureRotation(previewPage.id, signatureId, rotation);
                  setLastActionLabel('Rotated Signature');
                }
              }}
              onTextAdd={(annotation) => {
                if (previewPage) {
                  addTextToPage(previewPage.id, {
                    ...annotation,
                    pageIndex: previewPage.pageIndex,
                  });
                  setLastActionLabel('Added Text');
                }
              }}
              onTextMove={(textId, x, y) => {
                if (previewPage) {
                  updateTextPosition(previewPage.id, textId, x, y);
                  setLastActionLabel('Moved Text');
                }
              }}
              onTextEdit={(textId, updates) => {
                if (previewPage) {
                  updateTextContent(previewPage.id, textId, updates);
                  setLastActionLabel('Edited Text');
                }
              }}
              onTextDelete={(textId) => {
                if (previewPage) {
                  removeTextFromPage(previewPage.id, textId);
                  setLastActionLabel('Deleted Text');
                }
              }}
              onTextRotate={(textId, rotation) => {
                if (previewPage) {
                  updateTextRotation(previewPage.id, textId, rotation);
                  setLastActionLabel('Rotated Text');
                }
              }}
            />
          </div>

          <div className="workspace-actions">
            <button
              onClick={handleExportClick}
              className="export-pdf-btn"
            >
              Export PDF
            </button>
          </div>
        </div>
      )}

      {pages.length > 0 && (
        <div className="mobile-fab-bar">
          <label
            htmlFor="pdf-upload-mobile"
            className="mobile-fab-upload"
            aria-label="Upload more PDFs"
            title="Upload more PDFs"
          >
            +
          </label>
          <button
            type="button"
            onClick={handleExportClick}
            className="mobile-fab-export"
          >
            Export PDF
          </button>
        </div>
      )}

      {/* Signature Modal */}
      <SignatureModal
        isOpen={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onSave={(dataUrl) => {
          if (previewPage) {
            addSignatureToPage(previewPage.id, {
              dataUrl,
              pageIndex: previewPage.pageIndex,
              x: 0.1,
              y: 0.1,
              width: 0.2,
            });
            setLastActionLabel('Signed PDF');
          }
          setSignatureModalOpen(false);
        }}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExport}
        isExporting={isExporting}
      />
      </main>

      <Footer />
    </div>
  );
}

export default PDFWorkspace;
