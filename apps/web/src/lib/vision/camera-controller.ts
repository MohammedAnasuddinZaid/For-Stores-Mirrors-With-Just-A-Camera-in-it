import type { CameraState } from '../../types';

export interface CameraCapabilities {
  deviceId: string;
  label: string;
  facingMode: 'user' | 'environment' | 'left' | 'right' | 'unknown';
  width: number;
  height: number;
}

export class CameraController {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private state: CameraState = 'INITIALIZING';
  private onStateChange: ((state: CameraState) => void) | null = null;
  private devices: CameraCapabilities[] = [];
  private currentDeviceId: string | null = null;

  setStateChangeCallback(callback: (state: CameraState) => void) {
    this.onStateChange = callback;
  }

  private setState(state: CameraState) {
    this.state = state;
    this.onStateChange?.(state);
  }

  getState(): CameraState {
    return this.state;
  }

  async requestPermission(): Promise<boolean> {
    try {
      this.setState('REQUESTING_PERMISSION');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      this.setState('PERMISSION_DENIED');
      return false;
    }
  }

  async enumerateCameras(): Promise<CameraCapabilities[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    this.devices = videoDevices.map(d => ({
      deviceId: d.deviceId,
      label: d.label || `Camera ${videoDevices.indexOf(d) + 1}`,
      facingMode: 'unknown',
      width: 640,
      height: 480,
    }));
    return this.devices;
  }

  getCameras(): CameraCapabilities[] {
    return this.devices;
  }

  async start(
    videoElement: HTMLVideoElement,
    deviceId?: string,
  ): Promise<void> {
    try {
      this.videoElement = videoElement;
      this.currentDeviceId = deviceId || null;

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      if (deviceId) {
        (constraints.video as MediaTrackConstraints).deviceId = { exact: deviceId };
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = this.stream;

      await videoElement.play();
      this.setState('CAMERA_READY');
    } catch (err) {
      if ((err as DOMException).name === 'NotAllowedError') {
        this.setState('PERMISSION_DENIED');
      } else if ((err as DOMException).name === 'NotFoundError') {
        this.setState('CAMERA_UNAVAILABLE');
      } else {
        this.setState('CAMERA_ERROR');
      }
    }
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.setState('STOPPED');
  }

  captureFrame(): Blob | null {
    if (!this.videoElement) return null;

    const video = this.videoElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);

    // Convert to blob
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeString = 'image/jpeg';
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  captureAsDataUrl(): string | null {
    if (!this.videoElement) return null;

    const video = this.videoElement;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.92);
  }

  async switchCamera(): Promise<void> {
    if (this.devices.length < 2) return;

    const currentIndex = this.devices.findIndex(d => d.deviceId === this.currentDeviceId);
    const nextIndex = (currentIndex + 1) % this.devices.length;
    const nextDevice = this.devices[nextIndex];

    this.stop();
    if (this.videoElement) {
      await this.start(this.videoElement, nextDevice.deviceId);
    }
  }

  destroy(): void {
    this.stop();
    this.videoElement = null;
    this.onStateChange = null;
    this.devices = [];
  }
}
