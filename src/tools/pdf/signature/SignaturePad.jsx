import { useEffect, useRef } from 'react';
import SignaturePadLib from 'signature_pad';

function SignaturePad({ onSave, onCancel }) {
  const canvasRef = useRef(null);
  const padRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    // Handle high-DPI screens
    const resizeCanvas = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d').scale(ratio, ratio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    padRef.current = new SignaturePadLib(canvas, {
      backgroundColor: 'rgba(0,0,0,0)',
      penColor: 'black',
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      padRef.current?.off();
    };
  }, []);

  const handleClear = () => {
    padRef.current.clear();
  };

  const handleSave = () => {
    if (padRef.current.isEmpty()) return;
    const dataUrl = padRef.current.toDataURL('image/png');
    // onSave(dataUrl);
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="border rounded bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-40 touch-none"
        />
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleClear}
          className="text-sm text-gray-600"
        >
          Clear
        </button>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm border rounded"
          >
            Cancel
          </button>
          {/* <button
            onClick={handleSave}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
          >
            Save signature
          </button> */}
          <button
            onClick={() => {
                const dataUrl = canvasRef.current.toDataURL('image/png');
                onSave(dataUrl);
            }}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
            >
            Save Signature
            </button>
        </div>
      </div>
    </div>
  );
}

export default SignaturePad;