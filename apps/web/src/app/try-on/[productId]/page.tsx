'use client';

import { useEffect, useState, use, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product, CatalogProduct, TryOnCategory, FaceLandmarks } from '@/types';
import { getCatalog } from '@/lib/tryon/product-catalog';
import { TryOnEngineManager } from '@/lib/tryon/tryon-engine';
import { ProductSelector } from '@/components/tryon/product-selector';
import { TryOnView } from '@/components/tryon/tryon-view';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

type TryOnStep =
  | 'ready'
  | 'camera'
  | 'captured'
  | 'detecting'
  | 'selecting'
  | 'preview'
  | 'error';

export default function TryOnPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const engineRef = useRef<TryOnEngineManager | null>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<TryOnStep>('ready');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [landmarks, setLandmarks] = useState<FaceLandmarks | null>(null);
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<CatalogProduct | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TryOnCategory>('eyewear');
  const [engineStatus, setEngineStatus] = useState<string>('');
  const [detecting, setDetecting] = useState(false);

  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new TryOnEngineManager();
      engineRef.current.onStateChange((state) => {
        setEngineStatus(state.message);
      });
      engineRef.current.initialize().catch((err) => {
        console.error('Engine init failed:', err);
      });
    }
  }, []);

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

  const renderCurrentProduct = useCallback(async (catalogProduct: CatalogProduct) => {
    if (!engineRef.current || !engineRef.current.hasFaceLandmarks()) return;

    setRendering(true);
    setRenderError(null);
    setResultUrl(null);

    try {
      await engineRef.current.loadProductImage(catalogProduct);
      const result = engineRef.current.renderProduct(catalogProduct, { mirrorMode: false });

      if (result) {
        setResultUrl(result.toDataURL('image/jpeg', 0.92));
      } else {
        setRenderError('Failed to render product on image');
      }
    } catch (err) {
      setRenderError(String(err));
    } finally {
      setRendering(false);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setStep('camera');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError('Camera access denied. Please allow camera permissions or upload a photo.');
      setStep('error');
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    setStep('captured');

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
      setStep('captured');
    };
    reader.readAsDataURL(file);
  }, []);

  const detectFace = useCallback(async () => {
    if (!capturedImage || !engineRef.current) return;
    setDetecting(true);
    setStep('detecting');

    try {
      const result = await engineRef.current.detectFace(capturedImage);

      if (result) {
        setLandmarks(result);

        const catalog = getCatalog();
        await catalog.load();
        const defaultProduct = catalog.getProduct(productId);
        if (defaultProduct) {
          setSelectedCatalogProduct(defaultProduct);
          setSelectedCategory(defaultProduct.category);
          await renderCurrentProduct(defaultProduct);
        }

        setStep('selecting');
      } else {
        setError('No face detected. Please try again with a clear face photo.');
        setStep('error');
      }
    } catch (err) {
      setError('Face detection failed. Please try again.');
      setStep('error');
    } finally {
      setDetecting(false);
    }
  }, [capturedImage, productId, renderCurrentProduct]);

  const handleCategoryChange = useCallback(async (category: TryOnCategory) => {
    setSelectedCategory(category);
    setSelectedCatalogProduct(null);
    setResultUrl(null);
    setRenderError(null);
  }, []);

  const handleProductSelect = useCallback(
    async (catalogProduct: CatalogProduct) => {
      setSelectedCatalogProduct(catalogProduct);
      await renderCurrentProduct(catalogProduct);
    },
    [renderCurrentProduct]
  );

  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `tryon-${selectedCatalogProduct?.id || 'result'}.jpg`;
    a.click();
  }, [resultUrl, selectedCatalogProduct]);

  const resetAll = useCallback(() => {
    setCapturedImage(null);
    setLandmarks(null);
    setSelectedCatalogProduct(null);
    setSelectedCategory('eyewear');
    setStep('ready');
    setError(null);
    setEngineStatus('');
    setDetecting(false);
    setResultUrl(null);
    setRenderError(null);
    if (engineRef.current) {
      engineRef.current.clearCache();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const disabledCategories: TryOnCategory[] = [];

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary">
        <LoadingState message="Loading product..." />
      </div>
    );
  }

  if (error && step === 'ready') {
    return (
      <div className="min-h-screen bg-surface-secondary">
        <ErrorState message={error || 'Product not found'} onRetry={() => router.push('/products')} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-surface-secondary">
        <ErrorState message="Product not found" onRetry={() => router.push('/products')} />
      </div>
    );
  }

  const productImageSrc =
    product.image_url?.startsWith('http') || product.image_url?.startsWith('data:')
      ? product.image_url
      : `/api/products/${product.id}/image`;

  return (
    <div className="min-h-screen bg-surface-secondary">
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Try It On</h1>
          <p className="text-text-secondary text-sm">{product.name}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                  Take a photo with your camera or upload one to see how this looks on you.
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <Button size="lg" onClick={startCamera}>
                    Start Camera
                  </Button>
                  <label className="block">
                    <span className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-white text-text-primary border-2 border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-brand-300 transition-all cursor-pointer">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      Upload Photo
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
            )}

            {step === 'camera' && (
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
              <div className="flex flex-col items-center justify-center h-full text-center py-4">
                <div className="w-full max-w-sm aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 mb-4">
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={startCamera}>Retake</Button>
                  <Button onClick={detectFace} disabled={detecting}>
                    {detecting ? 'Detecting...' : 'Try On Now'}
                  </Button>
                </div>
              </div>
            )}

            {step === 'detecting' && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <LoadingState message={engineStatus || 'Detecting face...'} />
              </div>
            )}

            {step === 'selecting' && capturedImage && (
              <div className="flex flex-col h-full">
                <h2 className="text-lg font-semibold mb-3">Select Product</h2>
                <div className="flex-1 overflow-y-auto">
                  <ProductSelector
                    selectedCategory={selectedCategory}
                    selectedProductId={selectedCatalogProduct?.id ?? null}
                    disabledCategories={disabledCategories}
                    onCategoryChange={handleCategoryChange}
                    onProductSelect={handleProductSelect}
                  />
                </div>
                <div className="mt-4">
                  <TryOnView
                    personImageUrl={capturedImage}
                    resultUrl={resultUrl}
                    productName={selectedCatalogProduct?.name || ''}
                    loading={rendering}
                    error={renderError}
                    mirrorMode={false}
                    onClose={resetAll}
                    onDownload={handleDownload}
                  />
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
