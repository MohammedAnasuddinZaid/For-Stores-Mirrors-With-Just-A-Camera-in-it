export type ProductCategory =
  | 'UPPER_BODY'
  | 'LOWER_BODY'
  | 'FULL_BODY'
  | 'DRESS'
  | 'GLASSES'
  | 'HAT'
  | 'JEWELRY'
  | 'SHOES'
  | 'OTHER';

export type ProductStatus =
  | 'DRAFT'
  | 'PROCESSING'
  | 'READY'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type TryOnJobStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'TIMED_OUT'
  | 'CANCELLED';

export type CameraState =
  | 'INITIALIZING'
  | 'REQUESTING_PERMISSION'
  | 'PERMISSION_DENIED'
  | 'CAMERA_UNAVAILABLE'
  | 'CAMERA_ERROR'
  | 'CAMERA_READY'
  | 'CAPTURED'
  | 'STOPPED';

export type VisionState =
  | 'INITIALIZING'
  | 'LOADING_MODEL'
  | 'READY'
  | 'NO_PERSON'
  | 'PERSON_DETECTED'
  | 'ANALYZING'
  | 'NOT_READY'
  | 'READY'
  | 'VISION_ERROR'
  | 'FALLBACK';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  brand: string;
  price: number;
  status: ProductStatus;
  thumbnailUrl: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface TryOnSession {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface PersonImage {
  id: string;
  sessionId: string;
  storageKey: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface TryOnJob {
  id: string;
  sessionId: string;
  productId: string;
  personImageId: string;
  status: TryOnJobStatus;
  engineName: string;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TryOnResult {
  id: string;
  jobId: string;
  storageKey: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface VisionAnalysis {
  person: {
    detected: boolean;
    confidence: number;
    count: number;
  };
  pose: {
    bodyVisible: boolean;
    facingCamera: boolean;
    torsoVisible: boolean;
  };
  framing: {
    tooFar: boolean;
    tooClose: boolean;
    leftOffset: boolean;
    rightOffset: boolean;
    topCutoff: boolean;
    bottomCutoff: boolean;
  };
  quality: {
    brightness: 'too_dark' | 'acceptable' | 'too_bright';
    blur: 'low' | 'medium' | 'high';
  };
  recommendation: 'NOT_READY' | 'READY_WITH_WARNINGS' | 'READY';
  message?: string;
}

export interface ARGlassesModel {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  model3dUrl?: string;
}

export interface ARTryOnState {
  isActive: boolean;
  faceDetected: boolean;
  glassesModel: ARGlassesModel | null;
  screenshots: string[];
}
