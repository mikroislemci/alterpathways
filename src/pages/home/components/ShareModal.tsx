import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import ShareCard, { ShareCardProps } from './ShareCard';

interface ShareModalProps extends ShareCardProps {
  isOpen: boolean;
  onClose: () => void;
}

type BtnState = 'idle' | 'loading' | 'done' | 'error';

export default function ShareModal({
  isOpen,
  onClose,
  simulationText,
  scores,
  insight,
  signature,
}: ShareModalProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [downloadState, setDownloadState] = useState<BtnState>('idle');
  const [copyState, setCopyState] = useState<BtnState>('idle');

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/?simulate=${encodeURIComponent(simulationText)}`;

  const handleDownload = async () => {
    if (!captureRef.current || downloadState === 'loading') return;
    setDownloadState('loading');
    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });
      const slug = simulationText
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .substring(0, 40) || 'my-path';
      const link = document.createElement('a');
      link.download = `${slug}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDownloadState('done');
      setTimeout(() => setDownloadState('idle'), 3000);
    } catch (err) {
      console.error('Share card capture failed:', err);
      setDownloadState('error');
      setTimeout(() => setDownloadState('idle'), 3000);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState('done');
      setTimeout(() => setCopyState('idle'), 2500);
    } catch {
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: 'My Alternate Life Path — Pathways',
        text: `What if I had made a different choice?\n\n"${simulationText}"\n\n${signature}`,
        url: shareUrl,
      });
    } catch {
      /* cancelled */
    }
  };

  return (
    <>
      {/* Hidden full-size capture target (off-screen) */}
      <div style={{ position: 'fixed', top: -9999, left: 0, zIndex: -1, pointerEvents: 'none' }}>
        <ShareCard
          ref={captureRef}
          simulationText={simulationText}
          scores={scores}
          insight={insight}
          signature={signature}
        />
      </div>

      {/* Modal overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        style={{ background: 'rgba(0,0,0,0.82)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="relative w-full max-w-2xl rounded-3xl border border-white/10 overflow-hidden"
          style={{ background: '#0B0B18' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-white/10">
            <div>
              <h2 className="text-lg font-semibold text-white">Share Your Path</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                Download a card or copy a link to share your simulation
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-white/50 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Card preview */}
          <div className="px-8 py-6">
            <p className="text-gray-600 text-xs uppercase tracking-widest mb-4">Preview</p>

            {/* Scaled preview container */}
            <div
              className="rounded-xl overflow-hidden border border-white/8 mx-auto"
              style={{ width: 450, height: 345 }}
            >
              <div style={{ transform: 'scale(0.75)', transformOrigin: 'top left', width: 600 }}>
                <ShareCard
                  simulationText={simulationText}
                  scores={scores}
                  insight={insight}
                  signature={signature}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-8 pb-8 space-y-3">
            {/* Download PNG */}
            <button
              onClick={handleDownload}
              disabled={downloadState === 'loading'}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl border transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                downloadState === 'done'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                  : downloadState === 'error'
                  ? 'bg-red-500/10 border-red-500/25 text-red-300'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/8 hover:border-violet-400/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
                  {downloadState === 'loading' ? (
                    <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-300 rounded-full animate-spin" />
                  ) : downloadState === 'done' ? (
                    <i className="ri-check-line text-emerald-300 text-sm" />
                  ) : (
                    <i className="ri-image-download-line text-violet-300 text-sm" />
                  )}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium whitespace-nowrap">
                    {downloadState === 'loading' ? 'Generating image…' : downloadState === 'done' ? 'Downloaded!' : 'Download as PNG'}
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">High-res 1200 × auto · 2× quality</div>
                </div>
              </div>
              {downloadState === 'idle' && (
                <i className="ri-arrow-right-s-line text-gray-600 text-lg" />
              )}
            </button>

            {/* Copy link */}
            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                copyState === 'done'
                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/8 hover:border-violet-400/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
                  <i className={`${copyState === 'done' ? 'ri-check-line text-emerald-300' : 'ri-links-line text-violet-300'} text-sm`} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium whitespace-nowrap">
                    {copyState === 'done' ? 'Link Copied!' : 'Copy Share Link'}
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    Opens app with your decision pre-filled
                  </div>
                </div>
              </div>
              {copyState === 'idle' && (
                <i className="ri-arrow-right-s-line text-gray-600 text-lg" />
              )}
            </button>

            {/* Web Share API — mobile/supported browsers */}
            {typeof navigator !== 'undefined' && !!navigator.share && (
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/8 hover:border-violet-400/30 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-500/15 border border-violet-500/20">
                    <i className="ri-share-forward-line text-violet-300 text-sm" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium whitespace-nowrap">Share via…</div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">Twitter, WhatsApp, Messages &amp; more</div>
                  </div>
                </div>
                <i className="ri-arrow-right-s-line text-gray-600 text-lg" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
