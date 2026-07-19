'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CatalogCategory, CatalogProduct, TryOnCategory } from '@/types';
import { getCatalog } from '@/lib/tryon/product-catalog';

interface ProductSelectorProps {
  selectedCategory: TryOnCategory;
  selectedProductId: string | null;
  disabledCategories: TryOnCategory[];
  onCategoryChange: (category: TryOnCategory) => void;
  onProductSelect: (product: CatalogProduct) => void;
}

export function ProductSelector({
  selectedCategory,
  selectedProductId,
  disabledCategories,
  onCategoryChange,
  onProductSelect,
}: ProductSelectorProps) {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const catalog = getCatalog();
        await catalog.load();
        setCategories(catalog.getCategories());
        setProducts(catalog.getProductsByCategory(selectedCategory));
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const catalog = getCatalog();
        setProducts(catalog.getProductsByCategory(selectedCategory));
      } catch {
        // ignore
      }
    })();
  }, [selectedCategory]);

  const isDisabled = useCallback(
    (cat: TryOnCategory) => disabledCategories.includes(cat),
    [disabledCategories]
  );

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-text-tertiary">
        Loading products...
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => {
          const disabled = isDisabled(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => !disabled && onCategoryChange(cat.id)}
              disabled={disabled}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                ${
                  selectedCategory === cat.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : disabled
                      ? 'bg-gray-100 text-text-tertiary cursor-not-allowed opacity-50'
                      : 'bg-white text-text-secondary hover:bg-brand-50 hover:text-brand-700 border border-gray-200'
                }
              `}
              title={disabled ? 'Full-body photo required' : cat.description}
            >
              {cat.name}
              {disabled && (
                <span className="ml-1.5 text-xs opacity-60">(N/A)</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => onProductSelect(product)}
            className={`
              relative rounded-xl overflow-hidden border-2 transition-all text-left
              ${
                selectedProductId === product.id
                  ? 'border-brand-600 ring-2 ring-brand-200 shadow-md'
                  : 'border-gray-200 hover:border-brand-300 hover:shadow-sm'
              }
            `}
          >
            <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
              <img
                src={product.thumbnailUrl}
                alt={product.name}
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12">No Image</text></svg>';
                }}
              />
            </div>
            <div className="p-2">
              <p className="text-xs font-medium text-text-primary truncate">
                {product.name}
              </p>
              <p className="text-xs text-text-tertiary truncate">
                {product.brand}
              </p>
            </div>
          </button>
        ))}
      </div>

      {products.length === 0 && !loading && (
        <div className="py-8 text-center text-sm text-text-tertiary">
          No products available in this category
        </div>
      )}
    </div>
  );
}
