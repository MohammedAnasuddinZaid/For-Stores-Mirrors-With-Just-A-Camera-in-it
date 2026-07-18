'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useToast } from '@/components/ui/toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const CATEGORY_OPTIONS = [
  { value: 'UPPER_BODY', label: 'Upper Body' }, { value: 'LOWER_BODY', label: 'Lower Body' },
  { value: 'FULL_BODY', label: 'Full Body' }, { value: 'DRESS', label: 'Dresses' },
  { value: 'GLASSES', label: 'Glasses' }, { value: 'HAT', label: 'Hats' },
  { value: 'JEWELRY', label: 'Jewelry' }, { value: 'SHOES', label: 'Shoes' }, { value: 'OTHER', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' }, { value: 'PUBLISHED', label: 'Published' },
  { value: 'PROCESSING', label: 'Processing' }, { value: 'READY', label: 'Ready' },
  { value: 'ARCHIVED', label: 'Archived' }, { value: 'FAILED', label: 'Failed' },
];

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', category: '', brand: '', sku: '',
    price: '', status: '', try_on_enabled: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const p = await res.json();
        setForm({
          name: p.name || '',
          description: p.description || '',
          category: p.category || 'OTHER',
          brand: p.brand || '',
          sku: p.sku || '',
          price: String(p.price ?? 0),
          status: p.status || 'DRAFT',
          try_on_enabled: p.try_on_enabled ?? true,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          brand: form.brand,
          sku: form.sku || null,
          price: parseFloat(form.price) || 0,
          status: form.status,
          try_on_enabled: form.try_on_enabled,
        }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast('Product updated', 'success');
      router.push(`/products/${id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  if (loading) return <div className="min-h-screen bg-surface-secondary"><LoadingState /></div>;
  if (error) return <div className="min-h-screen bg-surface-secondary"><ErrorState message={error} /></div>;

  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="lg:ml-60">
        <header className="bg-white border-b border-gray-100 px-6 lg:px-8 h-16 flex items-center sticky top-0 z-40">
          <Link href={`/products/${id}`} className="text-sm text-text-secondary hover:text-text-primary transition-colors mr-4">← Back</Link>
          <h1 className="text-lg font-semibold">Edit Product</h1>
        </header>
        <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-gray-100 p-6">
          <Link href="/" className="text-lg font-bold tracking-tight mb-8 block">Admin<span className="text-brand-600">Panel</span></Link>
          <nav className="space-y-1">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-gray-50 text-sm">Dashboard</Link>
            <Link href="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-50 text-brand-700 font-medium text-sm">Products</Link>
          </nav>
        </aside>
        <div className="p-6 lg:p-8 max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input label="Name" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
            <Textarea label="Description" value={form.description} onChange={(e) => updateField('description', e.target.value)} />
            <Select label="Category" options={CATEGORY_OPTIONS} value={form.category} onChange={(e) => updateField('category', e.target.value)} />
            <Input label="Brand" value={form.brand} onChange={(e) => updateField('brand', e.target.value)} />
            <Input label="SKU" value={form.sku} onChange={(e) => updateField('sku', e.target.value)} />
            <Input label="Price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateField('price', e.target.value)} />
            <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={(e) => updateField('status', e.target.value)} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary">Try-On Enabled</label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.try_on_enabled} onChange={(e) => updateField('try_on_enabled', e.target.checked)} className="w-5 h-5 rounded-lg border-gray-300 text-brand-600 focus:ring-brand-400" />
                <span className="text-sm text-text-secondary">Allow try-on for this product</span>
              </label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={saving}>Save Changes</Button>
              <Link href={`/products/${id}`}><Button variant="outline" type="button">Cancel</Button></Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
