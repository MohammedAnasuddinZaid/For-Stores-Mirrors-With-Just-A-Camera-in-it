'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { CameraController } from '../../lib/vision/camera-controller';
import { VisionEngine } from '../../lib/vision/vision-engine';
import type { CameraState, VisionAnalysis, VisionState } from '../../types';

interface CameraViewProps {
  onCapture: (dataUrl: string) => void;
  onVisionUpdate?: (analysis: VisionAnalysis) => void;
  autoStart?: boolean;
  mirrored?: boolean;
}

export function CameraView({ onCapture, onVisionUpdate, autoStart = true, mirrored = true }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<CameraController>(new CameraController());
  const visionRef = useRef<VisionEngine>(new VisionEngine());
  const animFrameRef = useRef<number>(0);
  const lastAnalysisRef = useRef<number>(0);

  const [cameraState, setCameraState] = useState<CameraState>('INITIALIZING');
  const [visionState, setVisionState] = useState<VisionState>('INITIALIZING');
  const [visionAnalysis, setVisionAnalysis] = useState<VisionAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isCaptured, setIsCaptured] = useState(false);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    const camera = cameraRef.current;
    camera.setStateChangeCallback(setCameraState);
    await camera.start(video);
  }, []);

  useEffect(() => {
    const camera = cameraRef.current;
    const vision = visionRef.current;

    camera.setStateChangeCallback(setCameraState);
    vision.setStateChangeCallback(setVisionState);

    if (autoStart) {
      startCamera();
    }

    // Start vision analysis loop
    const video = videoRef.current;
    if (video) {
      const analyzeLoop = () => {
        if (video.readyState >= 2 && camera.getState() === 'CAMERA_READY') {
          const now = Date.now();
          // Analyze at ~10 FPS
          if (now - lastAnalysisRef.current > 100) {
            lastAnalysisRef.current = now;
            vision.analyzeFrame(video).then(analysis => {
              setVisionAnalysis(analysis);
              onVisionUpdate?.(analysis);
            });
          }
        }
        animFrameRef.current = requestAnimationFrame(analyzeLoop);
      };
      animFrameRef.current = requestAnimationFrame(analyzeLoop);
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      camera.destroy();
      vision.dispose();
    };
  }, [autoStart, startCamera, onVisionUpdate]);

  const handleCapture = useCallback(() => {
    const camera = cameraRef.current;
    const dataUrl = camera.captureAsDataUrl();
    if (dataUrl) {
      setCapturedDataUrl(dataUrl);
      setIsCaptured(true);
    }
  }, []);

  const handleConfirmCapture = useCallback(() => {
    if (capturedDataUrl) {
      onCapture(capturedDataUrl);
    }
  }, [capturedDataUrl, onCapture]);

  const handleRetake = useCallback(() => {
    setIsCaptured(false);
    setCapturedDataUrl(null);
  }, []);

  const videoClasses = mirrored ? 'scale-x-[-1]' : '';

  if (cameraState === 'PERMISSION_DENIED') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-100 rounded-xl p-8">
        <div className="text-4xl mb-4">📷</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Camera Access Required</h3>
        <p className="text-gray-600 text-center mb-4">
          Please allow camera access in your browser settings to use virtual try-on.
        </p>
        <button
          onClick={() => { setCameraState('INITIALIZING'); startCamera(); }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (cameraState === 'CAMERA_UNAVAILABLE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-100 rounded-xl p-8">
        <div className="text-4xl mb-4">📷</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Camera Found</h3>
        <p className="text-gray-600 text-center">
          We couldn't detect a camera on this device. Please connect a camera and try again.
        </p>
      </div>
    );
  }

  if (isCaptured && capturedDataUrl) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative rounded-xl overflow-hidden bg-gray-900 max-w-[640px] w-full">
          <img
            src={capturedDataUrl}
            alt="Captured"
            className={`w-full ${videoClasses}`}
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleRetake}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Retake
          </button>
          <button
            onClick={handleConfirmCapture}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Use This Photo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative rounded-xl overflow-hidden bg-gray-900 max-w-[640px] w-full mx-auto">
        <video
          ref={videoRef}
          className={`w-full ${videoClasses}`}
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Guidance overlay */}
        {visionAnalysis && cameraState === 'CAMERA_READY' && (
          <div className="absolute bottom-4 left-4 right-4">
            <div
              className={`px-4 py-2 rounded-lg text-center text-sm font-medium backdrop-blur-sm ${
                visionAnalysis.recommendation === 'READY'
                  ? 'bg-green-500/80 text-white'
                  : visionAnalysis.recommendation === 'READY_WITH_WARNINGS'
                    ? 'bg-yellow-500/80 text-white'
                    : 'bg-gray-900/80 text-gray-200'
              }`}
            >
              {visionAnalysis.message}
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {cameraState === 'INITIALIZING' || cameraState === 'REQUESTING_PERMISSION' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
            <div className="text-white text-center">
              <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm">Starting camera...</p>
            </div>
          </div>
        ) : null}

        {/* Camera error */}
        {cameraState === 'CAMERA_ERROR' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
            <div className="text-white text-center">
              <p className="text-lg mb-2">Camera error</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Capture button */}
      {cameraState === 'CAMERA_READY' && (
        <div className="flex justify-center mt-4">
          <button
            onClick={handleCapture}
            className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 hover:border-blue-500 transition-colors shadow-lg flex items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors" />
          </button>
        </div>
      )}
    </div>
  );
}
