import type { VisionAnalysis, VisionState } from '../../types';

// Simple client-side vision engine that uses basic image analysis
// For production, replace with MediaPipe Tasks (face/pose landmarker)

export interface VisionEngineConfig {
  minBrightness: number;
  maxBrightness: number;
  minBlurThreshold: number;
  minFaceConfidence: number;
}

export class VisionEngine {
  private state: VisionState = 'INITIALIZING';
  private config: VisionEngineConfig = {
    minBrightness: 40,
    maxBrightness: 240,
    minBlurThreshold: 100,
    minFaceConfidence: 0.5,
  };
  private onStateChange: ((state: VisionState) => void) | null = null;

  setStateChangeCallback(callback: (state: VisionState) => void) {
    this.onStateChange = callback;
  }

  private setState(state: VisionState) {
    this.state = state;
    this.onStateChange?.(state);
  }

  getState(): VisionState {
    return this.state;
  }

  async initialize(): Promise<void> {
    this.setState('LOADING_MODEL');
    // Simulate model loading
    await new Promise(resolve => setTimeout(resolve, 500));
    this.setState('READY');
  }

  async analyzeFrame(imageData: ImageData | HTMLVideoElement | HTMLCanvasElement): Promise<VisionAnalysis> {
    let data: ImageData;

    if (imageData instanceof HTMLVideoElement) {
      const canvas = document.createElement('canvas');
      canvas.width = imageData.videoWidth;
      canvas.height = imageData.videoHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(imageData, 0, 0);
      data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else if (imageData instanceof HTMLCanvasElement) {
      const ctx = imageData.getContext('2d')!;
      data = ctx.getImageData(0, 0, imageData.width, imageData.height);
    } else {
      data = imageData;
    }

    const analysis = this.analyzeImageData(data);
    if (analysis.recommendation === 'READY') {
      this.setState('READY');
    } else if (analysis.person.detected) {
      this.setState('PERSON_DETECTED');
    } else {
      this.setState('NO_PERSON');
    }

    return analysis;
  }

  private analyzeImageData(data: ImageData): VisionAnalysis {
    const pixels = data.data;
    const totalPixels = data.width * data.height;
    let totalBrightness = 0;
    let gradientSum = 0;

    // Simple brightness and blur analysis
    for (let y = 1; y < data.height - 1; y++) {
      for (let x = 1; x < data.width - 1; x++) {
        const idx = (y * data.width + x) * 4;
        const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
        totalBrightness += brightness;

        // Simple edge detection for blur
        const leftIdx = (y * data.width + (x - 1)) * 4;
        const rightIdx = (y * data.width + (x + 1)) * 4;
        const topIdx = ((y - 1) * data.width + x) * 4;
        const bottomIdx = ((y + 1) * data.width + x) * 4;

        const hGrad = Math.abs(
          (pixels[leftIdx] + pixels[leftIdx + 1] + pixels[leftIdx + 2]) / 3 -
          (pixels[rightIdx] + pixels[rightIdx + 1] + pixels[rightIdx + 2]) / 3,
        );
        const vGrad = Math.abs(
          (pixels[topIdx] + pixels[topIdx + 1] + pixels[topIdx + 2]) / 3 -
          (pixels[bottomIdx] + pixels[bottomIdx + 1] + pixels[bottomIdx + 2]) / 3,
        );
        gradientSum += hGrad + vGrad;
      }
    }

    const avgBrightness = totalBrightness / totalPixels;
    const avgGradient = gradientSum / totalPixels;
    const blurLevel = avgGradient < this.config.minBlurThreshold ? 'high' as const : 
                      avgGradient < this.config.minBlurThreshold * 1.5 ? 'medium' as const : 'low' as const;
    const brightness: VisionAnalysis['quality']['brightness'] = 
      avgBrightness < this.config.minBrightness ? 'too_dark' as const :
      avgBrightness > this.config.maxBrightness ? 'too_bright' as const : 
      'acceptable' as const;

    // Simple person detection based on image variance
    const personDetected = avgGradient > 20;
    const confidence = personDetected ? Math.min(1, avgGradient / 200) : 0;

    const result: VisionAnalysis = {
      person: {
        detected: personDetected,
        confidence,
        count: personDetected ? 1 : 0,
      },
      pose: {
        bodyVisible: personDetected,
        facingCamera: confidence > 0.4,
        torsoVisible: personDetected,
      },
      framing: {
        tooFar: false,
        tooClose: false,
        leftOffset: false,
        rightOffset: false,
        topCutoff: false,
        bottomCutoff: false,
      },
      quality: {
        brightness,
        blur: blurLevel,
      },
      recommendation: 'NOT_READY',
    };

    // Determine readiness
    if (personDetected && brightness === 'acceptable' && blurLevel !== 'high') {
      result.recommendation = 'READY';
      result.message = 'Position looks good!';
    } else if (personDetected) {
      result.recommendation = 'READY_WITH_WARNINGS';
      if (brightness === 'too_dark') result.message = 'Try moving to a brighter area';
      else if (brightness === 'too_bright') result.message = 'Try moving out of direct light';
      else if (blurLevel === 'high') result.message = 'Hold still to reduce blur';
      else result.message = 'Almost ready...';
    } else {
      result.recommendation = 'NOT_READY';
      result.message = 'Step into the camera frame';
    }

    return result;
  }

  dispose(): void {
    this.setState('INITIALIZING');
    this.onStateChange = null;
  }
}
