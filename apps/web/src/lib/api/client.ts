import { getConfig } from '../config/app-config';
import type { Product, TryOnSession, PersonImage, TryOnJob, TryOnResult } from '../../types';

class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getConfig().apiUrl;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new ApiError(
        response.status,
        error.code || 'UNKNOWN_ERROR',
        error.message || `HTTP ${response.status}`,
      );
    }

    return response.json();
  }

  // Health
  async health(): Promise<{ status: string; service: string; version: string }> {
    return this.request('/health');
  }

  // Products
  async getProducts(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Product[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return this.request(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id: string): Promise<Product> {
    return this.request(`/products/${id}`);
  }

  // Sessions
  async createSession(): Promise<TryOnSession> {
    return this.request('/sessions', { method: 'POST' });
  }

  async getSession(id: string): Promise<TryOnSession> {
    return this.request(`/sessions/${id}`);
  }

  // Person Images
  async uploadPersonImage(
    sessionId: string,
    imageBlob: Blob,
    metadata?: { width?: number; height?: number },
  ): Promise<PersonImage> {
    const formData = new FormData();
    formData.append('image', imageBlob, 'person-image.jpg');
    if (metadata?.width) formData.append('width', String(metadata.width));
    if (metadata?.height) formData.append('height', String(metadata.height));

    const url = `${this.baseUrl}/sessions/${sessionId}/person-images`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new ApiError(
        response.status,
        error.code || 'UPLOAD_FAILED',
        error.message || 'Upload failed',
      );
    }

    return response.json();
  }

  // Try-On
  async createTryOn(
    sessionId: string,
    productId: string,
    personImageId: string,
  ): Promise<TryOnJob> {
    return this.request(`/sessions/${sessionId}/try-ons`, {
      method: 'POST',
      body: JSON.stringify({ productId, personImageId }),
    });
  }

  async getTryOnJob(jobId: string): Promise<TryOnJob & { result?: TryOnResult }> {
    return this.request(`/try-ons/${jobId}`);
  }

  async getTryOnResult(jobId: string): Promise<TryOnResult> {
    return this.request(`/try-ons/${jobId}/result`);
  }
}

export const apiClient = new ApiClient();
export { ApiError };
