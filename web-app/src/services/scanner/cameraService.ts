// Camera service implementation
import type { CameraService as ICameraService } from '@/types/scanner';

export class CameraService implements ICameraService {
  private stream: MediaStream | null = null;

  async initialize(): Promise<boolean> {
    try {
      const hasCamera = await this.hasCamera();
      if (!hasCamera) {
        return false;
      }

      const permission = await this.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Camera initialization failed:', error);
      return false;
    }
  }

  async startCamera(): Promise<MediaStream> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera for document scanning
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      return this.stream;
    } catch (error) {
      console.error('Failed to start camera:', error);
      throw new Error('Unable to access camera. Please check permissions.');
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  async captureImage(): Promise<Blob> {
    if (!this.stream) {
      throw new Error('Camera not started');
    }

    // Create a video element to capture the frame
    const video = document.createElement('video');
    video.srcObject = this.stream;
    video.play();

    return new Promise((resolve, reject) => {
      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          reject(new Error('Unable to create canvas context'));
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to capture image'));
          }
        }, 'image/jpeg', 0.9);
      });
    });
  }

  hasCamera(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  async requestPermission(): Promise<PermissionState> {
    try {
      if (!navigator.permissions) {
        // Fallback: try to access camera directly
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return 'granted';
      }

      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return permission.state;
    } catch (error) {
      console.error('Permission check failed:', error);
      return 'denied';
    }
  }
}