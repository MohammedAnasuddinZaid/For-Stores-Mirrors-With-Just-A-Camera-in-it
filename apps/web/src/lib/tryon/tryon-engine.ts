import type { FaceLandmarks, CatalogProduct } from '@/types';
import { FaceLandmarkDetector } from '@/lib/vision/face-landmark-detector';
import { GlassesFittingEngine } from '@/lib/tryon/glasses-fitting-engine';

export type TryOnStatus =
  | 'idle'
  | 'loading_model'
  | 'detecting'
  | 'no_face'
  | 'ready'
  | 'rendering'
  | 'error';

export interface TryOnState {
  status: TryOnStatus;
  message: string;
  error?: string;
}

export class TryOnEngineManager {
  private faceDetector: FaceLandmarkDetector;
  private glassesEngine: GlassesFittingEngine;
  private cachedLandmarks: FaceLandmarks | null = null;
  private cachedPersonImage: HTMLImageElement | null = null;
  private productImages: Map<string, HTMLImageElement> = new Map();
  private stateListeners: Array<(state: TryOnState) => void> = [];

  constructor() {
    this.faceDetector = new FaceLandmarkDetector();
    this.glassesEngine = new GlassesFittingEngine();
  }

  private notifyState(state: TryOnState): void {
    this.stateListeners.forEach((fn) => fn(state));
  }

  onStateChange(listener: (state: TryOnState) => void): void {
    this.stateListeners.push(listener);
  }

  async initialize(): Promise<void> {
    this.notifyState({ status: 'loading_model', message: 'Loading face detection model...' });
    try {
      await this.faceDetector.initialize();
      this.notifyState({ status: 'ready', message: 'Ready to detect face' });
    } catch (err) {
      this.notifyState({
        status: 'error',
        message: 'Failed to load face detection',
        error: String(err),
      });
      throw err;
    }
  }

  async detectFace(imageSrc: string | HTMLImageElement): Promise<FaceLandmarks | null> {
    this.notifyState({ status: 'detecting', message: 'Detecting face...' });

    let img: HTMLImageElement;
    if (typeof imageSrc === 'string') {
      img = await this.loadImage(imageSrc);
    } else {
      img = imageSrc;
    }

    this.cachedPersonImage = img;

    try {
      const landmarks = await this.faceDetector.detect(img);

      if (!landmarks) {
        this.cachedLandmarks = null;
        this.notifyState({
          status: 'no_face',
          message: 'No face detected. Please ensure your face is visible.',
        });
        return null;
      }

      this.cachedLandmarks = landmarks;
      this.glassesEngine.resetTracking();
      this.notifyState({ status: 'ready', message: 'Face detected successfully' });
      return landmarks;
    } catch (err) {
      this.notifyState({
        status: 'error',
        message: 'Face detection failed',
        error: String(err),
      });
      return null;
    }
  }

  async loadProductImage(product: CatalogProduct): Promise<HTMLImageElement> {
    if (this.productImages.has(product.id)) {
      return this.productImages.get(product.id)!;
    }

    const img = await this.glassesEngine.loadProductImage(product.assetUrl);
    this.productImages.set(product.id, img);
    return img;
  }

  renderProduct(
    product: CatalogProduct,
    options?: { mirrorMode?: boolean; useSmoothing?: boolean }
  ): HTMLCanvasElement | null {
    if (!this.cachedLandmarks || !this.cachedPersonImage) return null;

    const productImg = this.productImages.get(product.id);
    if (!productImg) return null;

    const mirrorMode = options?.mirrorMode ?? false;
    const useSmoothing = options?.useSmoothing ?? false;

    this.notifyState({ status: 'rendering', message: 'Rendering...' });

    let result: HTMLCanvasElement | null;

    if (product.category === 'eyewear') {
      if (useSmoothing) {
        result = this.glassesEngine.renderWithSmoothing(
          this.cachedPersonImage,
          productImg,
          this.cachedLandmarks,
          product.fitProfile,
          { mirrorMode }
        );
      } else {
        result = this.glassesEngine.renderGlasses(
          this.cachedPersonImage,
          productImg,
          this.cachedLandmarks,
          product.fitProfile,
          { mirrorMode }
        );
      }
    } else {
      result = this.glassesEngine.renderGlasses(
        this.cachedPersonImage,
        productImg,
        this.cachedLandmarks,
        product.fitProfile,
        { mirrorMode }
      );
    }

    this.notifyState({ status: 'ready', message: 'Rendered successfully' });
    return result;
  }

  hasFaceLandmarks(): boolean {
    return this.cachedLandmarks !== null;
  }

  getCachedLandmarks(): FaceLandmarks | null {
    return this.cachedLandmarks;
  }

  getCachedPersonImage(): HTMLImageElement | null {
    return this.cachedPersonImage;
  }

  clearCache(): void {
    this.cachedLandmarks = null;
    this.cachedPersonImage = null;
    this.productImages.clear();
    this.glassesEngine.resetTracking();
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 50)}`));
      img.src = src;
    });
  }

  dispose(): void {
    this.faceDetector.dispose();
    this.cachedLandmarks = null;
    this.cachedPersonImage = null;
    this.productImages.clear();
    this.stateListeners = [];
  }
}
