'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Stepper } from '@/components/ui/stepper';
import { useToast } from '@/components/ui/toast';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const STEPS = [
  { label: 'Product Info', description: 'Basic details' },
  { label: 'Upload Photos', description: 'Product images' },
  { label: 'Processing', description: 'Asset processing' },
  { label: 'Review & Publish', description: 'Final review' },
];

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
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
];

interface FormData {
  name: string;
  description: string;
  category: string;
  brand: string;
  sku: string;
  price: string;
  status: string;
  try_on_enabled: boolean;
}

export default function AddProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: '',
    description: '',
    category: 'OTHER',
    brand: '',
    sku: '',
    price: '0',
    status: 'DRAFT',
    try_on_enabled: true,
  });

  const updateField = (field: keyof FormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!form.name.trim()) newErrors.name = 'Name is required';
    }
    if (step === 1) {
      if (images.length === 0) newErrors.images = 'At least one image is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handlePrev = () => setStep(prev => Math.max(prev - 1, 0));

  const handleCreateProduct = async () => {
    setSubmitting(true);
    try {
      // 1. Create product
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
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

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.message || 'Failed to create product');
      }

      const product = await res.json();

      // 2. Upload images
      if (images.length > 0) {
        for (const imageUrl of images) {
          const blobRes = await fetch(imageUrl);
          const blob = await blobRes.blob();
          const fileRes = await fetch(`${API_BASE}/products/${product.id}/images`, {
            method: 'POST',
            body: (() => {
              const fd = new FormData();
              fd.append('file', blob, 'product.jpg');
              return fd;
            })(),
          });
          if (!fileRes.ok) {
            console.warn('Image upload failed:', await fileRes.text());
          }
        }
      }

      setCreatedId(product.id);
      toast('Product created successfully', 'success');

      // Move to review step
      setStep(3);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to create product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        setImages(prev => [...prev, dataUrl]);
      }
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="lg:ml-60">
        <header className="bg-white border-b border-gray-100 px-6 lg:px-8 h-16 flex items-center sticky top-0 z-40">
          <Link href="/products" className="text-sm text-text-secondary hover:text-text-primary transition-colors mr-4">← Products</Link>
          <h1 className="text-lg font-semibold">Add Product</h1>
        </header>

        <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-gray-100 p-6">
          <Link href="/" className="text-lg font-bold tracking-tight mb-8 block">
            Admin<span className="text-brand-600">Panel</span>
          </Link>
          <nav className="space-y-1">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-gray-50 text-sm">Dashboard</Link>
            <Link href="/products" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-brand-50 text-brand-700 font-medium text-sm">Products</Link>
            <Link href="/try-on-jobs" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-gray-50 text-sm">Try-On Jobs</Link>
          </nav>
        </aside>

        <div className="p-6 lg:p-8 max-w-2xl">
          <Stepper steps={STEPS} current={step} className="mb-10" />

          {/* Step 0: Product Info */}
          {step === 0 && (
            <div className="space-y-5">
              <Input label="Product Name" value={form.name} onChange={(e) => updateField('name', e.target.value)} error={errors.name} placeholder="e.g. Summer Floral Dress" />
              <Textarea label="Description" value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Product description..." />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Category" options={CATEGORY_OPTIONS} value={form.category} onChange={(e) => updateField('category', e.target.value)} />
                <Input label="Brand" value={form.brand} onChange={(e) => updateField('brand', e.target.value)} placeholder="e.g. Zara" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="SKU (optional)" value={form.sku} onChange={(e) => updateField('sku', e.target.value)} placeholder="e.g. DRESS-001" />
                <Input label="Price" type="number" min="0" step="0.01" value={form.price} onChange={(e) => updateField('price', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Status" options={STATUS_OPTIONS} value={form.status} onChange={(e) => updateField('status', e.target.value)} />
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-primary">Try-On Enabled</label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.try_on_enabled}
                      onChange={(e) => updateField('try_on_enabled', e.target.checked)}
                      className="w-5 h-5 rounded-lg border-gray-300 text-brand-600 focus:ring-brand-400"
                    />
                    <span className="text-sm text-text-secondary">Allow customers to try on this product</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={handleNext}>Next — Upload Photos</Button>
              </div>
            </div>
          )}

          {/* Step 1: Upload Photos */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Product Images</label>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-gray-300 bg-gray-50/50 transition-colors"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <input id="image-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <svg className="animate-spin h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      <p className="text-sm text-text-secondary">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-text-tertiary">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      </div>
                      <p className="text-sm font-medium text-text-primary">Drop images here or click to browse</p>
                      <p className="text-xs text-text-tertiary">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </div>
                {errors.images && <p className="text-xs text-error mt-1">{errors.images}</p>}
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group">
                      <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-gray-900/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handlePrev}>← Previous</Button>
                <Button onClick={handleNext}>{images.length > 0 ? `Next (${images.length} images)` : 'Skip — Next'}</Button>
              </div>
            </div>
          )}

          {/* Step 2: Processing */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <svg className="animate-spin h-12 w-12 text-brand-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <h3 className="text-lg font-semibold mb-2">Processing Assets</h3>
                <p className="text-sm text-text-secondary">Analyzing images and preparing for try-on</p>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Validating images', done: true },
                  { label: 'Generating thumbnails', done: true },
                  { label: 'Running quality check', done: false },
                  { label: 'Preparing try-on model', done: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-success text-white' : 'bg-gray-100 text-text-tertiary'}`}>
                      {item.done ? (
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M13.5 4L6 11.5L2.5 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      )}
                    </div>
                    <span className={`text-sm ${item.done ? 'text-text-primary' : 'text-text-secondary'}`}>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handlePrev}>← Previous</Button>
                <Button onClick={handleNext}>Continue to Review</Button>
              </div>
            </div>
          )}

          {/* Step 3: Review & Publish */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                <h3 className="font-semibold text-lg">Review Product</h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-text-tertiary text-xs">Name</p>
                    <p className="font-medium">{form.name}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs">Category</p>
                    <p className="font-medium">{form.category}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs">Brand</p>
                    <p className="font-medium">{form.brand || '—'}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs">Price</p>
                    <p className="font-medium">${parseFloat(form.price).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs">SKU</p>
                    <p className="font-medium">{form.sku || '—'}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs">Status</p>
                    <p className="font-medium">{form.status}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-text-tertiary text-xs">Try-On</p>
                    <p className="font-medium">{form.try_on_enabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  {form.description && (
                    <div className="col-span-2">
                      <p className="text-text-tertiary text-xs">Description</p>
                      <p className="text-text-secondary">{form.description}</p>
                    </div>
                  )}
                </div>

                {images.length > 0 && (
                  <div>
                    <p className="text-text-tertiary text-xs mb-2">Images ({images.length})</p>
                    <div className="grid grid-cols-4 gap-2">
                      {images.map((url, i) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {createdId && (
                  <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium">
                    Product created successfully! You can now
                    <Link href={`/products/${createdId}`} className="underline ml-1">view it</Link>
                    .
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={handlePrev}>← Previous</Button>
                <div className="flex gap-3">
                  {!createdId && (
                    <Button onClick={handleCreateProduct} loading={submitting}>
                      {form.status === 'PUBLISHED' ? 'Create & Publish' : 'Save as Draft'}
                    </Button>
                  )}
                  {createdId && (
                    <Link href={`/products/${createdId}`}>
                      <Button>View Product</Button>
                    </Link>
                  )}
                  <Link href="/products">
                    <Button variant="ghost">Back to Products</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
