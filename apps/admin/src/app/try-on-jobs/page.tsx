'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/components/ui/toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const STATUS_FILTERS = [
  { value: '', label: 'All Status' },
  { value: 'QUEUED', label: 'Queued' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SUCCEEDED', label: 'Succeeded' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'TIMED_OUT', label: 'Timed Out' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function TryOnJobsPage() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to get all sessions first
      // For now, we'll just show a message since the API might not have a list-jobs endpoint
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error('API unreachable');

      // Note: The backend doesn't have a list-all-jobs endpoint yet.
      // We'll show available data and a helpful message.
      setJobs([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleRetryFailed = async () => {
    toast('Retry functionality coming soon', 'info');
  };

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
          <Link href="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-gray-50 text-sm transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
            Products
          </Link>
          <Link href="/try-on-jobs" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-50 text-brand-700 font-medium text-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            Try-On Jobs
          </Link>
        </nav>
      </aside>

      <div className="lg:ml-60">
        <header className="bg-white border-b border-gray-100 px-6 lg:px-8 h-16 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold tracking-tight lg:hidden">Admin<span className="text-brand-600">Panel</span></Link>
            <h1 className="text-lg font-semibold">Try-On Jobs</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleRetryFailed}>Retry Failed</Button>
        </header>

        <div className="p-6 lg:p-8">
          <div className="flex lg:hidden gap-2 mb-6 overflow-x-auto scrollbar-hide">
            <Link href="/" className="px-4 py-2 bg-gray-100 text-text-secondary rounded-xl text-sm font-medium whitespace-nowrap">Dashboard</Link>
            <Link href="/products" className="px-4 py-2 bg-gray-100 text-text-secondary rounded-xl text-sm font-medium whitespace-nowrap">Products</Link>
            <Link href="/try-on-jobs" className="px-4 py-2 bg-brand-50 text-brand-700 rounded-xl text-sm font-medium whitespace-nowrap">Try-On Jobs</Link>
          </div>

          <div className="flex gap-3 mb-6">
            <div className="w-full sm:w-48">
              <Select options={STATUS_FILTERS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <LoadingState message="Loading try-on jobs..." />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchJobs} />
          ) : (
            <Card padding="lg" hover={false}>
              <EmptyState
                icon={
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                }
                title="Monitor Try-On Jobs"
                description="When users try on products, their jobs will appear here. Track status, retry failures, and review results. This feature requires backend support for listing all jobs."
                action={<Link href="/products"><Button variant="outline">Back to Products</Button></Link>}
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
