'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Product, ProductListResponse } from '@/types';
import { ProductCard } from '@/components/ui/product-card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products?page=1&limit=8');
        if (!res.ok) throw new Error('Failed to load products');
        const data: ProductListResponse = await res.json();
        setProducts(data.items.filter(p => p.status === 'PUBLISHED'));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="container-wide flex items-center justify-between h-16">
          <Link href="/" className="text-lg font-bold tracking-tight">
            VirtualTry<span className="text-brand-600">On</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/mirror" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Mirror Mode
            </Link>
            <Link href="/products">
              <Button size="sm">Browse</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-brand-50/50" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-brand-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-20 w-72 h-72 bg-brand-300/20 rounded-full blur-3xl" />
        <div className="container-wide relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-100 text-brand-700 text-xs font-medium rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
              No app download required
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-4">
              Try Before You
              <span className="text-brand-600 block">Buy — Virtually</span>
            </h1>
            <p className="text-lg text-text-secondary leading-relaxed max-w-lg mb-8">
              Use your camera to see how clothes, accessories, and eyewear look on you.
              No downloads, no sign-up, just your browser.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/products">
                <Button size="xl">
                  Browse Collection
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Button>
              </Link>
              <Link href="/mirror">
                <Button variant="outline" size="xl">
                  Mirror Mode
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container-wide">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Choose a Product', desc: 'Browse our catalog and pick something you like.' },
              { step: '02', title: 'Take a Photo', desc: 'Use your camera or upload a photo. We handle the rest.' },
              { step: '03', title: 'See It On You', desc: 'AI shows you how the product looks in seconds.' },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-brand-600">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-surface-secondary">
        <div className="container-wide">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Featured Products</h2>
              <p className="text-sm text-text-secondary mt-1">Try on any item with your camera</p>
            </div>
            <Link href="/products">
              <Button variant="ghost" size="sm">
                View All
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Button>
            </Link>
          </div>
          {loading ? (
            <LoadingState message="Loading products..." />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-text-secondary mb-4">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">No products available yet.</p>
            </div>
          ) : (
            <div className="product-grid">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  imageUrl={product.image_url}
                  category={product.category}
                  brand={product.brand}
                  price={product.price}
                  tryOnEnabled={product.try_on_enabled}
                  status={product.status}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="container-wide">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-text-tertiary">
              VirtualTryOn — Zero-cost AI virtual try-on platform
            </p>
            <div className="flex items-center gap-6 text-xs text-text-tertiary">
              <Link href="/products">Products</Link>
              <Link href="/mirror">Mirror Mode</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
