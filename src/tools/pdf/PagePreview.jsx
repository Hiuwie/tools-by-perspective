// import { useEffect, useRef, useState } from 'react';
// import { pdfjsLib } from './pdfjs';

// function PagePreview({ file, pageIndex = 0, rotation = 0, signatures = [], onSignatureMove }) {
//   const canvasRef = useRef(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(false);
//   // const [scale, setScale] = useState(1.0);
//   const [scale, setScale] = useState('auto'); // auto = fit page

//   const [mounted, setMounted] = useState(false);
//   const [draggingSignature, setDraggingSignature] = useState(null);
//   const containerRef = useRef(null);


//   const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

//   useEffect(() => {
//   if (!containerRef.current) return;

//   const observer = new ResizeObserver(entries => {
//     const rect = entries[0].contentRect;
//     setContainerSize({
//       width: rect.width,
//       height: rect.height,
//     });
//   });

//   observer.observe(containerRef.current);

//   return () => observer.disconnect();
// }, []);


//   useEffect(() => {
//   const handleResize = () => {
//     if (scale === 'auto') {
//       setScale('auto');
//     }
//   };

//   window.addEventListener('resize', handleResize);
//   return () => window.removeEventListener('resize', handleResize);
// }, [scale]);


//   // Ensure canvas is mounted first
//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   useEffect(() => {
//     if (!file || !mounted || !canvasRef.current) {
//       return;
//     }

//     let cancelled = false;

//     const renderPreview = async () => {
//       try {
//         setLoading(true);
//         setError(false);

//         const arrayBuffer = await file.arrayBuffer();
//         const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
//         const page = await pdf.getPage(pageIndex + 1);

//         if (cancelled) return;

//         const canvas = canvasRef.current;
//         if (!canvas) {
//           console.error('Canvas not found');
//           setError(true);
//           setLoading(false);
//           return;
//         }

//         // const viewport = page.getViewport({ scale });
        
//         const context = canvas.getContext('2d');
//         // canvas.width = viewport.width;
//         // canvas.height = viewport.height;


//         // const container = containerRef.current;
//         // if (!container) return;

//         // // Unscaled page
//         // const unscaledViewport = page.getViewport({ scale: 1 });

//         // // Fit to WIDTH (like Chrome)
//         // const fitScale = container.clientWidth / unscaledViewport.width;

//         // // Respect zoom
//         // const finalScale =
//         //   scale === 'auto'
//         //     ? fitScale
//         //     : fitScale * scale;

//         // const viewport = page.getViewport({ scale: finalScale });

//         if (!containerSize.width || !containerSize.height) return;

// const unscaledViewport = page.getViewport({ scale: 1 });

// const fitScale =
//   containerSize.width / unscaledViewport.width;

// const finalScale =
//   scale === 'auto'
//     ? fitScale
//     : fitScale * scale;

// const viewport = page.getViewport({ scale: finalScale });



        
       

//         const renderTask = page.render({
//           canvasContext: context,
//           viewport,
//         });

//         await renderTask.promise;
//         setLoading(false);

//         // Ensure the preview scrolls to the top so the page start is visible
//         try {
//           if (containerRef?.current) {
//             containerRef.current.scrollTop = 0;
//             containerRef.current.scrollLeft = 0;
//           }

//           if (canvasRef?.current && typeof canvasRef.current.scrollIntoView === 'function') {
//             canvasRef.current.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'auto' });
//           }
//         } catch (e) {
//           console.warn('Failed to scroll preview to top:', e);
//         }
//       } catch (err) {
//         console.error('Preview render error:', err);
//         if (!cancelled) {
//           setError(true);
//           setLoading(false);
//         }
//       }
//     };

//     renderPreview();

//     return () => {
//       cancelled = true;
//     };
//   }, [file, pageIndex, scale, mounted, containerSize]);

//   // Handle signature dragging - MUST be before early returns
//   useEffect(() => {
//     if (!draggingSignature) return;

//     const handleMouseMove = (e) => {
//       const deltaX = (e.clientX - draggingSignature.startX) / (containerRef.current?.offsetWidth || 1);
//       const deltaY = (e.clientY - draggingSignature.startY) / (containerRef.current?.offsetHeight || 1);
      
//       const newX = Math.max(0, Math.min(0.95, draggingSignature.currentX + deltaX));
//       const newY = Math.max(0, Math.min(0.95, draggingSignature.currentY + deltaY));
      
//       if (onSignatureMove) {
//         onSignatureMove(draggingSignature.id, newX, newY);
//       }
//     };

//     const handleMouseUp = () => {
//       setDraggingSignature(null);
//     };

//     document.addEventListener('mousemove', handleMouseMove);
//     document.addEventListener('mouseup', handleMouseUp);

//     return () => {
//       document.removeEventListener('mousemove', handleMouseMove);
//       document.removeEventListener('mouseup', handleMouseUp);
//     };
//   }, [draggingSignature, onSignatureMove]);

//   if (!file) {
//     return (
//       <div className="text-gray-400 text-sm h-full flex items-center justify-center">
//         Select a page to preview
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="text-red-600 text-sm h-full flex items-center justify-center">
//         Failed to load preview
//       </div>
//     );
//   }

//   return (
//     <div className="relative w-full h-full flex flex-col">
//       {/* Controls */}
//       <div className="flex gap-2 mb-4">
//         <button
//           onClick={() => {
//             // Scroll to top with 20% padding
//             const container = containerRef.current;
//             const canvas = canvasRef.current;
//             if (container && canvas) {
//               const pad = Math.round(container.clientHeight * 0.2);
//               const top = Math.max(0, canvas.offsetTop - pad);
//               container.scrollTop = top;
//             }
//           }}
//           className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
//         >
//           ↑ Top
//         </button>
//         <button
//           // onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
//           onClick={() => setScale(s => 
//             s === 'auto' ? 0.75 : Math.max(0.5, s - 0.25)
//           )}

//           className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
//         >
//           −
//         </button>
//         <span className="px-3 py-1 text-sm text-gray-600">
//           {/* {Math.round(scale * 100)}% */}
//           {/* {scale === 'auto' ? 'Fit' : `${Math.round(scale * 100)}%`} */}
//           {scale === 'auto' ? 'Fit' : `${Math.round(scale * 100)}%`}


//         </span>
//         <button
//           // onClick={() => setScale(s => Math.min(3, s + 0.25))}
//           onClick={() => setScale(s => 
//             s === 'auto' ? 1.25 : Math.min(3, s + 0.25)
//           )}

//           className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
//         >
//           +
//         </button>
//         <button
//           onClick={() => {
//             // Scroll to bottom with 20% padding
//             const container = containerRef.current;
//             const canvas = canvasRef.current;
//             if (container && canvas) {
//               const pad = Math.round(container.clientHeight * 0.2);
//               const bottom = Math.min(container.scrollHeight, canvas.offsetTop + canvas.clientHeight - container.clientHeight + pad);
//               container.scrollTop = bottom;
//             }
//           }}
//           className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300"
//         >
//           ↓ Bottom
//         </button>
//       </div>

//       {/* Canvas container with signatures overlay */}
//       <div 
//         ref={containerRef}
//         // className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 rounded border relative"
//         // className="flex-1 overflow-auto flex items-center justify-center bg-gray-200 relative"
//         className="flex-1 overflow-auto flex justify-center bg-gray-200 relative bg-blue-100 rounded border relative"


//       >
//         <div style={{ position: 'relative', display: 'inline-block' }}>
//           <canvas
//             ref={canvasRef}
//             style={{
//               transform: `rotate(${rotation}deg)`,
//               display: loading ? 'none' : 'block',
//               maxHeight: '100%',
//               maxWidth: '100%',
//             }}
//             // className="bg-white shadow-lg"
//             className="bg-white shadow-xl"

//           />
          
//           {/* Signatures overlay */}
//           {/* {!loading && signatures.map((sig) => ( */}
//           {!loading &&
//               signatures
//                 .filter(sig => sig.pageIndex === pageIndex)
//                 .map(sig => (
//             <img
//               key={sig.id}
//               src={sig.dataUrl}
//               alt="Signature"
//               onMouseDown={(e) => {
//                 e.preventDefault();
//                 setDraggingSignature({
//                   id: sig.id,
//                   startX: e.clientX,
//                   startY: e.clientY,
//                   currentX: sig.x || 0,
//                   currentY: sig.y || 0,
//                 });
//               }}
//               style={{
//                 position: 'absolute',
//                 left: `${(sig.x || 0) * 100}%`,
//                 top: `${(sig.y || 0) * 100}%`,
//                 width: `${(sig.width || 0.2) * 100}%`,
//                 cursor: 'move',
//                 userSelect: 'none',
//               }}
//               className="opacity-90 hover:opacity-100 transition"
//             />
//           ))}
//         </div>

//         {loading && (
//           <div className="text-gray-500 text-sm absolute">
//             Loading page...
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default PagePreview;



import { useEffect, useRef, useState } from "react";
import { pdfjsLib } from "./pdfjs";

function PagePreview({
  file,
  pageIndex = 0,
  rotation = 0,
  signatures = [],
  textAnnotations = [],
  isTextMode = false,
  onTextToolChange,
  onSignatureMove,
  onSignatureResize,
  onSignatureRotate,
  onTextAdd,
  onTextMove,
  onTextEdit,
  onTextDelete,
  onTextRotate,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pageLayerRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [pdfDoc, setPdfDoc] = useState(null);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [scale, setScale] = useState("auto");
  const [draggingSignature, setDraggingSignature] = useState(null);
  const [resizingSignature, setResizingSignature] = useState(null);
  const [draggingText, setDraggingText] = useState(null);
  const [draftText, setDraftText] = useState(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);
  const [editingPanelPos, setEditingPanelPos] = useState({ x: 12, y: 12 });
  const [draggingEditor, setDraggingEditor] = useState(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [availableFonts, setAvailableFonts] = useState([
    "Helvetica, Arial, sans-serif",
    "Arial, sans-serif",
    "'Times New Roman', Times, serif",
    "Georgia, serif",
    "'Courier New', Courier, monospace",
    "Verdana, sans-serif",
    "Tahoma, sans-serif",
  ]);
  const swatchColors = ["#111111", "#4F46E5", "#0EA5E9", "#059669", "#D97706", "#DC2626"];

  const baseTextStyle = {
    fontSize: 16,
    color: "#111111",
    fontWeight: "400",
    italic: false,
    underline: false,
    strikethrough: false,
    fontFamily: "Helvetica, Arial, sans-serif",
  };

  const fontWeightOptions = [
    { value: "300", label: "Light" },
    { value: "400", label: "Regular" },
    { value: "500", label: "Medium" },
    { value: "600", label: "Semibold" },
    { value: "700", label: "Bold" },
    { value: "800", label: "Extra Bold" },
    { value: "900", label: "Black" },
  ];

  const resolveFontWeight = (weight = "regular") => {
    if (weight === "bold") return 700;
    if (weight === "semibold") return 600;
    if (weight === "regular") return 400;
    const parsed = Number(weight);
    if (Number.isFinite(parsed)) return Math.max(300, Math.min(900, parsed));
    return 400;
  };

  const measureAnnotationBoxPx = (annotation) => {
    if (typeof document === "undefined") return { width: 1, height: 1 };
    const text = String(annotation?.text || "").trim();
    const lines = (text || " ").split(/\r?\n/);
    const size = Math.max(8, Math.min(48, Number(annotation?.fontSize) || 16));
    const style = annotation?.italic ? "italic" : "normal";
    const weight = resolveFontWeight(annotation?.fontWeight);
    const family = String(annotation?.fontFamily || "Helvetica, Arial, sans-serif");
    const lineHeight = size * 1.2;
    const padX = 2;
    const padY = 2;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return { width: 1, height: 1 };
    ctx.font = `${style} ${weight} ${size}px ${family}`;
    const maxLineWidth = Math.max(1, ...lines.map((line) => Math.ceil(ctx.measureText(line).width)));
    return {
      width: Math.max(1, maxLineWidth + padX * 2),
      height: Math.max(1, Math.ceil(lines.length * lineHeight + padY * 2)),
    };
  };

  useEffect(() => {
    if (!isTextMode) return;
    if (draftText || editingTextId) return;

    // Open text editor immediately when text tool is activated.
    setDraftText({
      x: 0.08,
      y: 0.08,
      value: "",
      panelOffsetX: 0,
      panelOffsetY: 0,
      rotation: 0,
      ...baseTextStyle,
    });
  }, [isTextMode, draftText, editingTextId]);

  useEffect(() => {
    if (!draggingEditor) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - draggingEditor.startX;
      const deltaY = e.clientY - draggingEditor.startY;

      if (draggingEditor.type === "draft") {
        setDraftText((prev) =>
          prev
            ? {
                ...prev,
                panelOffsetX: draggingEditor.originX + deltaX,
                panelOffsetY: draggingEditor.originY + deltaY,
              }
            : prev
        );
      } else if (draggingEditor.type === "edit") {
        setEditingPanelPos({
          x: Math.max(0, draggingEditor.originX + deltaX),
          y: Math.max(0, draggingEditor.originY + deltaY),
        });
      }
    };

    const handleMouseUp = () => setDraggingEditor(null);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingEditor]);

  useEffect(() => {
    let cancelled = false;
    const loadLocalFonts = async () => {
      try {
        if (typeof window === "undefined") return;
        if (typeof window.queryLocalFonts !== "function") return;
        const localFonts = await window.queryLocalFonts();
        if (cancelled || !Array.isArray(localFonts)) return;
        const deduped = Array.from(
          new Set(
            localFonts
              .map((font) => String(font?.family || "").trim())
              .filter(Boolean)
          )
        ).slice(0, 60);
        if (deduped.length === 0) return;
        setAvailableFonts((prev) => {
          const merged = new Set(prev);
          deduped.forEach((name) => merged.add(`'${name}', sans-serif`));
          return Array.from(merged);
        });
      } catch {
        // Local font access is optional and browser/permission dependent.
      }
    };
    loadLocalFonts();
    return () => {
      cancelled = true;
    };
  }, []);

  /* -------------------------------------------------------
     1️⃣ Load PDF
  ------------------------------------------------------- */
  useEffect(() => {
    if (!file) return;

    let cancelled = false;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(false);

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        if (!cancelled) setPdfDoc(pdf);
      } catch (err) {
        console.error("PDF load error:", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      setPdfDoc(null);
      setPage(null);
    };
  }, [file]);

  /* -------------------------------------------------------
     2️⃣ Load Page
  ------------------------------------------------------- */
  useEffect(() => {
    if (!pdfDoc) return;

    let cancelled = false;

    const loadPage = async () => {
      try {
        const loadedPage = await pdfDoc.getPage(pageIndex + 1);
        if (!cancelled) setPage(loadedPage);
      } catch (err) {
        console.error("Page load error:", err);
        if (!cancelled) setError(true);
      }
    };

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, pageIndex]);

  /* -------------------------------------------------------
     3️⃣ Render Page
  ------------------------------------------------------- */
  useEffect(() => {
    if (!page || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const unscaledViewport = page.getViewport({ scale: 1, rotation });
    const containerWidth =
      containerRef.current?.clientWidth || unscaledViewport.width;
    const fitScale = containerWidth / unscaledViewport.width;

    const finalScale =
      scale === "auto" ? fitScale : fitScale * scale;

    const devicePixelRatio = window.devicePixelRatio || 1;

    const viewport = page.getViewport({
      scale: finalScale * devicePixelRatio,
      rotation,
    });

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    canvas.style.width = `${viewport.width / devicePixelRatio}px`;
    canvas.style.height = `${viewport.height / devicePixelRatio}px`;
    canvas.style.display = "block";

    setViewportSize({
      width: viewport.width / devicePixelRatio,
      height: viewport.height / devicePixelRatio,
    });

    // Cancel previous render
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    const renderTask = page.render({
      canvasContext: context,
      viewport,
    });

    renderTaskRef.current = renderTask;

    return () => {
      renderTask.cancel();
    };
  }, [page, scale, rotation]);

  /* -------------------------------------------------------
     4️⃣ Signature Dragging (unchanged)
  ------------------------------------------------------- */
  useEffect(() => {
    if (!draggingSignature) return;

    const handlePointerMove = (e) => {
      const pageLayerRect = pageLayerRef.current?.getBoundingClientRect();
      if (!pageLayerRect) return;

      const newX = Math.min(
        1,
        Math.max(
          0,
          draggingSignature.currentX +
            (e.clientX - draggingSignature.startX) / pageLayerRect.width
        )
      );
      const newY = Math.min(
        1,
        Math.max(
          0,
          draggingSignature.currentY +
            (e.clientY - draggingSignature.startY) / pageLayerRect.height
        )
      );

      if (onSignatureMove) {
        onSignatureMove(draggingSignature.id, newX, newY);
      }
    };

    const handlePointerUp = () => setDraggingSignature(null);

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerUp);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [draggingSignature, onSignatureMove]);

  useEffect(() => {
    if (!resizingSignature) return;

    const handlePointerMove = (e) => {
      const pageLayerRect = pageLayerRef.current?.getBoundingClientRect();
      if (!pageLayerRect) return;

      const deltaX = (e.clientX - resizingSignature.startX) / pageLayerRect.width;
      const maxWidth = Math.max(0.05, 1 - (resizingSignature.currentX || 0));
      const newWidth = Math.max(
        0.05,
        Math.min(maxWidth, resizingSignature.currentWidth + deltaX)
      );

      if (onSignatureResize) {
        onSignatureResize(resizingSignature.id, newWidth);
      }
    };

    const handlePointerUp = () => setResizingSignature(null);

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerUp);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [resizingSignature, onSignatureResize]);

  useEffect(() => {
    if (!draggingText) return;

    const handlePointerMove = (e) => {
      const pageLayerRect = pageLayerRef.current?.getBoundingClientRect();
      if (!pageLayerRect) return;

      const newX = Math.min(
        1,
        Math.max(
          0,
          draggingText.currentX +
            (e.clientX - draggingText.startX) / pageLayerRect.width
        )
      );
      const newY = Math.min(
        1,
        Math.max(
          0,
          draggingText.currentY +
            (e.clientY - draggingText.startY) / pageLayerRect.height
        )
      );

      onTextMove?.(draggingText.id, newX, newY);
    };

    const handlePointerUp = () => setDraggingText(null);

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerUp);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [draggingText, onTextMove]);

  /* -------------------------------------------------------
     UI STATES
  ------------------------------------------------------- */
  if (!file) {
    return (
      <div className="text-gray-400 text-sm h-full flex items-center justify-center">
        Select a page to preview
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm h-full flex items-center justify-center">
        Failed to load preview
      </div>
    );
  }

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */
  return (
    <div className="relative w-full h-full flex flex-col">

      {/* Controls */}
      <div className="preview-controls flex gap-2 mb-4">
        <button
          onClick={() => setScale("auto")}
          className="preview-control-btn"
        >
          Fit
        </button>

        <button
          onClick={() =>
            setScale((s) =>
              s === "auto" ? 0.75 : Math.max(0.5, s - 0.25)
            )
          }
          className="preview-control-btn"
        >
          −
        </button>

        <span className="preview-control-pill">
          {scale === "auto" ? "Fit" : `${Math.round(scale * 100)}%`}
        </span>

        <button
          onClick={() =>
            setScale((s) =>
              s === "auto" ? 1.25 : Math.min(3, s + 0.25)
            )
          }
          className="preview-control-btn"
        >
          +
        </button>
      </div>

      {/* Preview Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex justify-center bg-gray-200 relative rounded"
      >
        <div
          ref={pageLayerRef}
          onClick={(e) => {
            if (!isTextMode || !onTextAdd) return;
            if (draftText) return;
            const rect = pageLayerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            setDraftText({
              x: Math.max(0, Math.min(1, x)),
              y: Math.max(0, Math.min(1, y)),
              value: "",
              panelOffsetX: 0,
              panelOffsetY: 0,
              rotation: 0,
              ...baseTextStyle,
            });
          }}
          style={{
            position: "relative",
            width: viewportSize.width ? `${viewportSize.width}px` : "auto",
            height: viewportSize.height ? `${viewportSize.height}px` : "auto",
          }}
        >
          <canvas
            ref={canvasRef}
            className="bg-white shadow-xl"
          />

          {signatures
            .filter((sig) => sig.pageIndex === pageIndex)
            .map((sig) => (
              <div
                key={sig.id}
                style={{
                  position: "absolute",
                  left: `${(sig.x || 0) * 100}%`,
                  top: `${(sig.y || 0) * 100}%`,
                  width: `${(sig.width || 0.2) * 100}%`,
                  transform: `rotate(${sig.rotation || 0}deg)`,
                  transformOrigin: "top left",
                  cursor: draggingSignature?.id === sig.id ? "grabbing" : "move",
                }}
                className="opacity-90 hover:opacity-100 transition select-none"
              >
                <img
                  src={sig.dataUrl}
                  alt="Signature"
                  draggable={false}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDraggingSignature({
                      id: sig.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      currentX: sig.x || 0,
                      currentY: sig.y || 0,
                    });
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    pointerEvents: "auto",
                    touchAction: "none",
                  }}
                />
                <button
                  type="button"
                  aria-label="Rotate signature left"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSignatureRotate?.(sig.id, (sig.rotation || 0) - 15);
                  }}
                  style={{
                    position: "absolute",
                    right: "10px",
                    bottom: "-8px",
                    width: "14px",
                    height: "14px",
                    borderRadius: "9999px",
                    background: "#4b5563",
                    border: "2px solid #fff",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "10px",
                    lineHeight: "10px",
                    padding: 0,
                  }}
                >
                  ↺
                </button>
                <button
                  type="button"
                  aria-label="Rotate signature right"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSignatureRotate?.(sig.id, (sig.rotation || 0) + 15);
                  }}
                  style={{
                    position: "absolute",
                    right: "28px",
                    bottom: "-8px",
                    width: "14px",
                    height: "14px",
                    borderRadius: "9999px",
                    background: "#4b5563",
                    border: "2px solid #fff",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "10px",
                    lineHeight: "10px",
                    padding: 0,
                  }}
                >
                  ↻
                </button>
                <button
                  type="button"
                  aria-label="Resize signature"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setResizingSignature({
                      id: sig.id,
                      startX: e.clientX,
                      currentWidth: sig.width || 0.2,
                      currentX: sig.x || 0,
                    });
                  }}
                  style={{
                    position: "absolute",
                    right: "-8px",
                    bottom: "-8px",
                    width: "14px",
                    height: "14px",
                    borderRadius: "9999px",
                    background: "#2563eb",
                    border: "2px solid #fff",
                    cursor: "nwse-resize",
                    touchAction: "none",
                  }}
                />
              </div>
            ))}

          {textAnnotations
            .filter((item) => item.pageIndex === pageIndex)
            .map((item) => (
              <div
                key={item.id}
                style={{
                  position: "absolute",
                  left: `${(item.x || 0) * 100}%`,
                  top: `${(item.y || 0) * 100}%`,
                  transform: `translateY(0) rotate(${item.rotation || 0}deg)`,
                  transformOrigin: "top left",
                  cursor: draggingText?.id === item.id ? "grabbing" : "move",
                  padding: "4px 6px",
                  borderRadius: "3px",
                  background: "rgba(255,255,255,0.78)",
                  border: "1px dashed rgba(0,0,0,0.12)",
                  touchAction: "none",
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setDraggingText({
                    id: item.id,
                    startX: e.clientX,
                    startY: e.clientY,
                    currentX: item.x || 0,
                    currentY: item.y || 0,
                  });
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingTextId(item.id);
                  const pxX = Math.max(0, Math.round((item.x || 0) * (viewportSize.width || 0)));
                  const pxY = Math.max(0, Math.round((item.y || 0) * (viewportSize.height || 0)));
                  setEditingPanelPos({ x: pxX, y: pxY });
                  setEditingDraft({
                    text: item.text || "",
                    fontSize: item.fontSize || 16,
                    color: item.color || "#111111",
                    fontWeight: String(resolveFontWeight(item.fontWeight)),
                    italic: Boolean(item.italic),
                    underline: Boolean(item.underline),
                    strikethrough: Boolean(item.strikethrough),
                    fontFamily: item.fontFamily || "Helvetica, Arial, sans-serif",
                  });
                }}
                title="Drag to move. Double-click to edit."
              >
                <span
                  style={{
                    color: item.color || "#111111",
                    fontSize: `${item.fontSize || 16}px`,
                    fontWeight: resolveFontWeight(item.fontWeight),
                    fontStyle: item.italic ? "italic" : "normal",
                    textDecoration: `${item.underline ? "underline " : ""}${item.strikethrough ? "line-through" : ""}`.trim() || "none",
                    fontFamily: item.fontFamily || "Helvetica, Arial, sans-serif",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.2,
                    userSelect: "none",
                  }}
                >
                  {item.text}
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = Math.max(10, (item.fontSize || 16) - 1);
                    const rect = pageLayerRef.current?.getBoundingClientRect();
                    const measured = measureAnnotationBoxPx({
                      ...item,
                      fontSize: next,
                    });
                    onTextEdit?.(item.id, {
                      fontSize: next,
                      boxWidthNorm: rect ? Math.min(1, measured.width / rect.width) : item.boxWidthNorm,
                      boxHeightNorm: rect ? Math.min(1, measured.height / rect.height) : item.boxHeightNorm,
                    });
                  }}
                  style={{
                    marginLeft: "6px",
                    border: "none",
                    borderRadius: "9999px",
                    minWidth: "22px",
                    height: "16px",
                    lineHeight: "16px",
                    padding: "0 6px",
                    background: "#f2f2f2",
                    color: "#222",
                    fontSize: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                    verticalAlign: "middle",
                  }}
                >
                  A-
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = Math.min(48, (item.fontSize || 16) + 1);
                    const rect = pageLayerRef.current?.getBoundingClientRect();
                    const measured = measureAnnotationBoxPx({
                      ...item,
                      fontSize: next,
                    });
                    onTextEdit?.(item.id, {
                      fontSize: next,
                      boxWidthNorm: rect ? Math.min(1, measured.width / rect.width) : item.boxWidthNorm,
                      boxHeightNorm: rect ? Math.min(1, measured.height / rect.height) : item.boxHeightNorm,
                    });
                  }}
                  style={{
                    marginLeft: "4px",
                    border: "none",
                    borderRadius: "9999px",
                    minWidth: "22px",
                    height: "16px",
                    lineHeight: "16px",
                    padding: "0 6px",
                    background: "#f2f2f2",
                    color: "#222",
                    fontSize: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                    verticalAlign: "middle",
                  }}
                >
                  A+
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTextRotate?.(item.id, (item.rotation || 0) - 15);
                  }}
                  style={{
                    marginLeft: "4px",
                    border: "none",
                    borderRadius: "9999px",
                    minWidth: "20px",
                    height: "16px",
                    lineHeight: "16px",
                    padding: "0 4px",
                    background: "#f2f2f2",
                    color: "#222",
                    fontSize: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                    verticalAlign: "middle",
                  }}
                >
                  ↺
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTextRotate?.(item.id, (item.rotation || 0) + 15);
                  }}
                  style={{
                    marginLeft: "4px",
                    border: "none",
                    borderRadius: "9999px",
                    minWidth: "20px",
                    height: "16px",
                    lineHeight: "16px",
                    padding: "0 4px",
                    background: "#f2f2f2",
                    color: "#222",
                    fontSize: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                    verticalAlign: "middle",
                  }}
                >
                  ↻
                </button>
                <button
                  type="button"
                  aria-label="Delete text"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTextDelete?.(item.id);
                  }}
                  style={{
                    marginLeft: "6px",
                    border: "none",
                    borderRadius: "9999px",
                    width: "16px",
                    height: "16px",
                    lineHeight: "16px",
                    padding: 0,
                    background: "#ff5f3a",
                    color: "#fff",
                    fontSize: "11px",
                    cursor: "pointer",
                    verticalAlign: "middle",
                  }}
                >
                  ×
                </button>
              </div>
            ))}

          {draftText ? (
            <div
              style={{
                position: "absolute",
                left: `calc(${(draftText.x || 0) * 100}% + ${(draftText.panelOffsetX || 0)}px)`,
                top: `calc(${(draftText.y || 0) * 100}% + ${(draftText.panelOffsetY || 0)}px)`,
                transform: "translateY(0)",
                zIndex: 20,
                background: "#fff",
                borderRadius: "6px",
                boxShadow: "0 8px 22px rgba(0,0,0,0.22)",
                border: "1px solid #ebebeb",
                padding: "8px",
                minWidth: "220px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <textarea
                value={draftText.value}
                onChange={(e) =>
                  setDraftText((prev) => (prev ? { ...prev, value: e.target.value } : prev))
                }
                placeholder="Type text..."
                rows={3}
                style={{
                  width: "100%",
                  resize: "vertical",
                  border: "1px solid #d9d9d9",
                  borderRadius: "4px",
                  padding: "6px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
                autoFocus
              />
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDraggingEditor({
                    type: "draft",
                    startX: e.clientX,
                    startY: e.clientY,
                    originX: draftText.panelOffsetX || 0,
                    originY: draftText.panelOffsetY || 0,
                  });
                }}
                style={{
                  marginTop: "8px",
                  marginBottom: "4px",
                  padding: "4px 6px",
                  borderRadius: "4px",
                  background: "#f5f5f5",
                  fontSize: "11px",
                  color: "#555",
                  cursor: "move",
                  userSelect: "none",
                }}
              >
                Drag editor
              </div>
              <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <select
                  value={draftText.fontWeight}
                  onChange={(e) => setDraftText((prev) => (prev ? { ...prev, fontWeight: e.target.value } : prev))}
                  style={{ border: "1px solid #d9d9d9", borderRadius: "4px", padding: "4px 6px", fontSize: "12px" }}
                >
                  {fontWeightOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={draftText.fontFamily}
                  onChange={(e) => setDraftText((prev) => (prev ? { ...prev, fontFamily: e.target.value } : prev))}
                  style={{ border: "1px solid #d9d9d9", borderRadius: "4px", padding: "4px 6px", fontSize: "12px", maxWidth: "180px" }}
                >
                  {availableFonts.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font.replace(/['"]/g, "").split(",")[0]}
                    </option>
                  ))}
                </select>
                <button type="button" className={`preview-control-btn ${draftText.italic ? "active" : ""}`} onClick={() => setDraftText((prev) => (prev ? { ...prev, italic: !prev.italic } : prev))}>I</button>
                <button type="button" className={`preview-control-btn ${draftText.underline ? "active" : ""}`} onClick={() => setDraftText((prev) => (prev ? { ...prev, underline: !prev.underline } : prev))}>U</button>
                <button type="button" className={`preview-control-btn ${draftText.strikethrough ? "active" : ""}`} onClick={() => setDraftText((prev) => (prev ? { ...prev, strikethrough: !prev.strikethrough } : prev))}>S</button>
                <input
                  type="number"
                  min="10"
                  max="48"
                  value={draftText.fontSize}
                  onChange={(e) => setDraftText((prev) => (prev ? { ...prev, fontSize: Number(e.target.value) || 16 } : prev))}
                  style={{ width: "64px", border: "1px solid #d9d9d9", borderRadius: "4px", padding: "4px 6px", fontSize: "12px" }}
                />
                {swatchColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setDraftText((prev) => (prev ? { ...prev, color } : prev))}
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "9999px",
                      border: draftText.color === color ? "2px solid #111" : "1px solid #ddd",
                      background: color,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
              <div style={{ marginTop: "8px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setDraftText(null)}
                  className="preview-control-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const value = String(draftText.value || "").trim();
                    if (!value) return;
                    const rect = pageLayerRef.current?.getBoundingClientRect();
                    const measured = measureAnnotationBoxPx({
                      ...draftText,
                      text: value,
                    });
                    onTextAdd?.({
                      text: value,
                      x: draftText.x,
                      y: draftText.y,
                      fontSize: draftText.fontSize,
                      color: draftText.color,
                      fontWeight: draftText.fontWeight,
                      italic: draftText.italic,
                      underline: draftText.underline,
                      strikethrough: draftText.strikethrough,
                      fontFamily: draftText.fontFamily,
                      rotation: draftText.rotation || 0,
                      boxWidthNorm: rect ? Math.min(1, measured.width / rect.width) : 0,
                      boxHeightNorm: rect ? Math.min(1, measured.height / rect.height) : 0,
                    });
                    setDraftText(null);
                    onTextToolChange?.(false);
                  }}
                  className="preview-control-btn active"
                >
                  Add
                </button>
              </div>
            </div>
          ) : null}

          {editingTextId ? (
            <div
              style={{
                position: "absolute",
                left: `${editingPanelPos.x}px`,
                top: `${editingPanelPos.y}px`,
                zIndex: 20,
                background: "#fff",
                borderRadius: "6px",
                boxShadow: "0 8px 22px rgba(0,0,0,0.22)",
                border: "1px solid #ebebeb",
                padding: "8px",
                minWidth: "260px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <textarea
                value={editingDraft?.text || ""}
                onChange={(e) => setEditingDraft((prev) => (prev ? { ...prev, text: e.target.value } : prev))}
                rows={3}
                style={{
                  width: "100%",
                  resize: "vertical",
                  border: "1px solid #d9d9d9",
                  borderRadius: "4px",
                  padding: "6px",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
                autoFocus
              />
              <div
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDraggingEditor({
                    type: "edit",
                    startX: e.clientX,
                    startY: e.clientY,
                    originX: editingPanelPos.x,
                    originY: editingPanelPos.y,
                  });
                }}
                style={{
                  marginTop: "8px",
                  marginBottom: "4px",
                  padding: "4px 6px",
                  borderRadius: "4px",
                  background: "#f5f5f5",
                  fontSize: "11px",
                  color: "#555",
                  cursor: "move",
                  userSelect: "none",
                }}
              >
                Drag editor
              </div>
              <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <select
                  value={editingDraft?.fontWeight || "400"}
                  onChange={(e) => setEditingDraft((prev) => (prev ? { ...prev, fontWeight: e.target.value } : prev))}
                  style={{ border: "1px solid #d9d9d9", borderRadius: "4px", padding: "4px 6px", fontSize: "12px" }}
                >
                  {fontWeightOptions.map((option) => (
                    <option key={`edit-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={editingDraft?.fontFamily || "Helvetica, Arial, sans-serif"}
                  onChange={(e) => setEditingDraft((prev) => (prev ? { ...prev, fontFamily: e.target.value } : prev))}
                  style={{ border: "1px solid #d9d9d9", borderRadius: "4px", padding: "4px 6px", fontSize: "12px", maxWidth: "180px" }}
                >
                  {availableFonts.map((font) => (
                    <option key={`edit-font-${font}`} value={font} style={{ fontFamily: font }}>
                      {font.replace(/['"]/g, "").split(",")[0]}
                    </option>
                  ))}
                </select>
                <button type="button" className={`preview-control-btn ${editingDraft?.italic ? "active" : ""}`} onClick={() => setEditingDraft((prev) => (prev ? { ...prev, italic: !prev.italic } : prev))}>I</button>
                <button type="button" className={`preview-control-btn ${editingDraft?.underline ? "active" : ""}`} onClick={() => setEditingDraft((prev) => (prev ? { ...prev, underline: !prev.underline } : prev))}>U</button>
                <button type="button" className={`preview-control-btn ${editingDraft?.strikethrough ? "active" : ""}`} onClick={() => setEditingDraft((prev) => (prev ? { ...prev, strikethrough: !prev.strikethrough } : prev))}>S</button>
                <input
                  type="number"
                  min="10"
                  max="48"
                  value={editingDraft?.fontSize || 16}
                  onChange={(e) => setEditingDraft((prev) => (prev ? { ...prev, fontSize: Number(e.target.value) || 16 } : prev))}
                  style={{ width: "64px", border: "1px solid #d9d9d9", borderRadius: "4px", padding: "4px 6px", fontSize: "12px" }}
                />
                {swatchColors.map((color) => (
                  <button
                    key={`edit-${color}`}
                    type="button"
                    onClick={() => setEditingDraft((prev) => (prev ? { ...prev, color } : prev))}
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "9999px",
                      border: (editingDraft?.color || "#111111") === color ? "2px solid #111" : "1px solid #ddd",
                      background: color,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
              <div style={{ marginTop: "8px", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTextId(null);
                    setEditingDraft(null);
                  }}
                  className="preview-control-btn"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const value = String(editingDraft?.text || "").trim();
                    if (!value) return;
                    const rect = pageLayerRef.current?.getBoundingClientRect();
                    const measured = measureAnnotationBoxPx({
                      ...editingDraft,
                      text: value,
                    });
                    onTextEdit?.(editingTextId, {
                      text: value,
                      fontSize: editingDraft?.fontSize || 16,
                      color: editingDraft?.color || "#111111",
                      fontWeight: editingDraft?.fontWeight || "400",
                      italic: Boolean(editingDraft?.italic),
                      underline: Boolean(editingDraft?.underline),
                      strikethrough: Boolean(editingDraft?.strikethrough),
                      fontFamily: editingDraft?.fontFamily || "Helvetica, Arial, sans-serif",
                      boxWidthNorm: rect ? Math.min(1, measured.width / rect.width) : undefined,
                      boxHeightNorm: rect ? Math.min(1, measured.height / rect.height) : undefined,
                    });
                    setEditingTextId(null);
                    setEditingDraft(null);
                  }}
                  className="preview-control-btn active"
                >
                  Save
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {loading && (
          <div className="text-gray-500 text-sm absolute">
            Loading page...
          </div>
        )}
      </div>
    </div>
  );
}

export default PagePreview;
