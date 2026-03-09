import { useEffect, useState } from 'react';

function GeneratePdfModal({ isOpen, onClose, onGenerate, isGenerating = false }) {
  const [prompt, setPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [aiModel, setAiModel] = useState(null);
  const [imageGenerationEnabled, setImageGenerationEnabled] = useState(true);
  const [imageGenerated, setImageGenerated] = useState(false);

  useEffect(() => {
    if (isOpen) return;
    setPrompt('');
    setAiError('');
    setAssistantReply('');
    setAiModel(null);
    setImageGenerationEnabled(true);
    setImageGenerated(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isGenerating || aiLoading) return;
    setPrompt('');
    setAiError('');
    setAssistantReply('');
    setAiModel(null);
    setImageGenerationEnabled(true);
    setImageGenerated(false);
    onClose();
  };

  const handleAskAi = async () => {
    if (!prompt.trim()) return;

    setAiLoading(true);
    setAiError('');

    try {
      const res = await fetch('/api/ai/pdf-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await res.json();
      setAssistantReply(data?.assistantReply || 'AI response generated.');
      setAiModel(data?.model || null);
      setImageGenerationEnabled(Boolean(data?.imageGenerationEnabled));
      setImageGenerated(Boolean(data?.imageGenerated));

      if (data?.enhancedPrompt) {
        setPrompt(data.enhancedPrompt);
      }
    } catch (err) {
      setAiError(err.message || 'Could not process your request right now.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerate = () => {
    onGenerate({
      prompt,
      aiModel,
    });
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1100,
          backgroundColor: 'rgba(13, 13, 13, 0.8)',
        }}
        onClick={handleClose}
      />

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1101,
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
            maxWidth: '860px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.35)',
            border: '1px solid #ece8e6',
          }}
        >
          <div style={{ padding: '26px 28px 22px' }}>
            <h2
              style={{
                margin: 0,
                fontSize: '2rem',
                lineHeight: 1.1,
                color: '#222022',
                fontWeight: 700,
              }}
            >
              AI PDF Creator
            </h2>
            <p style={{ margin: '10px 0 16px', color: '#555', fontSize: '0.95rem' }}>
              Describe what the PDF must contain. AI will refine it and generate a ready-to-edit document page.
            </p>

            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setAiModel(null);
                setAssistantReply('');
                setAiError('');
                setImageGenerated(false);
              }}
              placeholder="Example: Create a one-page rice recipe with ingredients, step-by-step method, prep/cook time, and servings."
              rows={9}
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: '190px',
                borderRadius: '6px',
                border: '1.5px solid #d7d2cf',
                padding: '14px',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box',
                color: '#202020',
              }}
            />

            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              <button
                onClick={handleAskAi}
                disabled={aiLoading || isGenerating || !prompt.trim()}
                style={{
                  minWidth: '170px',
                  height: '44px',
                  borderRadius: '10px',
                  border: '2px solid #222022',
                  backgroundColor: '#fff',
                  color: '#222022',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: aiLoading || isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
                  opacity: aiLoading || isGenerating || !prompt.trim() ? 0.6 : 1,
                }}
              >
                {aiLoading ? 'Thinking...' : 'Ask AI to refine'}
              </button>
            </div>

            {aiError ? (
              <div style={{ marginTop: '10px', color: '#b42318', fontSize: '0.92rem' }}>{aiError}</div>
            ) : null}

            {assistantReply ? (
              <div
                style={{
                  marginTop: '14px',
                  border: '1px solid #ebe5e3',
                  borderRadius: '6px',
                  padding: '12px',
                  backgroundColor: '#fcfaf9',
                }}
              >
                <div style={{ fontWeight: 700, color: '#222022', marginBottom: '6px' }}>AI assistant</div>
                <div style={{ whiteSpace: 'pre-wrap', color: '#3f3b3a', fontSize: '0.92rem' }}>{assistantReply}</div>
              </div>
            ) : null}

            {assistantReply && !imageGenerationEnabled ? (
              <div
                style={{
                  marginTop: '10px',
                  borderRadius: '6px',
                  border: '1px solid #f8c9bc',
                  backgroundColor: '#fff4f1',
                  color: '#8a2f1d',
                  fontSize: '0.9rem',
                  padding: '10px 12px',
                }}
              >
                Image generation is not enabled yet. Add `HUGGINGFACE_API_KEY` in `.env.local` to include AI-generated images in PDFs.
              </div>
            ) : null}

            {assistantReply && imageGenerationEnabled && !imageGenerated ? (
              <div
                style={{
                  marginTop: '10px',
                  borderRadius: '6px',
                  border: '1px solid #d5d0cc',
                  backgroundColor: '#faf9f8',
                  color: '#5d5856',
                  fontSize: '0.9rem',
                  padding: '10px 12px',
                }}
              >
                AI text generation is active. No image was generated for this prompt.
              </div>
            ) : null}

            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <button
                onClick={handleClose}
                disabled={isGenerating || aiLoading}
                style={{
                  minWidth: '136px',
                  height: '48px',
                  borderRadius: '10px',
                  border: '2px solid #ff5f3a',
                  backgroundColor: '#fff',
                  color: '#ff5f3a',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: isGenerating || aiLoading ? 'not-allowed' : 'pointer',
                  opacity: isGenerating || aiLoading ? 0.6 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || aiLoading || !prompt.trim()}
                style={{
                  minWidth: '180px',
                  height: '48px',
                  borderRadius: '10px',
                  border: '2px solid #ff5f3a',
                  backgroundColor: '#ff5f3a',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: isGenerating || aiLoading || !prompt.trim() ? 'not-allowed' : 'pointer',
                  opacity: isGenerating || aiLoading || !prompt.trim() ? 0.6 : 1,
                }}
              >
                {isGenerating ? 'Generating...' : 'Generate PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default GeneratePdfModal;
