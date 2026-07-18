'use client';

import Link from 'next/link';
import { TryOnBadge } from './badge';

interface ProductCardProps {
  id: number | string;
  name: string;
  imageUrl: string;
  category: string;
  brand: string;
  price: number;
  tryOnEnabled: boolean;
  status: string;
}

function resolveImageUrl(id: number | string, url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `/api/products/${id}/image`;
}

export function ProductCard({ id, name, imageUrl, category, brand, price, tryOnEnabled, status }: ProductCardProps) {
  const src = resolveImageUrl(id, imageUrl);
  return (
    <Link href={`/products/${id}`} className="group block">
      <div className="bg-surface rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all duration-200">
        <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute top-2 left-2 flex gap-1.5">
            {status !== 'PUBLISHED' && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-900/60 text-white rounded-full backdrop-blur-sm">
                {status}
              </span>
            )}
            {tryOnEnabled && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-brand-600/90 text-white rounded-full backdrop-blur-sm">
                TRY ON
              </span>
            )}
          </div>
          {price > 0 && (
            <div className="absolute bottom-2 right-2 px-2.5 py-1 text-xs font-semibold bg-white/90 backdrop-blur-sm rounded-lg shadow-xs">
              ${price.toFixed(2)}
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-[11px] text-text-tertiary uppercase tracking-wider mb-0.5">{category} · {brand}</p>
          <h3 className="text-sm font-semibold text-text-primary truncate">{name}</h3>
        </div>
      </div>
    </Link>
  );
}
