'use client';

import { useState, useEffect, useRef } from 'react';
import type { CatalogProduct, FaceLandmarks, ProductFitProfile } from '@/types';
import { GlassesFittingEngine } from '@/lib/tryon/glasses-fitting-engine';

type ViewMode = 'split' | 'result' | 'original';

interface TryOnViewProps {
  personImage: HTMLImageElement;
  product: CatalogProduct;
  landmarks: FaceLandmarks;
  mirrorMode?: boolean;
  onClose?: () => void;
}

export function TryOnView({
  personImage,
  product,
  landmarks,
  mirrorMode = false,
  onClose,
}: TryOnViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('result');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<GlassesFittingEngine | null>(null);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new GlassesFittingEngine();
    }

    const engine = engineRef.current;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const productImg = await engine.loadProductImage(product.assetUrl);

        if (cancelled) return;

        const result = engine.renderGlasses(
          personImage,
          productImg,
          landmarks,
          product.fitProfile,
          { mirrorMode }
        );

        if (cancelled) return;

        if (result) {
          setResultUrl(result.toDataURL('image/jpeg', 0.92));
        } else {
          setError('Failed to render product');
        }
      } catch (err) {
        if (!cancelled) {
          setError(String(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [product.id, landmarks, mirrorMode]);

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `tryon-${product.id}.jpg`;
    a.click();
  };

  const currentSrc =
    viewMode === 'original' ? personImage.src : resultUrl;

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
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p className="text-sm text-text-secondary">Applying {product.name}...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="text-center px-6">
              <p className="text-sm text-error mb-2">Rendering error</p>
              <p className="text-xs text-text-tertiary">{error}</p>
            </div>
          </div>
        )}

        {currentSrc && (
          <img
            src={currentSrc}
            alt="Try-on result"
            className={`w-full h-full object-contain ${mirrorMode ? 'mirror' : ''}`}
          />
        )}
      </div>

      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          onClick={() => setViewMode('result')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'result'
              ? 'bg-brand-600 text-white'
              : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
          }`}
        >
          Result
        </button>
        <button
          onClick={() => setViewMode('original')}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'original'
              ? 'bg-brand-600 text-white'
              : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
          }`}
        >
          Original
        </button>
      </div>

      {!loading && !error && resultUrl && (
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Download
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 text-text-secondary rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      )}
    </div>
  );
}
