'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Input, Select } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Pagination } from '@/components/ui/pagination';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const CATEGORY_OPTIONS = [
  { value: 'UPPER_BODY', label: 'Upper Body' },
  { value: 'LOWER_BODY', label: 'Lower Body' },
  { value: 'FULL_BODY', label: 'Full Body' },
  { value: 'DRESS', label: 'Dresses' },
  { value: 'GLASSES', label: 'Glasses' },
  { value: 'HAT', label: 'Hats' },
  { value: 'JEWELRY', label: 'Jewelry' },
  { value: 'SHOES', label: 'Shoes' },
  { value: 'OTHER', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'READY', label: 'Ready' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'FAILED', label: 'Failed' },
];

export default function ProductListPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
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
      const res = await fetch(`${API_BASE}/products?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search, category, status, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      } else {
        alert('Failed to delete product');
      }
    } catch {
      alert('Failed to delete product');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-surface-secondary">
      <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-gray-100 p-6 hidden lg:block">
        <Link href="/" className="text-lg font-bold tracking-tight mb-8 block">
          Admin<span className="text-brand-600">Panel</span>
        </Link>
        <nav className="space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-gray-50 text-sm transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            Dashboard
          </Link>
          <Link href="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-50 text-brand-700 font-medium text-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
            Products
          </Link>
          <Link href="/try-on-jobs" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-gray-50 text-sm transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            Try-On Jobs
          </Link>
        </nav>
      </aside>

      <div className="lg:ml-60">
        <header className="bg-white border-b border-gray-100 px-6 lg:px-8 h-16 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold tracking-tight lg:hidden">Admin<span className="text-brand-600">Panel</span></Link>
            <h1 className="text-lg font-semibold">Products</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg ${viewMode === 'table' ? 'bg-gray-100 text-text-primary' : 'text-text-tertiary'} hover:bg-gray-100 transition-colors`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-gray-100 text-text-primary' : 'text-text-tertiary'} hover:bg-gray-100 transition-colors`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
            </button>
            <Link href="/products/add"><Button size="sm">+ Add Product</Button></Link>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          <div className="flex lg:hidden gap-2 mb-6 overflow-x-auto scrollbar-hide">
            <Link href="/" className="px-4 py-2 bg-gray-100 text-text-secondary rounded-xl text-sm font-medium whitespace-nowrap hover:bg-gray-200">Dashboard</Link>
            <Link href="/products" className="px-4 py-2 bg-brand-50 text-brand-700 rounded-xl text-sm font-medium whitespace-nowrap">Products</Link>
            <Link href="/try-on-jobs" className="px-4 py-2 bg-gray-100 text-text-secondary rounded-xl text-sm font-medium whitespace-nowrap hover:bg-gray-200">Try-On Jobs</Link>
            <Link href="/products/add" className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium whitespace-nowrap">+ Add</Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <Input placeholder="Search name, brand, SKU..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <div className="w-full sm:w-44">
              <Select options={[{ value: '', label: 'All Categories' }, ...CATEGORY_OPTIONS]} value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} />
            </div>
            <div className="w-full sm:w-36">
              <Select options={[{ value: '', label: 'All Status' }, ...STATUS_OPTIONS]} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} />
            </div>
          </div>

          <p className="text-sm text-text-tertiary mb-4">{total} product{total !== 1 ? 's' : ''}</p>

          {loading ? (
            <LoadingState message="Loading products..." />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchProducts} />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products found"
              description={search || category || status ? 'Try adjusting your filters' : 'Add your first product to get started.'}
              action={
                search || category || status
                  ? <Button variant="outline" onClick={() => { setSearch(''); setCategory(''); setStatus(''); setPage(1); }}>Clear Filters</Button>
                  : <Link href="/products/add"><Button>Add Product</Button></Link>
              }
            />
          ) : viewMode === 'table' ? (
            <Card padding="none" hover={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs text-text-tertiary font-medium uppercase tracking-wider">Product</th>
                      <th className="text-left px-4 py-3 text-xs text-text-tertiary font-medium uppercase tracking-wider hidden sm:table-cell">Category</th>
                      <th className="text-left px-4 py-3 text-xs text-text-tertiary font-medium uppercase tracking-wider hidden md:table-cell">Brand</th>
                      <th className="text-left px-4 py-3 text-xs text-text-tertiary font-medium uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs text-text-tertiary font-medium uppercase tracking-wider hidden md:table-cell">Try-On</th>
                      <th className="text-right px-4 py-3 text-xs text-text-tertiary font-medium uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                              {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : null}
                            </div>
                            <div>
                              <Link href={`/products/${p.id}`} className="font-medium text-text-primary hover:text-brand-600">{p.name}</Link>
                              <p className="text-xs text-text-tertiary">${p.price?.toFixed(2)} {p.currency}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-text-secondary hidden sm:table-cell">{p.category}</td>
                        <td className="px-4 py-3.5 text-text-secondary hidden md:table-cell">{p.brand || '—'}</td>
                        <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                        <td className="px-4 py-3.5 hidden md:table-cell">
                          {p.try_on_enabled ? <span className="text-xs text-success font-medium">Enabled</span> : <span className="text-xs text-text-tertiary">Disabled</span>}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/products/${p.id}`} className="px-2.5 py-1.5 text-xs text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">Edit</Link>
                            <button onClick={() => handleDelete(p.id, p.name)} className="px-2.5 py-1.5 text-xs text-error hover:bg-red-50 rounded-lg transition-colors">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map(p => (
                <Link key={p.id} href={`/products/${p.id}`} className="block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all">
                  <div className="aspect-[4/5] bg-gray-100 overflow-hidden">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <StatusBadge status={p.status} size="sm" />
                      <span className="text-xs text-text-secondary">${p.price?.toFixed(2)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
