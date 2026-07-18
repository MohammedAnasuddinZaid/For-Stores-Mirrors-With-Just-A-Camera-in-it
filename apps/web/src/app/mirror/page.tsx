'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { CameraView } from '../../components/camera/camera-view';
import type { VisionAnalysis } from '../../types';

type MirrorStep = 'idle' | 'camera' | 'captured' | 'products' | 'processing' | 'result';

export default function SmartMirrorPage() {
  const [step, setStep] = useState<MirrorStep>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string; imageUrl: string } | null>(null);
  const [vision, setVision] = useState<VisionAnalysis | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setStep('idle');
      setCapturedImage(null);
      setSelectedProduct(null);
      setResult(null);
      setError(null);
    }, 60000);
  }, []);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [step, resetIdleTimer]);

  const handleCapture = useCallback((dataUrl: string) => {
    setCapturedImage(dataUrl);
    setStep('captured');
    resetIdleTimer();
  }, [resetIdleTimer]);

  const handleQuickTryOn = useCallback(async () => {
    if (!capturedImage) return;
    setStep('processing');
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
          ctx.fillRect(canvas.width * 0.15, canvas.height * 0.3, canvas.width * 0.7, canvas.height * 0.4);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = 'bold 32px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('New Look', canvas.width / 2, canvas.height / 2);
          resolve();
        };
        img.src = capturedImage;
      });
      setResult(canvas.toDataURL('image/jpeg', 0.9));
      setStep('result');
    } catch {
      setError('Failed to generate. Try again.');
      setStep('captured');
    }
  }, [capturedImage]);

  const handleReset = useCallback(() => {
    setCapturedImage(null);
    setSelectedProduct(null);
    setResult(null);
    setError(null);
    setVision(null);
    setStep('idle');
  }, []);

  // Idle
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
        <h1 className="text-5xl sm:text-7xl font-bold mb-4 text-center tracking-tight">
          Smart Mirror
        </h1>
        <p className="text-xl text-white/60 mb-10 text-center max-w-md">
          Step in front of the camera to try on any look
        </p>
        <button
          onClick={() => setStep('camera')}
          className="px-10 py-5 bg-white text-gray-900 rounded-2xl text-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
        >
          Tap to Start
        </button>
        <p className="text-white/30 text-sm mt-8">Touch the screen to activate</p>
      </div>
    );
  }

  // Camera
  if (step === 'camera') {
    return (
      <div className="min-h-screen bg-black flex flex-col" onMouseMove={resetIdleTimer} onTouchStart={resetIdleTimer}>
        <div className="flex-1 relative">
          <CameraView
            onCapture={handleCapture}
            onVisionUpdate={setVision}
            autoStart={true}
            mirrored={true}
          />
          {vision && (
            <div className="absolute bottom-24 left-0 right-0 flex justify-center">
              <div className={`px-6 py-3 rounded-full text-lg font-medium backdrop-blur-md ${
                vision.recommendation === 'READY'
                  ? 'bg-emerald-500/80 text-white'
                  : vision.recommendation === 'READY_WITH_WARNINGS'
                    ? 'bg-amber-500/80 text-white'
                    : 'bg-gray-900/80 text-white/70'
              }`}>
                {vision.message}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setStep('idle')}
          className="absolute top-6 left-6 text-white/40 hover:text-white/70 text-sm transition-colors"
        >
          ← Back
        </button>
      </div>
    );
  }

  // Captured
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
        <div className="flex gap-4">
          <button onClick={() => setStep('camera')} className="px-8 py-4 bg-white/10 text-white rounded-2xl text-lg font-medium hover:bg-white/20 backdrop-blur-sm transition-all">
            Retake
          </button>
          <button onClick={handleQuickTryOn} className="px-8 py-4 bg-brand-600 text-white rounded-2xl text-lg font-semibold hover:bg-brand-700 shadow-lg transition-all">
            Try It On
          </button>
        </div>
      </div>
    );
  }

  // Processing
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-8 select-none"
           onMouseMove={resetIdleTimer} onTouchStart={resetIdleTimer}>
        <div className="relative mb-8">
          <svg className="animate-spin w-16 h-16 text-brand-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold mb-2">Creating Your Look</h2>
        <p className="text-white/50">Almost ready...</p>
      </div>
    );
  }

  // Result
  if (step === 'result') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 text-white"
           onMouseMove={resetIdleTimer} onTouchStart={resetIdleTimer}>
        <h2 className="text-2xl font-bold mb-6">Your New Look</h2>
        {result && (
          <div className="w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden mb-6 shadow-2xl ring-1 ring-white/10">
            <img src={result} alt="Try-On Result" className="w-full h-full object-cover mirror" />
          </div>
        )}
        <div className="flex gap-4">
          <button onClick={handleReset} className="px-8 py-4 bg-white/10 text-white rounded-2xl text-lg font-medium hover:bg-white/20 backdrop-blur-sm transition-all">
            Start Over
          </button>
          <button onClick={() => setStep('camera')} className="px-8 py-4 bg-brand-600 text-white rounded-2xl text-lg font-semibold hover:bg-brand-700 shadow-lg transition-all">
            New Photo
          </button>
        </div>
      </div>
    );
  }

  return null;
}
