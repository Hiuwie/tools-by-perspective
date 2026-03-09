import { useState } from 'react';
import { COMPRESSION_LEVELS } from './compression';

/**
 * ExportModal - Modal for choosing export options including compression level
 */
function ExportModal({ isOpen, onClose, onExport, isExporting = false }) {
  const [compressionLevel, setCompressionLevel] = useState('none');
  const [includeSignatures, setIncludeSignatures] = useState(true);

  if (!isOpen) return null;

  const handleExport = () => {
    onExport({
      compressionLevel,
      includeSignatures,
    });
  };

  const radioColor = '#ff5f3a';
  const orderedLevels = ['none', 'low', 'medium', 'high', 'extreme']
    .map((key) => [key, COMPRESSION_LEVELS[key]])
    .filter(([, level]) => Boolean(level));

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(13, 13, 13, 0.8)',
        }}
        onClick={onClose}
      />

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '2px solid #48a8ff',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.35)',
          }}
        >
          <div style={{ padding: '40px 44px 34px' }}>
            <h2 style={{ margin: '0 0 30px', fontSize: '50px', lineHeight: 1, fontWeight: 600, color: '#2f2f2f' }}>
              Compress options
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'grid', gap: '10px' }}>
                {orderedLevels.map(([key, level]) => (
                  <label
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      color: '#1a1a1a',
                      fontSize: '18px',
                    }}
                  >
                    <input
                      type="radio"
                      name="compression"
                      value={key}
                      checked={compressionLevel === key}
                      onChange={(e) => setCompressionLevel(e.target.value)}
                      style={{ accentColor: radioColor, width: '34px', height: '34px' }}
                    />
                    <span style={{ fontWeight: compressionLevel === key ? 700 : 400 }}>
                      {level.name}
                      {level.description ? ` (${level.description})` : ''}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '16px',
                  color: '#2d2d2d',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={includeSignatures}
                  onChange={(e) => setIncludeSignatures(e.target.checked)}
                  style={{ accentColor: radioColor, width: '18px', height: '18px' }}
                />
                <span>
                  Include signatures
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  height: '56px',
                  borderRadius: '10px',
                  border: '2px solid #ff5f3a',
                  color: '#ff5f3a',
                  backgroundColor: '#fff',
                  fontWeight: 600,
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                style={{
                  flex: 1,
                  height: '56px',
                  borderRadius: '10px',
                  border: '2px solid #ff5f3a',
                  backgroundColor: '#ff5f3a',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '20px',
                  cursor: isExporting ? 'not-allowed' : 'pointer',
                  opacity: isExporting ? 0.65 : 1,
                }}
              >
                {isExporting ? 'Exporting...' : 'Continue export'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ExportModal;
