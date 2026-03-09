import { useEffect, useRef, useState } from 'react';
import SignaturePadLib from 'signature_pad';
import QRCode from 'qrcode.react';
import { useSignatureSession } from './useSignatureSession';

function SignatureModal({ isOpen, onClose, onSave }) {
  const canvasRef = useRef(null);
  const padRef = useRef(null);
  const qrRef = useRef(null);
  const [mode, setMode] = useState('draw'); // 'draw' | 'upload' | 'mobile'
  const [uploadedSig, setUploadedSig] = useState(null);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [showQRInfo, setShowQRInfo] = useState(false);
  const [mobileHost, setMobileHost] = useState('');
  const [isPhoneViewport, setIsPhoneViewport] = useState(false);
  const accentColor = '#FF5F3A';
  
  const {
    sessionId,
    signatureData,
    sessionActive,
    isMobileSignature,
    createSession,
    endSession,
  } = useSignatureSession();

  // Initialize signature pad for desktop drawing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateIsPhoneViewport = () => {
      setIsPhoneViewport(mediaQuery.matches);
    };

    updateIsPhoneViewport();
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateIsPhoneViewport);
      return () => mediaQuery.removeEventListener('change', updateIsPhoneViewport);
    }

    mediaQuery.addListener(updateIsPhoneViewport);
    return () => mediaQuery.removeListener(updateIsPhoneViewport);
  }, []);

  useEffect(() => {
    if (!isOpen || !canvasRef.current || mode !== 'draw') return;

    const canvas = canvasRef.current;
    
    // Wait for next frame to ensure container is laid out
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      const rect = parent.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      if (width <= 0 || height <= 0) return;
      
      // Set canvas internal and CSS size to match (no devicePixelRatio scaling)
      // This ensures the exported image is the correct size
      canvas.width = width;
      canvas.height = height;
    };

    const syncDrawState = () => {
      setHasDrawnSignature(Boolean(padRef.current && !padRef.current.isEmpty()));
    };

    // Use requestAnimationFrame to ensure layout is complete
    requestAnimationFrame(() => {
      resizeCanvas();
      
      // Initialize signature pad after sizing
      padRef.current = new SignaturePadLib(canvas, {
        backgroundColor: 'rgba(255,255,255,0)',  // Transparent background
        penColor: 'black',
        minWidth: 1,
        maxWidth: 3,
        throttle: 16,
      });
      // Ensure save state updates for touch/mouse strokes on all browsers.
      padRef.current.addEventListener('beginStroke', () => setHasDrawnSignature(true));
      padRef.current.addEventListener('endStroke', syncDrawState);
      syncDrawState();
    });

    // Handle window resize
    const handleResize = () => {
      resizeCanvas();
      padRef.current?.clear();
      setHasDrawnSignature(false);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      padRef.current?.off();
    };
  }, [isOpen, mode]);

  // Listen for mobile signature completion
  useEffect(() => {
    if (!isMobileSignature || !signatureData) return;
    
    // Automatically save mobile signature
    handleSave(signatureData);
    endSession();
  }, [isMobileSignature, signatureData]);

  const handleClear = () => {
    if (padRef.current) {
      padRef.current.clear();
    }
    setHasDrawnSignature(false);
    setUploadedSig(null);
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedSig(event.target.result);
      setHasDrawnSignature(false);
    };
    reader.readAsDataURL(file);
  };

  const handleMobileMode = () => {
    if (isPhoneViewport) return;
    createSession();
    setMode('mobile');
    setShowQRInfo(true);
  };

  useEffect(() => {
    if (isPhoneViewport && mode === 'mobile') {
      setMode('draw');
      setShowQRInfo(false);
      endSession();
    }
  }, [isPhoneViewport, mode, endSession]);

  useEffect(() => {
    if (!isOpen) return;

    const currentHost = window.location.hostname;
    const isLocalOnlyHost =
      currentHost === 'localhost' || currentHost === '127.0.0.1';

    if (isLocalOnlyHost) {
      setMobileHost(localStorage.getItem('mobile-sign-host') || '');
      return;
    }

    setMobileHost(currentHost);
  }, [isOpen]);

  const trimTransparentPadding = async (dataUrl) => {
    if (typeof document === 'undefined') return dataUrl;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const sourceCanvas = document.createElement('canvas');
          sourceCanvas.width = img.width;
          sourceCanvas.height = img.height;
          const sourceCtx = sourceCanvas.getContext('2d');
          sourceCtx.drawImage(img, 0, 0);

          const { data, width, height } = sourceCtx.getImageData(
            0,
            0,
            sourceCanvas.width,
            sourceCanvas.height
          );

          let minX = width;
          let minY = height;
          let maxX = -1;
          let maxY = -1;

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const alpha = data[(y * width + x) * 4 + 3];
              if (alpha > 10) {
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
              }
            }
          }

          if (maxX < 0 || maxY < 0) {
            resolve(dataUrl);
            return;
          }

          const padding = 2;
          const cropX = Math.max(0, minX - padding);
          const cropY = Math.max(0, minY - padding);
          const cropWidth = Math.min(width - cropX, maxX - minX + 1 + padding * 2);
          const cropHeight = Math.min(height - cropY, maxY - minY + 1 + padding * 2);

          const croppedCanvas = document.createElement('canvas');
          croppedCanvas.width = cropWidth;
          croppedCanvas.height = cropHeight;
          const croppedCtx = croppedCanvas.getContext('2d');
          croppedCtx.drawImage(
            sourceCanvas,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
          );

          resolve(croppedCanvas.toDataURL('image/png'));
        } catch (err) {
          console.warn('Failed to trim signature padding:', err);
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleSave = async (dataUrlOverride = null) => {
    let dataUrl;

    if (dataUrlOverride) {
      dataUrl = dataUrlOverride;
      console.log('Saving mobile signature');
    } else if (mode === 'draw' && padRef.current && !padRef.current.isEmpty()) {
      // Get PNG without the scaled resolution
      dataUrl = padRef.current.toDataURL('image/png');
      console.log('Saving drawn signature');
    } else if (mode === 'upload' && uploadedSig) {
      dataUrl = uploadedSig;
      console.log('Saving uploaded signature');
    } else {
      console.log('No signature to save');
      return;
    }

    dataUrl = await trimTransparentPadding(dataUrl);

    console.log('Signature saved, calling onSave');
    onSave(dataUrl);
    onClose();
  };

  const getQRValue = () => {
    const protocol = window.location.protocol;
    const hostname = mobileHost || window.location.hostname;
    const port = window.location.port;
    const portString = port ? `:${port}` : '';
    const baseUrl = `${protocol}//${hostname}${portString}`;
    return `${baseUrl}/mobile-sign?session=${sessionId}`;
  };

  const handleMobileHostChange = (value) => {
    setMobileHost(value);
    localStorage.setItem('mobile-sign-host', value);
  };

  const handleCloseModal = () => {
    endSession();
    onClose();
  };

  if (!isOpen) return null;

  const canSaveDraw = Boolean(
    mode === 'draw' &&
      ((padRef.current && !padRef.current.isEmpty()) || hasDrawnSignature)
  );
  const saveDisabled =
    mode === 'mobile' ||
    (mode === 'draw' && !canSaveDraw) ||
    (mode === 'upload' && !uploadedSig);

  const tabButtonStyle = (isActive) => ({
    flex: 1,
    minWidth: '120px',
    padding: '10px 8px 8px',
    border: 'none',
    borderBottom: isActive ? `4px solid ${accentColor}` : '4px solid transparent',
    background: '#fff',
    color: isActive ? accentColor : '#4a4a4a',
    fontSize: '18px',
    fontWeight: isActive ? 700 : 600,
    lineHeight: 1.1,
    cursor: 'pointer',
    textAlign: 'left',
  });

  const footerBtnBase = {
    height: '44px',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '16px',
    cursor: 'pointer',
  };

  return (
    <>
      <div
        onClick={handleCloseModal}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(13, 13, 13, 0.8)',
        }}
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
            maxWidth: isPhoneViewport ? '100%' : '860px',
            minHeight: isPhoneViewport ? 'calc(100dvh - 20px)' : '520px',
            maxHeight: isPhoneViewport ? 'calc(100dvh - 20px)' : '80vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#fff',
            borderRadius: '10px',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.35)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isPhoneViewport ? '14px 16px 12px' : '20px 24px 14px' }}>
            <h2 style={{ margin: 0, fontSize: isPhoneViewport ? '30px' : '42px', lineHeight: 1, fontWeight: 700, color: '#1f1f1f' }}>
              Add Signature
            </h2>
            <button
              onClick={handleCloseModal}
              style={{
                width: '36px',
                height: '36px',
                border: '1px solid #b7b7b7',
                borderRadius: '10px',
                background: '#fff',
                color: '#2f2f2f',
                fontSize: '24px',
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', padding: isPhoneViewport ? '0 16px' : '0 24px', borderBottom: '1px solid #d9d9d9', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setMode('draw');
                handleClear();
                setShowQRInfo(false);
              }}
              style={tabButtonStyle(mode === 'draw')}
            >
              Draw
            </button>
            <button
              onClick={() => {
                setMode('upload');
                setHasDrawnSignature(false);
                setShowQRInfo(false);
              }}
              style={tabButtonStyle(mode === 'upload')}
            >
              Upload image
            </button>
            {!isPhoneViewport && (
              <button
                onClick={handleMobileMode}
                style={tabButtonStyle(mode === 'mobile')}
              >
                Mobile *(Experimental)
              </button>
            )}
          </div>

          <div
            style={{
              flex: 1,
              overflowY: mode === 'mobile' ? 'auto' : 'hidden',
              overflowX: 'hidden',
              padding: isPhoneViewport ? '14px 16px' : '18px 24px',
            }}
          >
            {mode === 'draw' && (
              <div style={{ height: '100%', minHeight: isPhoneViewport ? '100%' : '280px', display: 'flex', flexDirection: 'column' }}>
                <p style={{ margin: isPhoneViewport ? '0 0 8px' : '0 0 12px', color: '#5a5a5a', fontSize: isPhoneViewport ? '16px' : '24px', fontWeight: 500 }}>
                  Sign on the blank space
                </p>
                <div
                  style={{
                    flex: 1,
                    minHeight: isPhoneViewport ? '58dvh' : '220px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    background: '#fff',
                    overflow: 'hidden',
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    onPointerUp={() =>
                      setHasDrawnSignature(
                        Boolean(padRef.current && !padRef.current.isEmpty())
                      )
                    }
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'block',
                      cursor: 'crosshair',
                    }}
                  />
                </div>
              </div>
            )}

            {mode === 'upload' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '340px' }}>
                <label style={{ width: '100%', maxWidth: '560px' }}>
                  <div style={{ border: '2px dashed #d3d3d3', borderRadius: '8px', padding: '24px', textAlign: 'center', cursor: 'pointer' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      style={{ display: 'none' }}
                    />
                    <p style={{ margin: 0, color: '#5f5f5f', fontSize: '16px' }}>Click to upload signature image</p>
                  </div>
                </label>
                {uploadedSig && (
                  <div style={{ marginTop: '22px' }}>
                    <img
                      src={uploadedSig}
                      alt="Uploaded signature"
                      style={{ maxHeight: '160px', maxWidth: '320px', border: '1px solid #d0d0d0', borderRadius: '6px' }}
                    />
                  </div>
                )}
              </div>
            )}

            {mode === 'mobile' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '340px', background: '#fafafa', borderRadius: '8px' }}>
                {sessionActive && sessionId ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '440px', padding: '10px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ margin: '0 0 10px', fontSize: '28px', fontWeight: 700 }}>Sign on Your Phone</h3>
                      <p style={{ margin: 0, fontSize: '18px', color: '#5a5a5a' }}>
                        Scan the QR code below with your mobile device to open the signature pad
                      </p>
                    </div>

                    {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                      <div style={{ width: '100%', background: '#fff9ef', border: '1px solid #f3d18b', borderRadius: '8px', padding: '12px' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#855a00' }}>
                          Enter your computer&apos;s LAN IP so your phone can connect (example: 192.168.1.10).
                        </p>
                        <input
                          type="text"
                          value={mobileHost}
                          onChange={(e) => handleMobileHostChange(e.target.value.trim())}
                          placeholder="192.168.x.x"
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #e4c17a', borderRadius: '6px', fontSize: '14px' }}
                        />
                      </div>
                    )}

                    <div style={{ background: '#fff', padding: '12px', borderRadius: '10px', border: '2px solid #d2d2d2' }}>
                      <QRCode
                        ref={qrRef}
                        value={getQRValue()}
                        size={300}
                        level="H"
                        includeMargin={true}
                        bgColor="#ffffff"
                        fgColor="#000000"
                      />
                    </div>

                    {showQRInfo && (
                      <div style={{ width: '100%', background: '#eef6ff', border: '1px solid #c8defa', borderRadius: '8px', padding: '14px', color: '#1d3f68' }}>
                        <div>
                          <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700 }}>How it works:</p>
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', lineHeight: 1.6 }}>
                            <li>Open your phone camera or QR scanner app</li>
                            <li>Point at the QR code</li>
                            <li>Tap the link that appears</li>
                            <li>Sign on your phone</li>
                            <li>Tap Save to send signature back</li>
                          </ul>
                        </div>
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #c8defa' }}>
                          <p style={{ margin: '0 0 5px', fontSize: '12px', fontWeight: 700 }}>Network access:</p>
                          <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.45 }}>
                            Make sure your phone is on the same network as your computer. If using over WiFi, the QR code automatically encodes the correct network address.
                          </p>
                        </div>
                      </div>
                    )}

                    <div style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#fff4cf', color: '#8f6a00', borderRadius: '999px', fontSize: '12px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: '#8f6a00' }} />
                        Waiting for signature...
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, color: '#606060', fontSize: '18px' }}>Creating session...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: isPhoneViewport ? 'stretch' : 'center',
              flexDirection: isPhoneViewport ? 'column' : 'row',
              gap: '12px',
              padding: isPhoneViewport ? '12px 16px 16px' : '14px 24px 18px',
              borderTop: '1px solid #d9d9d9',
              background: '#fff',
            }}
          >
            <button
              onClick={handleClear}
              disabled={mode === 'mobile'}
              style={{
                ...footerBtnBase,
                border: 'none',
                background: 'transparent',
                color: accentColor,
                minHeight: isPhoneViewport ? '42px' : undefined,
                width: isPhoneViewport ? '100%' : 'auto',
                textAlign: isPhoneViewport ? 'left' : 'center',
                padding: isPhoneViewport ? '0 2px' : '0 10px',
                opacity: mode === 'mobile' ? 0.5 : 1,
                cursor: mode === 'mobile' ? 'not-allowed' : 'pointer',
              }}
            >
              Clear
            </button>
            <button
              onClick={handleCloseModal}
              style={{
                ...footerBtnBase,
                minWidth: isPhoneViewport ? '100%' : '170px',
                border: `2px solid ${accentColor}`,
                background: '#fff',
                color: accentColor,
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave()}
              disabled={saveDisabled}
              style={{
                ...footerBtnBase,
                minWidth: isPhoneViewport ? '100%' : '210px',
                marginLeft: isPhoneViewport ? 0 : 'auto',
                border: `2px solid ${accentColor}`,
                background: accentColor,
                color: '#fff',
                opacity: saveDisabled ? 0.55 : 1,
                cursor: saveDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              Save Signature
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default SignatureModal;
