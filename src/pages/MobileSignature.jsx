import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SignaturePadLib from 'signature_pad';
import { useSeo } from '../hooks/useSeo';

function MobileSignature() {
  const brandOrange = '#FF5F3A';
  const brandInk = '#222022';
  const redirectUrl = 'https://www.perspectivepov.co.za';

  useSeo({
    title: 'Mobile Signature',
    description: 'Mobile signature capture for Perspective POV PDF tools.',
    path: '/mobile-sign',
    robots: 'noindex,nofollow',
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canvasRef = useRef(null);
  const canvasWrapRef = useRef(null);
  const padRef = useRef(null);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [isPhone, setIsPhone] = useState(false);
  const [isPortrait, setIsPortrait] = useState(true);
  const actionButtonBase = {
    height: isPhone ? '54px' : '50px',
    borderRadius: '4px',
    padding: '0 14px',
    fontWeight: 600,
    fontSize: isPhone ? '0.98rem' : '0.9rem',
    lineHeight: 1,
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewportFlags = () => {
      const width = window.visualViewport?.width || window.innerWidth || 0;
      const height = window.visualViewport?.height || window.innerHeight || 0;
      setIsPhone(width > 0 && width <= 767);
      setIsPortrait(height >= width);
    };

    updateViewportFlags();
    window.addEventListener('resize', updateViewportFlags);
    window.addEventListener('orientationchange', updateViewportFlags);
    window.visualViewport?.addEventListener('resize', updateViewportFlags);

    return () => {
      window.removeEventListener('resize', updateViewportFlags);
      window.removeEventListener('orientationchange', updateViewportFlags);
      window.visualViewport?.removeEventListener('resize', updateViewportFlags);
    };
  }, []);

  // Get session ID from URL query parameter
  useEffect(() => {
    const id = searchParams.get('session');
    if (!id) {
      setError('Invalid session ID');
      return;
    }

    // Log for debugging
    console.log('Mobile signature page loaded');
    console.log('Session ID:', id);
    console.log('Current origin:', window.location.origin);
    console.log('Current hostname:', window.location.hostname);

    let cancelled = false;

    const init = async () => {
      try {
        const response = await fetch(`/api/signature-sessions/${id}`);
        if (!response.ok) {
          throw new Error('Session not found or expired. Re-open the QR code from desktop.');
        }

        if (cancelled) return;
        setSessionId(id);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to initialize mobile signature:', err);
          setError(err.message || 'Session not found or expired.');
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!sessionId || !canvasRef.current || !canvasWrapRef.current) return;

    const canvas = canvasRef.current;
    const canvasWrap = canvasWrapRef.current;

    const resizeCanvas = () => {
      const rect = canvasWrap.getBoundingClientRect();
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const width = Math.max(Math.floor(rect.width || 0), 280);
      const height = Math.max(Math.floor(rect.height || 0), 240);

      const existingData = padRef.current && !padRef.current.isEmpty()
        ? padRef.current.toData()
        : null;

      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);

      if (padRef.current) {
        padRef.current.clear();
        if (existingData && existingData.length > 0) {
          padRef.current.fromData(existingData);
        }
      }
    };

    const scheduleResize = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resizeCanvas);
      });
    };

    scheduleResize();
    window.addEventListener('resize', scheduleResize);
    window.addEventListener('orientationchange', scheduleResize);
    window.visualViewport?.addEventListener('resize', scheduleResize);
    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(canvasWrap);

    padRef.current?.off();
    padRef.current = new SignaturePadLib(canvas, {
      backgroundColor: 'rgba(255,255,255,0)',
      penColor: 'rgb(0, 0, 0)',
      minWidth: 2,
      maxWidth: 4,
      throttle: 16,
    });

    const onBeginStroke = () => setIsDrawing(true);
    const onEndStroke = () => setIsDrawing(false);
    padRef.current.addEventListener('beginStroke', onBeginStroke);
    padRef.current.addEventListener('endStroke', onEndStroke);

    return () => {
      window.removeEventListener('resize', scheduleResize);
      window.removeEventListener('orientationchange', scheduleResize);
      window.visualViewport?.removeEventListener('resize', scheduleResize);
      resizeObserver.disconnect();
      padRef.current?.off();
      setIsDrawing(false);
    };
  }, [sessionId]);

  const handleClear = () => {
    if (padRef.current) {
      padRef.current.clear();
    }
  };

  const handleCancel = () => {
    // Close the window/tab
    window.close();
    // Fallback to home if close doesn't work
    navigate('/');
  };

  const handleSave = async () => {
    if (!padRef.current || padRef.current.isEmpty()) {
      setError('Please sign before saving');
      return;
    }

    if (!sessionId) {
      setError('Session error');
      return;
    }

    try {
      const signatureDataUrl = padRef.current.toDataURL('image/png');

      const response = await fetch(`/api/signature-sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature: signatureDataUrl }),
      });
      if (!response.ok) {
        throw new Error('Failed to submit signature');
      }
      setIsSaved(true);
    } catch (err) {
      console.error('Failed to save signature:', err);
      setError('Failed to save signature');
    }
  };

  useEffect(() => {
    if (!isSaved) return;

    const countdownInterval = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const redirectTimeout = window.setTimeout(() => {
      window.location.href = redirectUrl;
    }, 8000);

    return () => {
      window.clearInterval(countdownInterval);
      window.clearTimeout(redirectTimeout);
    };
  }, [isSaved]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white rounded-lg shadow p-6 max-w-sm text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">📱</div>
          <p className="text-gray-600">Loading signature session...</p>
        </div>
      </div>
    );
  }

  if (isSaved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F8] p-4">
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            background: '#fff',
            border: `1px solid ${brandOrange}55`,
            borderRadius: '12px',
            padding: '28px 22px',
            textAlign: 'center',
            boxShadow: '0 18px 45px rgba(0,0,0,0.12)',
          }}
        >
          <h1 style={{ margin: 0, color: brandInk, fontSize: '28px', fontWeight: 700 }}>
            Signature Saved
          </h1>
          <p style={{ margin: '12px 0 0', color: '#4f4f4f', fontSize: '16px' }}>
            Your signature has been saved successfully.
          </p>
          <p style={{ margin: '8px 0 0', color: '#777', fontSize: '14px' }}>
            Redirecting to Perspective POV in {countdown}s...
          </p>
          <button
            onClick={() => {
              window.location.href = redirectUrl;
            }}
            style={{
              marginTop: '18px',
              border: `2px solid ${brandOrange}`,
              background: brandOrange,
              color: '#fff',
              borderRadius: '4px',
              fontWeight: 600,
              fontSize: '15px',
              height: '44px',
              padding: '0 16px',
              cursor: 'pointer',
            }}
          >
            Continue now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 p-4 safe-area-inset"
      style={{
        background: '#FAF9F8',
        minHeight: '100dvh',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
        paddingTop: 'max(14px, env(safe-area-inset-top, 0px))',
      }}
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: brandInk }}>Sign Document</h1>
        <p className="text-sm mt-1" style={{ color: '#6b6668' }}>
          Sign using your finger or stylus
        </p>
      </div>

      {/* Signature Canvas */}
      <div
        ref={canvasWrapRef}
        className="bg-white rounded-lg shadow overflow-hidden"
        style={{
          flex: '1 1 auto',
          minHeight: isPhone ? (isPortrait ? '40vh' : '34vh') : '240px',
          border: `1px solid ${brandOrange}40`,
        }}
      >
        <canvas
          ref={canvasRef}
          className="touch-none cursor-crosshair"
          style={{
            touchAction: 'none',
            width: '100%',
            height: '100%',
            display: 'block',
            background: '#fff',
          }}
        />
      </div>

      {/* Instructions */}
      {!isDrawing && padRef.current?.isEmpty() && (
        <div style={{ textAlign: 'center', marginTop: '2px', marginBottom: '2px' }}>
          <p className="text-gray-500 text-sm">
            Draw your signature above
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div
        className="gap-3"
        style={{
          flex: '0 0 auto',
          background: '#f9fafb',
          borderRadius: '8px',
          paddingLeft: '4px',
          paddingRight: '4px',
          paddingTop: '8px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
          display: 'flex',
          flexWrap: 'nowrap',
          alignItems: 'stretch',
        }}
      >
        <button
          onClick={handleClear}
          className="transition"
          style={{
            ...actionButtonBase,
            border: 'none',
            background: 'transparent',
            color: brandOrange,
            minWidth: '70px',
            padding: '0 6px',
          }}
        >
          Clear
        </button>
        <button
          onClick={handleCancel}
          className="transition"
          style={{
            ...actionButtonBase,
            border: `2px solid ${brandOrange}`,
            background: '#fff',
            color: brandOrange,
            minWidth: isPhone ? '120px' : '6rem',
            flex: isPhone ? '1 1 auto' : undefined,
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!padRef.current || padRef.current.isEmpty()}
          style={{
            ...actionButtonBase,
            border: `2px solid ${brandOrange}`,
            background: brandOrange,
            color: '#ffffff',
            marginLeft: 'auto',
            minWidth: isPhone ? '150px' : '6rem',
            flex: isPhone ? '1 1 auto' : undefined,
          }}
        >
          Save
        </button>
      </div>

      {/* Footer */}
      <div
        className="text-center text-xs text-gray-400"
        style={{ display: isPhone ? 'none' : 'block', marginTop: '2px' }}
      >
        Session ID: {sessionId.substring(0, 8)}...
      </div>
    </div>
  );
}

export default MobileSignature;
