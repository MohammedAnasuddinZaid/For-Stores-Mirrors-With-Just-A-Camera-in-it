'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/components/ui/toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/products/${id}`);
      if (!res.ok) throw new Error('Product not found');
      setProduct(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProduct(); }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${product?.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Product deleted', 'success');
        router.push('/products');
      } else {
        toast('Failed to delete product', 'error');
      }
    } catch {
      toast('Failed to delete product', 'error');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast(`Product ${newStatus.toLowerCase()}`, 'success');
        fetchProduct();
      } else {
        toast('Failed to update status', 'error');
      }
    } catch {
      toast('Failed to update status', 'error');
    }
  };

  if (loading) return <div className="min-h-screen bg-surface-secondary"><LoadingState /></div>;
  if (error || !product) return <div className="min-h-screen bg-surface-secondary"><ErrorState message={error || 'Not found'} onRetry={fetchProduct} /></div>;

  const isPublished = product.status === 'PUBLISHED';

  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="lg:ml-60">
        <header className="bg-white border-b border-gray-100 px-6 lg:px-8 h-16 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Link href="/products" className="text-sm text-text-secondary hover:text-text-primary transition-colors">← Products</Link>
            <h1 className="text-lg font-semibold truncate max-w-[300px]">{product.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/products/${id}/edit`}><Button variant="outline" size="sm">Edit</Button></Link>
            <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
          </div>
        </header>

        <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-gray-100 p-6">
          <Link href="/" className="text-lg font-bold tracking-tight mb-8 block">Admin<span className="text-brand-600">Panel</span></Link>
          <nav className="space-y-1">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-gray-50 text-sm">Dashboard</Link>
            <Link href="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-50 text-brand-700 font-medium text-sm">Products</Link>
            <Link href="/try-on-jobs" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-gray-50 text-sm">Try-On Jobs</Link>
          </nav>
        </aside>

        <div className="p-6 lg:p-8">
          <div className="flex lg:hidden gap-2 mb-6 overflow-x-auto scrollbar-hide">
            <Link href="/" className="px-4 py-2 bg-gray-100 text-text-secondary rounded-xl text-sm font-medium whitespace-nowrap">Dashboard</Link>
            <Link href="/products" className="px-4 py-2 bg-brand-50 text-brand-700 rounded-xl text-sm font-medium whitespace-nowrap">Products</Link>
            <Link href="/try-on-jobs" className="px-4 py-2 bg-gray-100 text-text-secondary rounded-xl text-sm font-medium whitespace-nowrap">Try-On Jobs</Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Image */}
            <div className="lg:col-span-1">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M3 9h18" /></svg>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card padding="lg" hover={false}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{product.name}</h2>
                    <p className="text-text-secondary">{product.category} · {product.brand || 'Unknown brand'}</p>
                  </div>
                  <StatusBadge status={product.status} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-text-tertiary text-xs">Price</p><p className="font-medium">${product.price?.toFixed(2)} {product.currency}</p></div>
                  <div><p className="text-text-tertiary text-xs">SKU</p><p className="font-medium">{product.sku || '—'}</p></div>
                  <div><p className="text-text-tertiary text-xs">Try-On</p><p className="font-medium">{product.try_on_enabled ? 'Enabled' : 'Disabled'}</p></div>
                  <div><p className="text-text-tertiary text-xs">Created</p><p className="font-medium">{product.created_at ? new Date(product.created_at).toLocaleDateString() : '—'}</p></div>
                </div>
              </Card>

              {product.description && (
                <Card padding="lg" hover={false}>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{product.description}</p>
                </Card>
              )}

              <Card padding="lg" hover={false}>
                <h3 className="font-semibold mb-4">Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {isPublished ? (
                    <Button variant="secondary" size="sm" onClick={() => handleStatusChange('DRAFT')}>Unpublish</Button>
                  ) : (
                    <Button size="sm" onClick={() => handleStatusChange('PUBLISHED')}>Publish</Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => handleStatusChange('ARCHIVED')}>Archive</Button>
                  <Link href={`/products/${id}/edit`}><Button variant="outline" size="sm">Edit Product</Button></Link>
                </div>
              </Card>

              {product.image_url && (
                <Card padding="lg" hover={false}>
                  <h3 className="font-semibold mb-3">Image Details</h3>
                  <div className="text-sm text-text-secondary space-y-1">
                    <p>URL: <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded break-all">{product.image_url}</code></p>
                    {product.thumbnail_url && <p>Thumbnail: <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded break-all">{product.thumbnail_url}</code></p>}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
