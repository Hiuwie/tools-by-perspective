import { useEffect, useRef, useState } from 'react';
import { pdfjsLib } from './pdfjs';

function PageThumbnail({ file, pageIndex, rotation = 0, isActive = false }) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure canvas is mounted first
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!file || !mounted || !canvasRef.current) {
      return;
    }

    let cancelled = false;

    const renderThumbnail = async () => {
      try {
        setLoading(true);
        setError(false);

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const page = await pdf.getPage(pageIndex + 1);

        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) {
          console.error('Canvas not found');
          setError(true);
          setLoading(false);
          return;
        }

        const viewport = page.getViewport({ scale: 0.35 });
        const context = canvas.getContext('2d');
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderTask = page.render({
          canvasContext: context,
          viewport,
        });

        await renderTask.promise;
        setLoading(false);
      } catch (err) {
        console.error('Thumbnail render error:', err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    renderThumbnail();

    return () => {
      cancelled = true;
    };
  }, [file, pageIndex, mounted]);

  if (!file) {
    return (
      <div className="w-full aspect-[3/4] bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500 border">
        No PDF
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-[3/4] bg-red-100 rounded flex items-center justify-center text-xs text-red-600 border">
        Failed to load
      </div>
    );
  }

  return (
    <div className="w-full aspect-[3/4] bg-white border rounded overflow-hidden flex items-center justify-center">
      <canvas
        ref={canvasRef}
        style={{
          transform: `rotate(${rotation}deg)`,
          display: loading ? 'none' : 'block',
          maxHeight: '100%',
          maxWidth: '100%',
        }}
        className={`transition ${
          isActive ? 'ring-2 ring-blue-400 border-blue-600' : 'border-gray-300'
        }`}
      />
      {loading && (
        <div className="text-xs text-gray-500">Loading...</div>
      )}
    </div>
  );
}

export default PageThumbnail;