import { useEffect, useState } from 'react';

/**
 * TextAnnotationTool - UI for adding text to PDFs
 */
function TextAnnotationTool({ 
  isActive, 
  onAddText, 
  pageWidth, 
  pageHeight 
}) {
  const [textMode, setTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [fontSize, setFontSize] = useState(12);
  const [color, setColor] = useState('#000000');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showForm, setShowForm] = useState(false);

  const handleCanvasClick = (e) => {
    if (!textMode || !isActive) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalize to 0-1 range
    const normalizedX = x / rect.width;
    const normalizedY = y / rect.height;

    setPosition({ x: normalizedX, y: normalizedY });
    setShowForm(true);
  };

  const handleAddText = () => {
    if (!textInput.trim()) return;

    onAddText({
      text: textInput,
      x: position.x,
      y: position.y,
      fontSize,
      color: hexToRgb(color),
    });

    setTextInput('');
    setShowForm(false);
    setTextMode(false);
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255
        ]
      : [0, 0, 0];
  };

  if (!isActive) return null;

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex gap-2 items-center flex-wrap bg-gray-50 p-3 rounded-lg">
        <button
          onClick={() => setTextMode(!textMode)}
          className={`px-3 py-1 rounded text-sm font-medium transition ${
            textMode
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
        >
          📝 {textMode ? 'Click to place text' : 'Add Text'}
        </button>

        {textMode && (
          <>
            <input
              type="number"
              min="8"
              max="72"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              placeholder="Font size"
              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
            />

            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-8 rounded cursor-pointer"
              title="Text color"
            />

            <span className="text-xs text-gray-500">
              Click on the page to place text
            </span>
          </>
        )}
      </div>

      {/* Text input form */}
      {showForm && textMode && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Add Text</h3>

            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text to add to PDF..."
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setTextInput('');
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddText}
                disabled={!textInput.trim()}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                Add Text
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click hint for canvas */}
      {textMode && !showForm && (
        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
          Click on the PDF page where you want to place the text
        </div>
      )}
    </div>
  );
}

export default TextAnnotationTool;
