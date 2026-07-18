'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface ProductCounts {
  total: number;
  published: number;
  draft: number;
  processing: number;
  failed: number;
}

interface RecentProduct {
  id: string;
  name: string;
  status: string;
  created_at: string;
  category: string;
}

export default function AdminDashboard() {
  const [counts, setCounts] = useState<ProductCounts | null>(null);
  const [recent, setRecent] = useState<RecentProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<string>('');

  useEffect(() => {
    async function load() {
      try {
        // Fetch counts and recent items
        const res = await fetch(`${API_BASE}/products?limit=5`);
        if (res.ok) {
          const data = await res.json();
          setRecent(data.items || []);
          // Calculate counts from all products
          const allRes = await fetch(`${API_BASE}/products?limit=100`);
          if (allRes.ok) {
            const allData = await allRes.json();
            const items = allData.items || [];
            setCounts({
              total: allData.total || items.length,
              published: items.filter((p: any) => p.status === 'PUBLISHED').length,
              draft: items.filter((p: any) => p.status === 'DRAFT').length,
              processing: items.filter((p: any) => p.status === 'PROCESSING').length,
              failed: items.filter((p: any) => p.status === 'FAILED').length,
            });
          }
        }
        // Health check
        const healthRes = await fetch(`${API_BASE}/health`);
        if (healthRes.ok) {
          const h = await healthRes.json();
          setHealth(h.status || 'ok');
        }
      } catch {
        setHealth('unreachable');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-gray-100 p-6 hidden lg:block">
        <div className="text-lg font-bold tracking-tight mb-8">
          Admin<span className="text-brand-600">Panel</span>
        </div>
        <nav className="space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-50 text-brand-700 font-medium text-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
            Dashboard
          </Link>
          <Link href="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-gray-50 text-sm transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            Products
          </Link>
          <Link href="/try-on-jobs" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-gray-50 text-sm transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Try-On Jobs
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <div className="lg:ml-60">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-100 px-6 lg:px-8 h-16 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold tracking-tight lg:hidden">Admin<span className="text-brand-600">Panel</span></Link>
            <h1 className="text-lg font-semibold hidden sm:block">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className={`w-2 h-2 rounded-full ${health === 'ok' ? 'bg-success' : 'bg-error'}`} />
              <span className="text-text-secondary">API: {health}</span>
            </div>
            <Link href="/products/add">
              <Button size="sm">+ Add Product</Button>
            </Link>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {/* Mobile Nav */}
          <div className="flex lg:hidden gap-2 mb-6 overflow-x-auto scrollbar-hide">
            <Link href="/" className="px-4 py-2 bg-brand-50 text-brand-700 rounded-xl text-sm font-medium whitespace-nowrap">Dashboard</Link>
            <Link href="/products" className="px-4 py-2 bg-gray-100 text-text-secondary rounded-xl text-sm font-medium whitespace-nowrap hover:bg-gray-200">Products</Link>
            <Link href="/try-on-jobs" className="px-4 py-2 bg-gray-100 text-text-secondary rounded-xl text-sm font-medium whitespace-nowrap hover:bg-gray-200">Try-On Jobs</Link>
            <Link href="/products/add" className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium whitespace-nowrap">+ Add</Link>
          </div>

          {loading ? (
            <LoadingState message="Loading dashboard..." />
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {[
                  { label: 'Total Products', value: counts?.total ?? 0, color: 'text-text-primary' },
                  { label: 'Published', value: counts?.published ?? 0, color: 'text-success' },
                  { label: 'Draft', value: counts?.draft ?? 0, color: 'text-text-secondary' },
                  { label: 'Processing', value: counts?.processing ?? 0, color: 'text-warning' },
                  { label: 'Failed', value: counts?.failed ?? 0, color: 'text-error' },
                ].map(stat => (
                  <Card key={stat.label} padding="lg" hover={false}>
                    <p className="text-xs text-text-tertiary mb-1">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </Card>
                ))}
              </div>

              {/* Recent Products */}
              <Card padding="none" hover={false}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold">Recent Products</h2>
                  <Link href="/products" className="text-xs text-brand-600 hover:text-brand-700 font-medium">View All</Link>
                </div>
                {recent.length === 0 ? (
                  <div className="p-6 text-center text-sm text-text-secondary">No products yet</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {recent.map(p => (
                      <Link key={p.id} href={`/products/${p.id}`} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-text-primary">{p.name}</p>
                          <p className="text-xs text-text-tertiary mt-0.5">{p.category}</p>
                        </div>
                        <StatusBadge status={p.status} />
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                <Link href="/products/add" className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 flex-shrink-0">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Add Product</p>
                    <p className="text-xs text-text-tertiary">Create a new product listing</p>
                  </div>
                </Link>
                <Link href="/products" className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Manage Products</p>
                    <p className="text-xs text-text-tertiary">Edit, publish, or archive</p>
                  </div>
                </Link>
                <Link href="/try-on-jobs" className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Try-On Jobs</p>
                    <p className="text-xs text-text-tertiary">Monitor try-on processing</p>
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
