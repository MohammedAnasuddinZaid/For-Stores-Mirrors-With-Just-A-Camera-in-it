'use client';

import type { FaceLandmarks } from '@/types';

const FACE_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

enum State {
  UNINITIALIZED = 'UNINITIALIZED',
  LOADING = 'LOADING',
  READY = 'READY',
  ERROR = 'ERROR',
}

export class FaceLandmarkDetector {
  private state: State = State.UNINITIALIZED;
  private faceLandmarker: any = null;
  private initialized: Promise<void> | null = null;

  get isReady(): boolean {
    return this.state === State.READY;
  }

  get currentState(): string {
    return this.state;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return this.initialized;

    this.initialized = this._initialize();
    return this.initialized;
  }

  private async _initialize(): Promise<void> {
    this.state = State.LOADING;

    try {
      const { FaceLandmarker, FilesetResolver } = await import(
        '@mediapipe/tasks-vision'
      );

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
      );

      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: FACE_LANDMARKER_MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        outputFaceBlendshapes: false,
        minFaceDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
        numFaces: 1,
      });

      this.state = State.READY;
    } catch (err) {
      console.error('FaceLandmarkDetector init failed:', err);
      this.state = State.ERROR;
      throw err;
    }
  }

  async detect(image: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<FaceLandmarks | null> {
    if (this.state !== State.READY) {
      try {
        await this.initialize();
      } catch {
        return null;
      }
    }

    try {
      const result = this.faceLandmarker.detect(image);

      if (!result || !result.faceLandmarks || result.faceLandmarks.length === 0) {
        return null;
      }

      const landmarks = result.faceLandmarks[0];
      const w = image instanceof HTMLVideoElement ? image.videoWidth : image.width;
      const h = image instanceof HTMLVideoElement ? image.videoHeight : image.height;

      if (!w || !h) return null;

      const leftEyeIris = landmarks[468];
      const rightEyeIris = landmarks[473];
      const noseBridge = landmarks[6];
      const noseTip = landmarks[1];
      const leftEar = landmarks[234];
      const rightEar = landmarks[454];

      const leftEye = {
        x: leftEyeIris.x,
        y: leftEyeIris.y,
      };
      const rightEye = {
        x: rightEyeIris.x,
        y: rightEyeIris.y,
      };

      const dx = rightEye.x - leftEye.x;
      const dy = rightEye.y - leftEye.y;
      const ipd = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      const faceWidth = Math.abs(rightEar.x - leftEar.x);
      const faceHeight = Math.abs(
        Math.max(...landmarks.map((l: any) => l.y)) -
          Math.min(...landmarks.map((l: any) => l.y))
      );

      return {
        leftEye,
        rightEye,
        eyeMidpoint: {
          x: (leftEye.x + rightEye.x) / 2,
          y: (leftEye.y + rightEye.y) / 2,
        },
        interpupillaryDistance: ipd,
        eyeLineAngle: angle,
        noseBridge: { x: noseBridge.x, y: noseBridge.y },
        noseTip: { x: noseTip.x, y: noseTip.y },
        faceWidth,
        faceHeight,
        confidence: result.faceLandmarks.length > 0 ? 1.0 : 0.0,
        imageWidth: w,
        imageHeight: h,
      };
    } catch (err) {
      console.error('Face detection error:', err);
      return null;
    }
  }

  dispose(): void {
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
    }
    this.state = State.UNINITIALIZED;
    this.initialized = null;
  }
}
