'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { CameraView } from '@/components/camera/camera-view';
import { TryOnEngineManager } from '@/lib/tryon/tryon-engine';
import { ProductSelector } from '@/components/tryon/product-selector';
import { TryOnView } from '@/components/tryon/tryon-view';
import { getCatalog } from '@/lib/tryon/product-catalog';
import type { VisionAnalysis, CatalogProduct, TryOnCategory, FaceLandmarks } from '@/types';

type MirrorStep =
  | 'idle'
  | 'camera'
  | 'captured'
  | 'detecting'
  | 'selecting'
  | 'result';

export default function SmartMirrorPage() {
  const [step, setStep] = useState<MirrorStep>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [vision, setVision] = useState<VisionAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [landmarks, setLandmarks] = useState<FaceLandmarks | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TryOnCategory>('eyewear');
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [engineStatus, setEngineStatus] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const engineRef = useRef<TryOnEngineManager | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setStep('idle');
      setCapturedImage(null);
      setSelectedProduct(null);
      setError(null);
      setLandmarks(null);
      setResultUrl(null);
      setRenderError(null);
    }, 60000);
  }, []);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [step, resetIdleTimer]);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new TryOnEngineManager();
      engineRef.current.onStateChange((state) => {
        setEngineStatus(state.message);
      });
      engineRef.current.initialize().catch(console.error);
    }
  }, []);

  const renderProduct = useCallback(async (product: CatalogProduct) => {
    if (!engineRef.current || !engineRef.current.hasFaceLandmarks()) return;

    setRendering(true);
    setRenderError(null);
    setResultUrl(null);

    try {
      await engineRef.current.loadProductImage(product);
      const result = engineRef.current.renderProduct(product, { mirrorMode: true });
      if (result) {
        setResultUrl(result.toDataURL('image/jpeg', 0.92));
      } else {
        setRenderError('Failed to render');
      }
    } catch (err) {
      setRenderError(String(err));
    } finally {
      setRendering(false);
    }
  }, []);

  const handleCapture = useCallback(
    async (dataUrl: string) => {
      setCapturedImage(dataUrl);
      if (!engineRef.current) {
        setStep('captured');
        return;
      }

      setStep('detecting');
      const result = await engineRef.current.detectFace(dataUrl);

      if (result) {
        setLandmarks(result);
        const catalog = getCatalog();
        await catalog.load();
        setStep('selecting');
      } else {
        setError('No face detected. Please try again.');
        setStep('captured');
      }
    },
    []
  );

  const handleCategoryChange = useCallback((category: TryOnCategory) => {
    setSelectedCategory(category);
    setSelectedProduct(null);
    setResultUrl(null);
  }, []);

  const handleProductSelect = useCallback(
    async (product: CatalogProduct) => {
      setSelectedProduct(product);
      await renderProduct(product);
      setStep('result');
      resetIdleTimer();
    },
    [renderProduct, resetIdleTimer]
  );

  const handleReset = useCallback(() => {
    setCapturedImage(null);
    setSelectedProduct(null);
    setError(null);
    setVision(null);
    setLandmarks(null);
    setResultUrl(null);
    setRenderError(null);
    setStep('idle');
    if (engineRef.current) engineRef.current.clearCache();
  }, []);

  const handleTryAnother = useCallback(() => {
    setSelectedProduct(null);
    setResultUrl(null);
    setRenderError(null);
    setStep('selecting');
  }, []);

  if (step === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 flex flex-col items-center justify-center text-white p-8 select-none"
           onMouseMove={resetIdleTimer} onTouchStart={resetIdleTimer}>
        <div className="w-24 h-24 rounded-3xl bg-white/5 backdrop-blur-xl flex items-center justify-center mb-8 border border-white/10">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/80">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold mb-4 text-center tracking-tight">Smart Mirror</h1>
        <p className="text-xl text-white/60 mb-10 text-center max-w-md">Step in front of the camera to try on any look</p>
        <button onClick={() => setStep('camera')} className="px-10 py-5 bg-white text-gray-900 rounded-2xl text-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 active:scale-95 shadow-xl">Tap to Start</button>
        <p className="text-white/30 text-sm mt-8">Touch the screen to activate</p>
      </div>
    );
  }

  if (step === 'camera') {
    return (
      <div className="min-h-screen bg-black flex flex-col" onMouseMove={resetIdleTimer} onTouchStart={resetIdleTimer}>
        <div className="flex-1 relative">
          <CameraView onCapture={handleCapture} onVisionUpdate={setVision} autoStart={true} mirrored={true} />
          {vision && (
            <div className="absolute bottom-24 left-0 right-0 flex justify-center">
              <div className={`px-6 py-3 rounded-full text-lg font-medium backdrop-blur-md ${
                vision.recommendation === 'READY' ? 'bg-emerald-500/80 text-white' :
                vision.recommendation === 'READY_WITH_WARNINGS' ? 'bg-amber-500/80 text-white' :
                'bg-gray-900/80 text-white/70'
              }`}>
                {vision.message}
              </div>
            </div>
          )}
        </div>
        <button onClick={() => setStep('idle')} className="absolute top-6 left-6 text-white/40 hover:text-white/70 text-sm transition-colors">← Back</button>
      </div>
    );
  }

  if (step === 'captured') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 text-white"
           onMouseMove={resetIdleTimer} onTouchStart={resetIdleTimer}>
        <h2 className="text-2xl font-bold mb-6">Your Photo</h2>
        {capturedImage && (
          <div className="w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden mb-6 shadow-2xl ring-1 ring-white/10">
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover mirror" />
          </div>
        )}
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <div className="flex gap-4">
          <button onClick={() => setStep('camera')} className="px-8 py-4 bg-white/10 text-white rounded-2xl text-lg font-medium hover:bg-white/20 backdrop-blur-sm transition-all">Retake</button>
          <button onClick={() => handleCapture(capturedImage!)} className="px-8 py-4 bg-brand-600 text-white rounded-2xl text-lg font-semibold hover:bg-brand-700 shadow-lg transition-all">Try It On</button>
        </div>
      </div>
    );
  }

  if (step === 'detecting') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-8 select-none"
           onMouseMove={resetIdleTimer} onTouchStart={resetIdleTimer}>
        <div className="relative mb-8">
          <svg className="animate-spin w-16 h-16 text-brand-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold mb-2">Detecting Face</h2>
        <p className="text-white/50">{engineStatus || 'Analyzing...'}</p>
      </div>
    );
  }

  if (step === 'selecting') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col p-4 text-white"
           onMouseMove={resetIdleTimer} onTouchStart={resetIdleTimer}>
        <h2 className="text-2xl font-bold mb-4">Choose Product</h2>
        <div className="flex-1 overflow-y-auto">
          <ProductSelector
            selectedCategory={selectedCategory}
            selectedProductId={null}
            disabledCategories={[]}
            onCategoryChange={handleCategoryChange}
            onProductSelect={handleProductSelect}
          />
        </div>
        <button onClick={handleReset} className="mt-4 px-6 py-3 bg-white/10 text-white rounded-2xl text-lg font-medium hover:bg-white/20 backdrop-blur-sm transition-all">Start Over</button>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 text-white"
           onMouseMove={resetIdleTimer} onTouchStart={resetIdleTimer}>
        <h2 className="text-2xl font-bold mb-6">Your New Look</h2>
        {capturedImage && (
          <div className="w-full max-w-md">
            <TryOnView
              personImageUrl={capturedImage}
              resultUrl={resultUrl}
              productName={selectedProduct?.name || ''}
              loading={rendering}
              error={renderError}
              mirrorMode={true}
              onClose={handleReset}
              onDownload={undefined}
            />
          </div>
        )}
        <div className="flex gap-4 mt-4">
          <button onClick={handleTryAnother} className="px-8 py-4 bg-white/10 text-white rounded-2xl text-lg font-medium hover:bg-white/20 backdrop-blur-sm transition-all">Try Another</button>
        </div>
      </div>
    );
  }

  return null;
}
