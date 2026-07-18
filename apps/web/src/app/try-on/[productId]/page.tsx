'use client';

import { useEffect, useState, use, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product, TryOnJob } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

type TryOnStep = 'ready' | 'capturing' | 'captured' | 'uploading' | 'processing' | 'result' | 'error';

const PROCESSING_STAGES = [
  { id: 0, label: 'Preparing your image' },
  { id: 1, label: 'Analyzing photo' },
  { id: 2, label: 'Applying garment' },
  { id: 3, label: 'Finalizing result' },
];

export default function TryOnPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<TryOnStep>('ready');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [jobStatus, setJobStatus] = useState<string>('');

  // Fetch product
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) throw new Error('Product not found');
        const data: Product = await res.json();
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setStep('capturing');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError('Camera access denied. Please allow camera permissions.');
      setStep('error');
    }
  }, []);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Mirror the capture
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    setStep('captured');
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Upload and process
  const startTryOn = useCallback(async () => {
    if (!capturedImage || !product) return;
    setStep('uploading');

    try {
      // Create session
      const sessionRes = await fetch('/api/sessions', { method: 'POST' });
      if (!sessionRes.ok) throw new Error('Failed to create session');
      const session = await sessionRes.json();

      // Upload person image
      const blob = await fetch(capturedImage).then(r => r.blob());
      const formData = new FormData();
      formData.append('image', blob, 'person.jpg');
      const imageRes = await fetch(`/api/sessions/${session.id}/person-images`, { method: 'POST', body: formData });
      if (!imageRes.ok) throw new Error('Failed to upload image');
      const personImage = await imageRes.json();

      // Create try-on job
      setStep('processing');
      setProcessingStage(0);
      const jobRes = await fetch(`/api/sessions/${session.id}/try-ons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, personImageId: personImage.id }),
      });
      if (!jobRes.ok) throw new Error('Failed to start try-on');
      const job: TryOnJob = await jobRes.json();

      // Poll for result
      const pollInterval = setInterval(async () => {
        setProcessingStage(prev => Math.min(prev + 1, 3));
        const pollRes = await fetch(`/api/try-ons/${job.id}`);
        if (!pollRes.ok) return;
        const pollData = await pollRes.json();
        setJobStatus(pollData.status);

        if (pollData.status === 'SUCCEEDED') {
          clearInterval(pollInterval);
          // Fetch result image
          const resultRes = await fetch(`/api/try-ons/${job.id}/result`);
          if (resultRes.ok) {
            const result = await resultRes.json();
            setResultUrl(result.storage_key || result.url || null);
          }
          setStep('result');
        } else if (pollData.status === 'FAILED' || pollData.status === 'TIMED_OUT' || pollData.status === 'CANCELLED') {
          clearInterval(pollInterval);
          setError(pollData.error_message || 'Try-on failed');
          setStep('error');
        }
      }, 1500);

      // Timeout after 60 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
        if (step !== 'result') {
          setError('Try-on timed out. Please try again.');
          setStep('error');
        }
      }, 60000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Try-on failed');
      setStep('error');
    }
  }, [capturedImage, product, productId, step]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const resetAll = () => {
    setCapturedImage(null);
    setResultUrl(null);
    setStep('ready');
    setError(null);
    setProcessingStage(0);
    setJobStatus('');
  };

  if (loading) return <div className="min-h-screen bg-surface-secondary"><LoadingState message="Loading product..." /></div>;
  if (error && step === 'ready') return <div className="min-h-screen bg-surface-secondary"><ErrorState message={error || 'Product not found'} onRetry={() => router.push('/products')} /></div>;
  if (!product) return <div className="min-h-screen bg-surface-secondary"><ErrorState message="Product not found" onRetry={() => router.push('/products')} /></div>;

  const productImageSrc = product.image_url?.startsWith('http') || product.image_url?.startsWith('data:')
    ? product.image_url
    : `/api/products/${product.id}/image`;

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="container-wide flex items-center justify-between h-16">
          <Link href="/" className="text-lg font-bold tracking-tight">
            VirtualTry<span className="text-brand-600">On</span>
          </Link>
          <div className="flex items-center gap-3">
            {step !== 'ready' && (
              <button onClick={resetAll} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                Start Over
              </button>
            )}
            <Link href="/products">
              <Button variant="ghost" size="sm">← Products</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container-wide py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Try It On</h1>
          <p className="text-text-secondary text-sm">{product.name}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Preview */}
          <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100">
            {product.image_url ? (
              <img src={productImageSrc} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18M3 9h18" />
                </svg>
              </div>
            )}
          </div>

          {/* Try-On Panel */}
          <div className="flex flex-col">
            {step === 'ready' && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-20 h-20 rounded-2xl bg-brand-100 flex items-center justify-center mb-6">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand-600)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Ready to Try On</h2>
                <p className="text-sm text-text-secondary mb-6 max-w-sm">
                  Take a photo with your camera to see how this product looks on you.
                </p>
                <Button size="lg" onClick={startCamera}>
                  Start Camera
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </Button>
              </div>
            )}

            {step === 'capturing' && (
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-black">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white shadow-lg border-4 border-white flex items-center justify-center hover:scale-105 transition-transform"
                  >
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300" />
                  </button>
                </div>
                <div className="absolute top-4 left-4">
                  <Badge variant="info">Camera Active</Badge>
                </div>
              </div>
            )}

            {step === 'captured' && capturedImage && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <div className="w-full max-w-sm aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 mb-6">
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={startCamera}>Retake</Button>
                  <Button onClick={startTryOn}>Try On Now</Button>
                </div>
              </div>
            )}

            {step === 'uploading' && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <LoadingState message="Uploading your photo..." />
              </div>
            )}

            {step === 'processing' && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="relative mb-8">
                  <svg className="animate-spin h-16 w-16 text-brand-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <div className="space-y-3 w-full max-w-xs">
                  {PROCESSING_STAGES.map((s) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium
                        ${processingStage > s.id ? 'bg-brand-600 text-white' : ''}
                        ${processingStage === s.id ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-400' : ''}
                        ${processingStage < s.id ? 'bg-gray-100 text-text-tertiary' : ''}
                      `}>
                        {processingStage > s.id ? (
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <path d="M13.5 4L6 11.5L2.5 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : s.id + 1}
                      </div>
                      <span className={`
                        text-sm
                        ${processingStage >= s.id ? 'text-text-primary font-medium' : 'text-text-tertiary'}
                      `}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
                {jobStatus && (
                  <p className="text-xs text-text-tertiary mt-4">Status: {jobStatus}</p>
                )}
              </div>
            )}

            {step === 'result' && resultUrl && (
              <div className="flex flex-col h-full">
                <h2 className="text-xl font-semibold mb-4 text-center">Your Result</h2>
                <div className="flex-1 relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 mb-6">
                  {showOriginal ? (
                    <img src={capturedImage!} alt="Original" className="w-full h-full object-cover" />
                  ) : (
                    <img src={resultUrl} alt="Try-on result" className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 text-white text-sm font-medium rounded-xl backdrop-blur-sm hover:bg-black/70 transition-colors"
                  >
                    {showOriginal ? 'Show Result' : 'Show Original'}
                  </button>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" fullWidth onClick={resetAll}>
                    Try Another
                  </Button>
                  <Link href={`/try-on/${product.id}`} className="flex-1">
                    <Button fullWidth>
                      New Photo
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {step === 'error' && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <ErrorState message={error || 'Something went wrong'} onRetry={resetAll} />
              </div>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
