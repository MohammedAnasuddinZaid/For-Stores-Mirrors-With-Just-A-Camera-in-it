export interface AppConfig {
  appName: string;
  environment: 'development' | 'production';
  apiUrl: string;
  appUrl: string;
  appMode: 'standard' | 'kiosk' | 'smart-mirror';
  maxUploadSizeMB: number;
  allowedImageTypes: string[];
  sessionExpiryMinutes: number;
}

const config: AppConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'VirtualTryOn',
  environment: (process.env.NEXT_PUBLIC_APP_ENV as AppConfig['environment']) || 'development',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  appMode: (process.env.NEXT_PUBLIC_APP_MODE as AppConfig['appMode']) || 'standard',
  maxUploadSizeMB: Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_SIZE_MB) || 10,
  allowedImageTypes: (process.env.NEXT_PUBLIC_ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(','),
  sessionExpiryMinutes: Number(process.env.NEXT_PUBLIC_SESSION_EXPIRY_MINUTES) || 30,
};

export function getConfig(): AppConfig {
  return config;
}
