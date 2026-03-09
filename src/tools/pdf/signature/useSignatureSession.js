import { useState, useEffect, useRef, useCallback } from 'react';
import { nanoid } from 'nanoid';

/**
 * Hook for managing cross-device signature sessions
 * Uses lightweight HTTP polling so mobile and desktop can communicate
 * on the same network.
 */
export function useSignatureSession() {
  const [sessionId, setSessionId] = useState(null);
  const [signatureData, setSignatureData] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [isMobileSignature, setIsMobileSignature] = useState(false);
  const sessionRef = useRef(null);

  // Create a new signature session
  const createSession = useCallback(() => {
    const newSessionId = nanoid(16); // Generate unique session ID
    sessionRef.current = newSessionId;
    setSessionId(newSessionId);
    setSessionActive(true);

    fetch('/api/signature-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: newSessionId }),
    }).catch((err) => {
      console.error('Failed to create signature session:', err);
    });

    return newSessionId;
  }, []);

  // Poll for signature completion from mobile device
  useEffect(() => {
    if (!sessionId || !sessionActive) return;

    let stopped = false;

    const poll = async () => {
      try {
        const response = await fetch(`/api/signature-sessions/${sessionId}`);
        if (!response.ok) return;

        const data = await response.json();
        if (stopped) return;

        if (data?.status === 'complete' && data?.signature) {
          setSignatureData(data.signature);
          setIsMobileSignature(true);
          setSessionActive(false);
        }
      } catch (err) {
        if (!stopped) {
          console.error('Signature polling failed:', err);
        }
      }
    };

    poll();
    const intervalId = window.setInterval(poll, 1200);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, [sessionId, sessionActive]);

  // End session and clean up
  const endSession = useCallback(() => {
    if (sessionId) {
      fetch(`/api/signature-sessions/${sessionId}`, {
        method: 'DELETE',
      }).catch((err) => {
        console.warn('Failed to delete signature session:', err);
      });
    }
    setSessionActive(false);
    setSessionId(null);
    setSignatureData(null);
    setIsMobileSignature(false);
  }, [sessionId]);

  return {
    sessionId,
    signatureData,
    sessionActive,
    isMobileSignature,
    createSession,
    endSession,
  };
}
