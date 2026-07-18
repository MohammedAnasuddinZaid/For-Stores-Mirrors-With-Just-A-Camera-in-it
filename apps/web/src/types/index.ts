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
  | 'ARCHIVED'
  | 'FAILED';

export type TryOnJobStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'TIMED_OUT'
  | 'CANCELLED';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  sku: string | null;
  price: number;
  currency: string;
  status: string;
  image_url: string;
  thumbnail_url: string;
  try_on_enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
  published_at: string | null;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface TryOnSession {
  id: string;
  token: string;
  created_at: string;
  expires_at: string;
}

export interface PersonImage {
  id: string;
  session_id: string;
  storage_key: string;
  width: number;
  height: number;
  created_at: string;
}

export interface TryOnJob {
  id: string;
  session_id: string;
  product_id: string;
  person_image_id: string;
  status: TryOnJobStatus;
  engine_name: string;
  error_code?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface TryOnResult {
  id: string;
  job_id: string;
  storage_key: string;
  width: number;
  height: number;
  created_at: string;
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

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  code?: string;
}

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
  | 'VISION_ERROR'
  | 'FALLBACK';

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

export const CATEGORY_LABELS: Record<string, string> = {
  UPPER_BODY: 'Upper Body',
  LOWER_BODY: 'Lower Body',
  FULL_BODY: 'Full Body',
  DRESS: 'Dresses',
  GLASSES: 'Glasses',
  HAT: 'Hats',
  JEWELRY: 'Jewelry',
  SHOES: 'Shoes',
  OTHER: 'Other',
};
