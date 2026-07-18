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
    }, 60000); // 1 minute idle timeout
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
          ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
          ctx.fillRect(canvas.width * 0.15, canvas.height * 0.3, canvas.width * 0.7, canvas.height * 0.4);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = 'bold 32px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('New Look! ✨', canvas.width / 2, canvas.height / 2);
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

  const sampleProducts = [
    { id: '1', name: 'Blazer', imageUrl: 'https://placehold.co/200x250/3b82f6/ffffff?text=Blazer' },
    { id: '2', name: 'Dress', imageUrl: 'https://placehold.co/200x250/ec4899/ffffff?text=Dress' },
    { id: '3', name: 'Jacket', imageUrl: 'https://placehold.co/200x250/6366f1/ffffff?text=Jacket' },
    { id: '4', name: 'Tote', imageUrl: 'https://placehold.co/200x250/84cc16/ffffff?text=Tote' },
  ];

  // Idle screen
  if (step === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center text-white p-8"
           onMouseMove={resetIdleTimer} onTouchStart={resetIdleTimer}>
        <div className="text-7xl mb-6">🪞</div>
        <h1 className="text-5xl font-bold mb-4 text-center">Virtual Mirror</h1>
        <p className="text-xl text-gray-300 mb-8 text-center">Step in front of the camera to begin</p>
        <button
          onClick={() => setStep('camera')}
          className="px-10 py-5 bg-white text-gray-900 rounded-2xl text-xl font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
        >
          Tap to Start
        </button>
        <p className="text-gray-500 text-sm mt-8">Touch the screen to activate</p>
      </div>
    );
  }

  // Camera step
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
            <div className="absolute bottom-20 left-0 right-0 flex justify-center">
              <div className={`px-6 py-3 rounded-full text-lg font-medium backdrop-blur-md ${
                vision.recommendation === 'READY'
                  ? 'bg-green-500/80 text-white'
                  : vision.recommendation === 'READY_WITH_WARNINGS'
                    ? 'bg-yellow-500/80 text-white'
                    : 'bg-gray-900/80 text-gray-200'
              }`}>
                {vision.message}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={() => setStep('idle')}
          className="absolute top-4 left-4 text-white/50 text-sm"
        >
          ← Back
        </button>
      </div>
    );
  }

  // Captured preview
  if (step === 'captured') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-white"
           onMouseMove={resetIdleTimer} onTouchStart={resetIdleTimer}>
        <div className="text-2xl font-bold mb-6">Your Photo</div>
        {capturedImage && (
          <div className="w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden mb-6 shadow-2xl">
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover mirror" />
          </div>
        )}
        <div className="flex gap-4">
          <button onClick={() => setStep('camera')} className="px-8 py-4 bg-gray-700 text-white rounded-2xl text-lg font-medium hover:bg-gray-600">
            Retake
          </button>
          <button onClick={handleQuickTryOn} className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-lg font-medium hover:bg-blue-700">
            Try It On!
          </button>
        </div>
      </div>
    );
  }

  // Processing
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-8"
           onMouseMove={resetIdleTimer} onTouchStart={resetIdleTimer}>
        <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mb-6" />
        <div className="text-2xl font-semibold mb-2">Creating Your Look</div>
        <p className="text-gray-400">Almost ready...</p>
      </div>
    );
  }

  // Result
  if (step === 'result') {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-white"
           onMouseMove={resetIdleTimer} onTouchStart={resetIdleTimer}>
        <div className="text-2xl font-bold mb-6">Your New Look</div>
        {result && (
          <div className="w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden mb-6 shadow-2xl">
            <img src={result} alt="Try-On Result" className="w-full h-full object-cover mirror" />
          </div>
        )}
        <div className="flex gap-4">
          <button onClick={handleReset} className="px-8 py-4 bg-gray-700 text-white rounded-2xl text-lg font-medium hover:bg-gray-600">
            Start Over
          </button>
          <button onClick={() => setStep('camera')} className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-lg font-medium hover:bg-blue-700">
            New Photo
          </button>
        </div>
      </div>
    );
  }

  return null;
}
