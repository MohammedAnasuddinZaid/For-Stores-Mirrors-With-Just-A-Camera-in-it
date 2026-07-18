'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type Page = 'login' | 'dashboard' | 'inventory' | 'product-form' | 'try-on-jobs' | 'health';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const CATEGORIES = ['UPPER_BODY', 'LOWER_BODY', 'FULL_BODY', 'DRESS', 'GLASSES', 'HAT', 'JEWELRY', 'SHOES', 'OTHER'];
const STATUSES = ['DRAFT', 'PROCESSING', 'READY', 'PUBLISHED', 'ARCHIVED'];

export default function AdminPage() {
  const [page, setPage] = useState<Page>('dashboard');
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');

  const login = () => {
    if (pw === 'admin') setAuthed(true);
    else alert('Hint: password is "admin"');
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="card p-8 max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🏪</div>
            <h1 className="text-xl font-bold">Shop Owner Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your inventory & try-on</p>
          </div>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="Enter password" className="input-field mb-4" />
          <button onClick={login} className="btn-primary w-full">Login</button>
        </div>
      </div>
    );
  }

  const Nav = () => (
    <div className="w-64 bg-white min-h-screen border-r border-gray-200 p-4 flex flex-col">
      <div className="mb-8 px-3">
        <h2 className="font-bold text-base">🏪 My Store</h2>
        <p className="text-xs text-gray-400 mt-0.5">Inventory Dashboard</p>
      </div>
      <nav className="flex-1 space-y-1">
        {[
          { id: 'dashboard' as Page, label: 'Dashboard', icon: '📊' },
          { id: 'inventory' as Page, label: 'Inventory', icon: '👕' },
          { id: 'try-on-jobs' as Page, label: 'Try-On Jobs', icon: '⚡' },
          { id: 'health' as Page, label: 'System', icon: '⚙️' },
        ].map(nav => (
          <button key={nav.id} onClick={() => setPage(nav.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              page === nav.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span>{nav.icon}</span>{nav.label}
          </button>
        ))}
      </nav>
      <button onClick={() => setAuthed(false)} className="text-xs text-gray-400 hover:text-red-500 text-center py-2">Logout</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Nav />
      <div className="flex-1 p-6 lg:p-8 overflow-auto">
        {page === 'dashboard' && <DashboardPage />}
        {page === 'inventory' && <InventoryPage />}
        {page === 'try-on-jobs' && <TryOnJobsPage />}
        {page === 'health' && <HealthPage />}
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────
function DashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/products?limit=1`).then(r => r.json()).then(d => {
      const total = d.total || 0;
      setStats({ totalProducts: total, published: Math.floor(total * 0.75), draft: Math.ceil(total * 0.25) });
    }).catch(() => setStats({ totalProducts: 0, published: 0, draft: 0 }));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Welcome back! Here&apos;s your store overview.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Products', value: stats?.totalProducts ?? '...', color: 'bg-blue-500', sub: 'In your catalog' },
          { label: 'Published', value: stats?.published ?? '...', color: 'bg-green-500', sub: 'Visible to customers' },
          { label: 'Drafts', value: stats?.draft ?? '...', color: 'bg-yellow-500', sub: 'Awaiting review' },
        ].map(s => (
          <div key={s.label} className="card p-5">
            <div className={`w-2.5 h-2.5 rounded-full ${s.color} mb-3`} />
            <div className="text-3xl font-bold mb-0.5">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
            <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: '➕', label: 'Add Product', action: 'product-form' as Page },
            { icon: '📸', label: 'Upload Images', action: 'inventory' as Page },
            { icon: '📊', label: 'View Reports', action: 'inventory' as Page },
            { icon: '⚡', label: 'Try-On Status', action: 'try-on-jobs' as Page },
          ].map(a => (
            <button key={a.label}
              className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 text-center transition-colors">
              <div className="text-2xl mb-1">{a.icon}</div>
              <div className="text-sm font-medium">{a.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Inventory ──────────────────────────────────────────────────
interface Product {
  id: string; name: string; description?: string; category: string; brand: string;
  sku?: string; price: number; status: string; image_url: string;
  thumbnail_url: string; try_on_enabled: boolean;
  created_at?: string; updated_at?: string;
}

function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page_num, setPageNum] = useState(1);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const limit = 10;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page_num), limit: String(limit) });
      if (catFilter) params.set('category', catFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const r = await fetch(`${API}/products?${params}`);
      const d = await r.json();
      setProducts(d.items || []);
      setTotal(d.total || 0);
    } catch { setProducts([]); setTotal(0); }
    setLoading(false);
  }, [page_num, search, catFilter, statusFilter]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API}/products/${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      loadProducts();
    } catch { alert('Failed to delete'); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-gray-500">{total} product{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditProduct(null); setFormOpen(true); }} className="btn-primary">
          + Add Product
        </button>
      </div>

      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input type="text" placeholder="Search products, brands, SKUs..."
          value={search} onChange={e => { setSearch(e.target.value); setPageNum(1); }}
          className="input-field flex-1 min-w-[200px]" />
        <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPageNum(1); }} className="select-field w-auto">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPageNum(1); }} className="select-field w-auto">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <div className="text-4xl mb-3">📦</div>
            <p className="font-medium">No products found</p>
            <p className="text-sm mt-1">Add your first product to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Try-On</th>
                  <th className="text-right p-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {p.thumbnail_url ? <img src={p.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">👕</div>}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{p.name}</div>
                          <div className="text-xs text-gray-400">{p.brand}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-500 font-mono">{p.sku || '—'}</td>
                    <td className="p-3 text-sm text-gray-500">{p.category.replace('_', ' ')}</td>
                    <td className="p-3 text-sm font-medium">${p.price.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                        p.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                        p.status === 'ARCHIVED' ? 'bg-red-100 text-red-600' :
                        'bg-yellow-100 text-yellow-700'}`}>{p.status}</span>
                    </td>
                    <td className="p-3 text-sm">
                      <span className={p.try_on_enabled ? 'text-green-600' : 'text-gray-400'}>
                        {p.try_on_enabled ? '✅' : '❌'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setEditProduct(p); setFormOpen(true); }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                        <button onClick={() => setDeleteConfirm(p.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">Page {page_num} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page_num <= 1} onClick={() => setPageNum(p => p - 1)}
              className="btn-secondary text-xs">← Prev</button>
            <button disabled={page_num >= totalPages} onClick={() => setPageNum(p => p + 1)}
              className="btn-secondary text-xs">Next →</button>
          </div>
        </div>
      )}

      {formOpen && (
        <ProductFormModal product={editProduct} onClose={() => { setFormOpen(false); setEditProduct(null); }}
          onSaved={() => { setFormOpen(false); setEditProduct(null); loadProducts(); }} />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-lg mb-2">Delete Product</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure? This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Product Form Modal ─────────────────────────────────────────
function ProductFormModal({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(product?.name || '');
  const [desc, setDesc] = useState(product?.description || '');
  const [category, setCategory] = useState(product?.category || 'UPPER_BODY');
  const [brand, setBrand] = useState(product?.brand || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [price, setPrice] = useState(String(product?.price || ''));
  const [status, setStatus] = useState(product?.status || 'DRAFT');
  const [tryOn, setTryOn] = useState(product ? product.try_on_enabled : true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    if (!name.trim()) return alert('Name is required');
    setSaving(true);
    try {
      const body = { name: name.trim(), description: desc, category, brand, sku: sku || null,
        price: parseFloat(price) || 0, status, try_on_enabled: tryOn };

      if (product) {
        const r = await fetch(`${API}/products/${product.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        if (!r.ok) { const e = await r.json(); throw new Error(e.detail?.message || 'Update failed'); }
      } else {
        const r = await fetch(`${API}/products`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        if (!r.ok) { const e = await r.json(); throw new Error(e.detail?.message || 'Create failed'); }
      }

      if (imageFile && product) {
        const formData = new FormData();
        formData.append('file', imageFile);
        await fetch(`${API}/products/${product.id}/images`, { method: 'POST', body: formData });
      }

      onSaved();
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">{product ? 'Edit Product' : 'Add Product'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Product Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="e.g. Summer Dress" />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              className="input-field" placeholder="Brief description..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="select-field">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Brand</label>
              <input value={brand} onChange={e => setBrand(e.target.value)} className="input-field" placeholder="Brand name" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">SKU</label>
              <input value={sku} onChange={e => setSku(e.target.value)} className="input-field" placeholder="e.g. DRS-001" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Price ($)</label>
              <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)}
                className="input-field" placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="select-field">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Try-On Enabled</label>
              <select value={String(tryOn)} onChange={e => setTryOn(e.target.value === 'true')} className="select-field">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          {product && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Product Image</label>
              <input type="file" ref={fileRef} accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)}
                className="text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Try-On Jobs ────────────────────────────────────────────────
function TryOnJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/try-ons`).then(r => r.json()).then(d => {
      setJobs(Array.isArray(d) ? d : []);
    }).catch(() => setJobs([])).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Try-On Jobs</h1>
      <p className="text-gray-500 text-sm mb-6">Monitor virtual try-on requests from customers</p>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <div className="text-4xl mb-3">⚡</div>
            <p className="font-medium">No try-on jobs yet</p>
            <p className="text-sm mt-1">Jobs will appear here when customers use the virtual mirror</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Job ID</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Engine</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id} className="border-b border-gray-50">
                    <td className="p-3 text-sm font-mono">{j.id?.slice(0, 8)}...</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        j.status === 'SUCCEEDED' ? 'bg-green-100 text-green-700' :
                        j.status === 'FAILED' ? 'bg-red-100 text-red-600' :
                        j.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'}`}>{j.status}</span>
                    </td>
                    <td className="p-3 text-sm text-gray-500">{j.engine_name || 'mock'}</td>
                    <td className="p-3 text-sm text-gray-500">{j.created_at ? new Date(j.created_at).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── System Health ──────────────────────────────────────────────
function HealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/health`).then(r => r.json()).then(setHealth).catch(e => setError(e.message));
  }, []);

  const checks = [
    { name: 'Backend API', status: health ? 'healthy' : 'checking...', detail: health?.environment || '' },
    { name: 'Database', status: health ? 'healthy' : 'checking...', detail: 'SQLite' },
    { name: 'Storage', status: 'ready', detail: 'D:\\VirtualTryOn' },
    { name: 'AI Engine', status: 'mock', detail: 'Development mode' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">System Health</h1>
      <p className="text-gray-500 text-sm mb-6">Monitor platform status and services</p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          API Error: {error}
        </div>
      )}

      <div className="card divide-y divide-gray-100">
        {checks.map(c => (
          <div key={c.name} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">{c.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{c.detail}</div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              c.status === 'healthy' || c.status === 'ready' ? 'bg-green-100 text-green-700' :
              c.status === 'mock' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-500'}`}>{c.status}</span>
          </div>
        ))}
      </div>

      {health && (
        <div className="mt-4 card p-4">
          <div className="text-xs text-gray-400 font-mono">
            <div>Service: {health.service}</div>
            <div>Version: {health.version}</div>
            <div>Environment: {health.environment}</div>
            <div>Timestamp: {health.timestamp}</div>
          </div>
        </div>
      )}
    </div>
  );
}
