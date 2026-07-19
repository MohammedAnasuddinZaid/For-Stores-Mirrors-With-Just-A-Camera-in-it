import type { CatalogData, CatalogCategory, CatalogProduct, TryOnCategory, ProductCatalog } from '@/types';

class CatalogLoader implements ProductCatalog {
  private data: CatalogData | null = null;
  private loadPromise: Promise<CatalogData> | null = null;

  async load(): Promise<CatalogData> {
    if (this.data) return this.data;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = this._fetchCatalog();
    return this.loadPromise;
  }

  private async _fetchCatalog(): Promise<CatalogData> {
    const res = await fetch('/assets/products/catalog.json');
    if (!res.ok) {
      throw new Error(`Failed to load catalog: ${res.statusText}`);
    }
    this.data = (await res.json()) as CatalogData;
    return this.data;
  }

  getCategories(): CatalogCategory[] {
    return this.data?.categories ?? [];
  }

  getProductsByCategory(category: TryOnCategory): CatalogProduct[] {
    return this.data?.products.filter((p) => p.category === category) ?? [];
  }

  getProduct(id: string): CatalogProduct | undefined {
    return this.data?.products.find((p) => p.id === id);
  }

  getAllProducts(): CatalogProduct[] {
    return this.data?.products ?? [];
  }
}

let instance: CatalogLoader | null = null;

export function getCatalog(): CatalogLoader {
  if (!instance) {
    instance = new CatalogLoader();
  }
  return instance;
}
