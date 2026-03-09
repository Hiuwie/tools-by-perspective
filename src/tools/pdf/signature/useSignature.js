import { useState } from 'react';

export function useSignature() {
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);

  const saveSignature = (dataUrl) => {
    setSignatureDataUrl(dataUrl);
  };

  const clearSignature = () => {
    setSignatureDataUrl(null);
  };

  return {
    signatureDataUrl,
    saveSignature,
    clearSignature,
  };
}