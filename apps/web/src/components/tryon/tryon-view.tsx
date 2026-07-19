'use client';

import { useState } from 'react';

type ViewMode = 'result' | 'original';

interface TryOnViewProps {
  personImageUrl: string;
  resultUrl: string | null;
  productName: string;
  loading: boolean;
  error: string | null;
  mirrorMode?: boolean;
  onClose?: () => void;
  onDownload?: () => void;
}

export function TryOnView({
  personImageUrl,
  resultUrl,
  productName,
  loading,
  error,
  mirrorMode = false,
  onClose,
  onDownload,
}: TryOnViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('result');

  const currentSrc = viewMode === 'original' ? personImageUrl : resultUrl;

  return (
    <div className="w-full">
      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 mb-4">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="text-center">
              <svg
                className="animate-spin h-10 w-10 text-brand-600 mx-auto mb-2"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-text-secondary">Applying {productName}...</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="text-center px-6">
              <p className="text-sm text-error mb-2">Rendering error</p>
              <p className="text-xs text-text-tertiary">{error}</p>
            </div>
          </div>
        )}

        {!currentSrc && !loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <p className="text-sm text-text-tertiary">Select a product to preview</p>
          </div>
        )}

        {currentSrc && (
          <img
            src={currentSrc}
            alt={viewMode === 'result' ? `Try-on with ${productName}` : 'Original photo'}
            className={`w-full h-full object-contain ${mirrorMode ? 'mirror' : ''}`}
          />
        )}
      </div>

      {resultUrl && !loading && !error && (
        <>
          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              onClick={() => setViewMode('result')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'result' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              Result
            </button>
            <button
              onClick={() => setViewMode('original')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'original' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }`}
            >
              Original
            </button>
          </div>

          <div className="flex gap-2">
            {onDownload && (
              <button
                onClick={onDownload}
                className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
              >
                Download
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-text-secondary rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Try Another
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
