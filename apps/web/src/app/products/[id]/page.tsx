'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product, CATEGORY_LABELS } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge, TryOnBadge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const data: Product = await res.json();
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-surface-secondary"><LoadingState message="Loading product..." /></div>;
  if (error || !product) return (
    <div className="min-h-screen bg-surface-secondary">
      <ErrorState message={error || 'Product not found'} onRetry={() => router.push('/products')} />
    </div>
  );

  const productImageSrc = product.image_url?.startsWith('http') || product.image_url?.startsWith('data:')
    ? product.image_url
    : `/api/products/${product.id}/image`;

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="container-wide flex items-center justify-between h-16">
          <Link href="/" className="text-lg font-bold tracking-tight">
            VirtualTry<span className="text-brand-600">On</span>
          </Link>
          <Link href="/products" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            ← Back to Products
          </Link>
        </div>
      </nav>

      <div className="container-wide py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
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

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-text-tertiary uppercase tracking-wider">
                {CATEGORY_LABELS[product.category] || product.category}
              </span>
              <span className="text-text-tertiary">·</span>
              <span className="text-sm text-text-secondary">{product.brand}</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold mb-2">{product.name}</h1>

            {product.price > 0 && (
              <p className="text-2xl font-semibold text-brand-600 mb-4">
                ${product.price.toFixed(2)}
                <span className="text-sm font-normal text-text-tertiary ml-1">{product.currency}</span>
              </p>
            )}

            <div className="flex items-center gap-2 mb-6">
              <StatusBadge status={product.status} />
              {product.try_on_enabled && <Badge variant="brand">Try-On Available</Badge>}
            </div>

            {product.sku && (
              <p className="text-xs text-text-tertiary mb-4">SKU: {product.sku}</p>
            )}

            {product.description && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-text-primary mb-2">Description</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{product.description}</p>
              </div>
            )}

            <div className="mt-auto space-y-3 pt-6 border-t border-gray-100">
              {product.try_on_enabled && product.status === 'PUBLISHED' && (
                <Link href={`/try-on/${product.id}`}>
                  <Button size="lg" fullWidth>
                    Try It On
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </Button>
                </Link>
              )}
              <Link href="/products">
                <Button variant="outline" size="lg" fullWidth>
                  ← Back to Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
