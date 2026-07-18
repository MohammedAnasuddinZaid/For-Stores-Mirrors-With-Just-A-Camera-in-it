'use client';

import { useState, useCallback, useRef } from 'react';
import { CameraView } from '../components/camera/camera-view';
import type { VisionAnalysis } from '../types';

type AppStep = 'welcome' | 'camera' | 'products' | 'try-on' | 'result';

interface Product {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  price: number;
}

const sampleProducts: Product[] = [
  { id: '1', name: 'Classic Blazer', category: 'UPPER_BODY', imageUrl: '/products/blazer.jpg', price: 149 },
  { id: '2', name: 'Summer Dress', category: 'DRESS', imageUrl: '/products/dress.jpg', price: 89 },
  { id: '3', name: 'Denim Jacket', category: 'UPPER_BODY', imageUrl: '/products/jacket.jpg', price: 129 },
  { id: '4', name: 'Casual Shirt', category: 'UPPER_BODY', imageUrl: '/products/shirt.jpg', price: 59 },
  { id: '5', name: 'Wide Leg Pants', category: 'LOWER_BODY', imageUrl: '/products/pants.jpg', price: 79 },
  { id: '6', name: 'Aviator Sunglasses', category: 'GLASSES', imageUrl: '/products/aviator.jpg', price: 199 },
  { id: '7', name: 'Baseball Cap', category: 'HAT', imageUrl: '/products/cap.jpg', price: 35 },
  { id: '8', name: 'Leather Tote', category: 'OTHER', imageUrl: '/products/tote.jpg', price: 249 },
];

const PRODUCT_IMAGES: Record<string, string> = {
  '1': 'https://placehold.co/400x500/3b82f6/ffffff?text=Blazer',
  '2': 'https://placehold.co/400x500/ec4899/ffffff?text=Dress',
  '3': 'https://placehold.co/400x500/6366f1/ffffff?text=Jacket',
  '4': 'https://placehold.co/400x500/14b8a6/ffffff?text=Shirt',
  '5': 'https://placehold.co/400x500/8b5cf6/ffffff?text=Pants',
  '6': 'https://placehold.co/400x500/f59e0b/ffffff?text=Sunglasses',
  '7': 'https://placehold.co/400x500/ef4444/ffffff?text=Cap',
  '8': 'https://placehold.co/400x500/84cc16/ffffff?text=Tote',
};

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<AppStep>('welcome');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [visionAnalysis, setVisionAnalysis] = useState<VisionAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'standard' | 'ar-glasses'>('standard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = useCallback((dataUrl: string) => {
    setCapturedImage(dataUrl);
    setCurrentStep('products');
  }, []);

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProduct(product);
    if (product.category === 'GLASSES') {
      setMode('ar-glasses');
      setCurrentStep('try-on');
    } else {
      setCurrentStep('try-on');
    }
  }, []);

  const handleStartTryOn = useCallback(async () => {
    if (!capturedImage || !selectedProduct) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Simulate AI inference delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // For demo, combine person image with product overlay
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      await new Promise<void>((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          // Draw person with a simulated try-on overlay
          ctx.drawImage(img, 0, 0);
          // Draw a semi-transparent overlay indicating the garment
          ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
          ctx.fillRect(canvas.width * 0.2, canvas.height * 0.25, canvas.width * 0.6, canvas.height * 0.45);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(`✨ ${selectedProduct.name} ✨`, canvas.width / 2, canvas.height / 2);
          resolve();
        };
        img.src = capturedImage;
      });

      setTryOnResult(canvas.toDataURL('image/jpeg', 0.9));
      setCurrentStep('result');
    } catch (err) {
      setError('Failed to generate try-on result. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [capturedImage, selectedProduct]);

  const handleReset = useCallback(() => {
    setCapturedImage(null);
    setSelectedProduct(null);
    setTryOnResult(null);
    setError(null);
    setVisionAnalysis(null);
    setCurrentStep('welcome');
    setIsProcessing(false);
  }, []);

  const categories = [...new Set(sampleProducts.map(p => p.category))];

  if (currentStep === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-6">🪞</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Virtual Try-On Mirror
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Try on clothes, glasses, and accessories<br />
            using just your camera — instantly and free.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="card p-4 text-center">
              <div className="text-3xl mb-2">📸</div>
              <h3 className="font-semibold text-sm">Take a Photo</h3>
              <p className="text-xs text-gray-500 mt-1">Use your camera to capture yourself</p>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl mb-2">👔</div>
              <h3 className="font-semibold text-sm">Choose Style</h3>
              <p className="text-xs text-gray-500 mt-1">Browse our catalog and pick a product</p>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl mb-2">✨</div>
              <h3 className="font-semibold text-sm">Try It On</h3>
              <p className="text-xs text-gray-500 mt-1">See how it looks on you instantly</p>
            </div>
          </div>

          <button
            onClick={() => setCurrentStep('camera')}
            className="btn-primary text-lg px-10 py-4"
          >
            Start Try-On
          </button>

          <p className="text-xs text-gray-400 mt-4">
            Camera processing stays on your device • No account needed
          </p>
        </div>
      </div>
    );
  }

  if (currentStep === 'camera') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button onClick={handleReset} className="text-gray-600 hover:text-gray-900">
              ← Back
            </button>
            <h2 className="text-xl font-semibold">Take a Photo</h2>
            <div className="w-12" />
          </div>
          <CameraView
            onCapture={handleCapture}
            onVisionUpdate={setVisionAnalysis}
            autoStart={true}
            mirrored={true}
          />
          {visionAnalysis && (
            <div className="mt-3 text-center text-sm text-gray-500">
              {visionAnalysis.message}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentStep === 'products') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setCurrentStep('camera')} className="text-gray-600 hover:text-gray-900">
              ← Retake Photo
            </button>
            <h2 className="text-xl font-semibold">Choose a Product</h2>
            <div className="w-16" />
          </div>

          {/* Category filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => {}}
              className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm whitespace-nowrap font-medium"
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-sm whitespace-nowrap font-medium hover:bg-gray-50"
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="product-grid">
            {sampleProducts.map(product => (
              <button
                key={product.id}
                onClick={() => handleProductSelect(product)}
                className="card group text-left"
              >
                <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                  <img
                    src={PRODUCT_IMAGES[product.id]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 bg-white/90 rounded-lg text-xs font-medium text-gray-700">
                      {product.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm">{product.name}</h3>
                  <p className="text-blue-600 font-semibold text-sm mt-1">${product.price}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'try-on') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentStep('products')} className="text-gray-600 hover:text-gray-900">
              ← Change Product
            </button>
            <h2 className="text-xl font-semibold">Try-On Preview</h2>
            <div className="w-24" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Person image */}
            <div className="card">
              <div className="aspect-[3/4] bg-gray-100">
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="You"
                    className="w-full h-full object-cover mirror"
                  />
                )}
              </div>
              <div className="p-2 text-center text-xs text-gray-500">Your Photo</div>
            </div>

            {/* Product */}
            <div className="card">
              <div className="aspect-[3/4] bg-gray-100">
                {selectedProduct && (
                  <img
                    src={PRODUCT_IMAGES[selectedProduct.id]}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="p-2 text-center text-xs text-gray-500">
                {selectedProduct?.name}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleStartTryOn}
            disabled={isProcessing}
            className="btn-primary w-full text-lg"
          >
            {isProcessing ? 'Generating...' : '✨ Try This On'}
          </button>

          {isProcessing && (
            <div className="mt-4 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                AI is generating your virtual try-on...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentStep === 'result') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button onClick={handleReset} className="text-gray-600 hover:text-gray-900">
              ← Start Over
            </button>
            <h2 className="text-xl font-semibold">Your Try-On Result</h2>
            <div className="w-20" />
          </div>

          <div className="card mb-6">
            <div className="aspect-[3/4] bg-gray-100">
              {tryOnResult && (
                <img
                  src={tryOnResult}
                  alt="Try-On Result"
                  className="w-full h-full object-cover mirror"
                />
              )}
            </div>
          </div>

          {selectedProduct && (
            <div className="card p-4 mb-6">
              <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
              <p className="text-blue-600 font-semibold">${selectedProduct.price}</p>
              {selectedProduct.category !== 'GLASSES' && selectedProduct.category !== 'HAT' && (
                <p className="text-xs text-gray-400 mt-2">
                  ✨ This is an AI-generated preview. Actual product may vary.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setCurrentStep('products')}
              className="btn-secondary"
            >
              Try Another
            </button>
            <button
              onClick={() => setCurrentStep('camera')}
              className="btn-primary"
            >
              New Photo
            </button>
          </div>

          <button
            onClick={handleReset}
            className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700"
          >
            Start fresh
          </button>
        </div>
      </div>
    );
  }

  return null;
}
