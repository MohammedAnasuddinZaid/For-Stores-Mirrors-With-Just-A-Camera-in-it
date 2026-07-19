import type { FaceLandmarks, ProductFitProfile } from '@/types';

interface RenderOptions {
  mirrorMode?: boolean;
}

class ExponentialSmoother {
  private alpha: number;
  private valueX: number | null = null;
  private valueY: number | null = null;
  private valueAngle: number | null = null;
  private valueScale: number | null = null;

  constructor(alpha = 0.35) {
    this.alpha = alpha;
  }

  smoothX(raw: number): number {
    if (this.valueX === null) { this.valueX = raw; return raw; }
    this.valueX = this.alpha * raw + (1 - this.alpha) * this.valueX;
    return this.valueX;
  }

  smoothY(raw: number): number {
    if (this.valueY === null) { this.valueY = raw; return raw; }
    this.valueY = this.alpha * raw + (1 - this.alpha) * this.valueY;
    return this.valueY;
  }

  smoothAngle(raw: number): number {
    if (this.valueAngle === null) { this.valueAngle = raw; return raw; }
    const diff = raw - this.valueAngle;
    const wrappedDiff = Math.atan2(Math.sin(diff), Math.cos(diff));
    this.valueAngle += this.alpha * wrappedDiff;
    return this.valueAngle;
  }

  smoothScale(raw: number): number {
    if (this.valueScale === null) { this.valueScale = raw; return raw; }
    this.valueScale = this.alpha * raw + (1 - this.alpha) * this.valueScale;
    return this.valueScale;
  }

  reset(): void {
    this.valueX = null;
    this.valueY = null;
    this.valueAngle = null;
    this.valueScale = null;
  }
}

export class GlassesFittingEngine {
  private smoother: ExponentialSmoother;
  private lastLandmarks: FaceLandmarks | null = null;
  private frozenFrameCount = 0;
  private readonly MAX_FROZEN_FRAMES = 10;

  constructor() {
    this.smoother = new ExponentialSmoother(0.35);
  }

  resetTracking(): void {
    this.smoother.reset();
    this.lastLandmarks = null;
    this.frozenFrameCount = 0;
  }

  async loadProductImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load: ${url}`));
      img.src = url;
    });
  }

  private getSourceCrop(
    image: HTMLImageElement,
    fitProfile: ProductFitProfile
  ): { x: number; y: number; w: number; h: number } {
    const bounds = fitProfile.imageContentBounds;
    if (!bounds) {
      return { x: 0, y: 0, w: image.width, h: image.height };
    }
    return {
      x: Math.round(bounds.left * image.width),
      y: Math.round(bounds.top * image.height),
      w: Math.round((bounds.right - bounds.left) * image.width),
      h: Math.round((bounds.bottom - bounds.top) * image.height),
    };
  }

  renderGlasses(
    personImage: HTMLImageElement,
    glassesImage: HTMLImageElement,
    landmarks: FaceLandmarks,
    fitProfile: ProductFitProfile,
    options: RenderOptions = {}
  ): HTMLCanvasElement | null {
    const canvas = document.createElement('canvas');
    canvas.width = landmarks.imageWidth;
    canvas.height = landmarks.imageHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(personImage, 0, 0);

    const crop = this.getSourceCrop(glassesImage, fitProfile);

    let eyeMidX = landmarks.eyeMidpoint.x * landmarks.imageWidth;
    let eyeMidY = landmarks.eyeMidpoint.y * landmarks.imageHeight;

    const ipdPixels = landmarks.interpupillaryDistance * landmarks.imageWidth;
    const faceWidthPixels = landmarks.faceWidth * landmarks.imageWidth;

    eyeMidY += fitProfile.verticalOffset * faceWidthPixels;

    const destWidth = ipdPixels * fitProfile.widthMultiplier;
    const destHeight = (crop.h / crop.w) * destWidth;

    let angle = landmarks.eyeLineAngle + fitProfile.rotationOffset;

    if (options.mirrorMode) {
      eyeMidX = landmarks.imageWidth - eyeMidX;
      angle = -angle;
    }

    ctx.save();
    ctx.translate(eyeMidX, eyeMidY);
    ctx.rotate(angle);
    ctx.drawImage(
      glassesImage,
      crop.x, crop.y, crop.w, crop.h,
      -destWidth / 2, -destHeight / 2,
      destWidth, destHeight
    );
    ctx.restore();

    return canvas;
  }

  renderWithSmoothing(
    personImage: HTMLImageElement,
    glassesImage: HTMLImageElement,
    landmarks: FaceLandmarks,
    fitProfile: ProductFitProfile,
    options: RenderOptions = {}
  ): HTMLCanvasElement | null {
    const smoothed: FaceLandmarks = {
      ...landmarks,
      leftEye: {
        x: this.smoother.smoothX(landmarks.leftEye.x),
        y: this.smoother.smoothY(landmarks.leftEye.y),
      },
      rightEye: {
        x: this.smoother.smoothX(landmarks.rightEye.x),
        y: this.smoother.smoothY(landmarks.rightEye.y),
      },
      eyeMidpoint: {
        x: this.smoother.smoothX(landmarks.eyeMidpoint.x),
        y: this.smoother.smoothY(landmarks.eyeMidpoint.y),
      },
      interpupillaryDistance: this.smoother.smoothScale(landmarks.interpupillaryDistance),
      eyeLineAngle: this.smoother.smoothAngle(landmarks.eyeLineAngle),
    };

    this.lastLandmarks = landmarks;
    this.frozenFrameCount = 0;

    return this.renderGlasses(personImage, glassesImage, smoothed, fitProfile, options);
  }

  renderFrozen(
    personImage: HTMLImageElement,
    glassesImage: HTMLImageElement,
    fitProfile: ProductFitProfile,
    options: RenderOptions = {}
  ): HTMLCanvasElement | null {
    if (!this.lastLandmarks) return null;
    this.frozenFrameCount++;
    if (this.frozenFrameCount > this.MAX_FROZEN_FRAMES) return null;
    return this.renderGlasses(personImage, glassesImage, this.lastLandmarks, fitProfile, options);
  }
}
