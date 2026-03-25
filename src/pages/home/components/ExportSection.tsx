import { useState } from 'react';
import { exportSimulationResults, ExportFormat } from '../../../lib/exportResults';

interface ExportButtonProps {
  hasResults: boolean;
  simulationText?: string;
  onShareCard?: () => void;
}

type ExportState = 'idle' | 'loading' | 'success' | 'error';

export default function ExportSection({ hasResults, simulationText, onShareCard }: ExportButtonProps) {
  const [pngState, setPngState] = useState<ExportState>('idle');
  const [pdfState, setPdfState] = useState<ExportState>('idle');

  if (!hasResults) return null;

  const getFilename = () => {
    if (!simulationText) return 'my-alternate-path';
    return simulationText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 40) || 'my-alternate-path';
  };

  const handleExport = async (format: ExportFormat) => {
    const setter = format === 'png' ? setPngState : setPdfState;
    setter('loading');

    try {
      await exportSimulationResults('simulation-results', format, getFilename());
      setter('success');
      setTimeout(() => setter('idle'), 3000);
    } catch (err) {
      console.error('Export failed:', err);
      setter('error');
      setTimeout(() => setter('idle'), 3000);
    }
  };

  const isExporting = pngState === 'loading' || pdfState === 'loading';

  const buttonContent = (
    format: ExportFormat,
    state: ExportState,
    icon: string,
    label: string,
    subLabel: string,
  ) => {
    const isThis = state === 'loading';
    const isSuccess = state === 'success';
    const isError = state === 'error';

    return (
      <button
        key={format}
        onClick={() => handleExport(format)}
        disabled={isExporting}
        className={`
          group flex items-center gap-4 px-6 py-4 rounded-2xl border transition-all duration-300 cursor-pointer
          disabled:opacity-60 disabled:cursor-not-allowed
          ${isSuccess
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
            : isError
            ? 'bg-red-500/10 border-red-500/25 text-red-300'
            : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-violet-400/30'}
        `}
      >
        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/20 shrink-0">
          {isThis ? (
            <div className="w-5 h-5 border-2 border-violet-400/40 border-t-violet-300 rounded-full animate-spin"></div>
          ) : isSuccess ? (
            <i className="ri-check-line text-emerald-300 text-lg"></i>
          ) : isError ? (
            <i className="ri-close-line text-red-300 text-lg"></i>
          ) : (
            <i className={`${icon} text-violet-300 text-lg`}></i>
          )}
        </div>

        <div className="text-left">
          <div className="text-sm font-semibold whitespace-nowrap">
            {isThis ? 'Generating…' : isSuccess ? 'Downloaded!' : isError ? 'Failed — Try Again' : label}
          </div>
          <div className={`text-xs mt-0.5 whitespace-nowrap ${isSuccess ? 'text-emerald-400/70' : 'text-gray-500'}`}>
            {subLabel}
          </div>
        </div>
      </button>
    );
  };

  return (
    <section className="py-12 px-6 export-ignore">
      <div className="max-w-3xl mx-auto">
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl px-10 py-10 border border-white/10">
          {/* Header */}
          <div className="flex items-start gap-5 mb-8">
            <div className="w-12 h-12 flex items-center justify-center shrink-0 rounded-xl bg-violet-500/15 border border-violet-500/20">
              <i className="ri-download-2-line text-violet-300 text-2xl"></i>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Save Your Results</h3>
              <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                Download your simulation as a high-quality image or PDF — keep it, share it, or reflect on it later.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {buttonContent('png', pngState, 'ri-image-line', 'Save as PNG Image', 'High-res · 2× quality')}
            {buttonContent('pdf', pdfState, 'ri-file-pdf-line', 'Export as PDF', 'Print-ready · A4 compatible')}

            {/* Share Card */}
            {onShareCard && (
              <button
                onClick={onShareCard}
                className="group flex items-center gap-4 px-6 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-violet-500/10 hover:border-violet-400/30 text-white transition-all duration-300 cursor-pointer"
              >
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/20 shrink-0">
                  <i className="ri-share-forward-2-line text-violet-300 text-lg" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold whitespace-nowrap">Create Share Card</div>
                  <div className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">Social · Copy link · Web share</div>
                </div>
              </button>
            )}
          </div>

          {/* Note */}
          <p className="mt-6 text-xs text-gray-600 text-center">
            Your results are captured exactly as displayed — scores, message, and all metrics included.
          </p>
        </div>
      </div>
    </section>
  );
}
