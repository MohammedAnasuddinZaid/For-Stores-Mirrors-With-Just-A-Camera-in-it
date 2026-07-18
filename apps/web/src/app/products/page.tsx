'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Product, ProductListResponse, CATEGORY_LABELS } from '@/types';
import { ProductCard } from '@/components/ui/product-card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Pagination } from '@/components/ui/pagination';

const STATUS_OPTIONS = [
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'READY', label: 'Ready' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (status) params.set('status', status);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load products');
      const data: ProductListResponse = await res.json();
      setProducts(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, category, status, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Top Nav */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="container-wide flex items-center justify-between h-16">
          <Link href="/" className="text-lg font-bold tracking-tight">
            VirtualTry<span className="text-brand-600">On</span>
          </Link>
          <Link href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Home
          </Link>
        </div>
      </nav>

      <div className="container-wide py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Products</h1>
          <p className="text-text-secondary">Browse and try on products with your camera</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={[{ value: '', label: 'All Categories' }, ...Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))]}
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select
              options={[{ value: '', label: 'All Status' }, ...STATUS_OPTIONS]}
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Results Info */}
        {!loading && !error && (
          <p className="text-sm text-text-tertiary mb-4">
            {total} product{total !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Content */}
        {loading ? (
          <LoadingState message="Loading products..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchProducts} />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description={search || category || status ? 'Try adjusting your filters' : 'No products available yet.'}
            action={search || category || status ? <Button variant="outline" onClick={() => { setSearch(''); setCategory(''); setStatus(''); setPage(1); }}>Clear Filters</Button> : undefined}
          />
        ) : (
          <>
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
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
