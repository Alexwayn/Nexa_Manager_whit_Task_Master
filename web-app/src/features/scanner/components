// Camera capture component for document scanning
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  CameraIcon, 
  CheckIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import type { CameraCaptureProps } from './types';

interface CameraState {
  isInitialized: boolean;
  isStreaming: boolean;
  hasPermission: boolean;
  permissionDenied: boolean;
  error: string | null;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onError,
  isActive
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [cameraState, setCameraState] = useState<CameraState>({
    isInitialized: false,
    isStreaming: false,
    hasPermission: false,
    permissionDenied: false,
    error: null
  });
  
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Check if camera is supported
  const isCameraSupported = useCallback(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);

  // Request camera permission and start stream
  const startCamera = useCallback(async () => {
    if (!isCameraSupported()) {
      const error = 'Camera is not supported on this device';
      setCameraState(prev => ({ ...prev, error }));
      onError(error);
      return;
    }

    try {
      setCameraState(prev => ({ ...prev, error: null }));
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        setCameraState(prev => ({
          ...prev,
          isInitialized: true,
          isStreaming: true,
          hasPermission: true,
          permissionDenied: false
        }));
      }
    } catch (error) {
      console.error('Camera access error:', error);
      
      let errorMessage = 'Failed to access camera';
      let permissionDenied = false;
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and try again.';
          permissionDenied = true;
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application';
        } else if (error.name === 'OverconstrainedError') {
          errorMessage = 'Camera does not support the required settings';
        }
      }
      
      setCameraState(prev => ({
        ...prev,
        error: errorMessage,
        permissionDenied,
        hasPermission: false
      }));
      
      onError(errorMessage);
    }
  }, [isCameraSupported, onError]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraState(prev => ({
      ...prev,
      isStreaming: false,
      isInitialized: false
    }));
  }, []);

  // Capture image from video stream
  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !cameraState.isStreaming) {
      return;
    }

    setIsCapturing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to capture image'));
          }
        }, 'image/jpeg', 0.9);
      });
      
      // Create preview URL
      const imageUrl = URL.createObjectURL(blob);
      setCapturedImage(imageUrl);
      
      // Stop camera stream
      stopCamera();
      
    } catch (error) {
      console.error('Image capture error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture image';
      onError(errorMessage);
    } finally {
      setIsCapturing(false);
    }
  }, [cameraState.isStreaming, stopCamera, onError]);

  // Confirm captured image
  const confirmCapture = useCallback(async () => {
    if (!capturedImage || !canvasRef.current) {
      return;
    }

    try {
      // Convert canvas to blob and call onCapture
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current!.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to process captured image'));
          }
        }, 'image/jpeg', 0.9);
      });
      
      onCapture(blob);
      
      // Clean up
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
      
    } catch (error) {
      console.error('Capture confirmation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process captured image';
      onError(errorMessage);
    }
  }, [capturedImage, onCapture, onError]);

  // Retake image
  const retakeImage = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
    startCamera();
  }, [capturedImage, startCamera]);

  // Initialize camera when component becomes active
  useEffect(() => {
    if (isActive && !cameraState.isInitialized && !cameraState.permissionDenied) {
      startCamera();
    } else if (!isActive && cameraState.isStreaming) {
      stopCamera();
    }
    
    // Cleanup on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage);
      }
    };
  }, [isActive, cameraState.isInitialized, cameraState.permissionDenied, cameraState.isStreaming, startCamera, stopCamera, capturedImage]);

  // Render camera not supported
  if (!isCameraSupported()) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Not Supported</h3>
        <p className="text-gray-500 mb-4">
          Your device or browser doesn't support camera access. Please use the upload option instead.
        </p>
      </div>
    );
  }

  // Render permission denied state
  if (cameraState.permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShieldExclamationIcon className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Permission Required</h3>
        <p className="text-gray-500 mb-4">
          Please allow camera access to scan documents. Check your browser settings and try again.
        </p>
        <button
          onClick={startCamera}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <CameraIcon className="h-4 w-4 mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  // Render error state
  if (cameraState.error && !cameraState.permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Error</h3>
        <p className="text-gray-500 mb-4">{cameraState.error}</p>
        <button
          onClick={startCamera}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  // Render captured image preview
  if (capturedImage) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Review Captured Image</h3>
          <p className="text-gray-500">Review the captured document and confirm or retake</p>
        </div>
        
        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={capturedImage}
            alt="Captured document"
            className="w-full h-auto max-h-96 object-contain"
          />
          
          {/* Document edge detection guides overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-blue-500"></div>
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-blue-500"></div>
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-blue-500"></div>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={retakeImage}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Retake
          </button>
          
          <button
            onClick={confirmCapture}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            Confirm
          </button>
        </div>
      </div>
    );
  }

  // Render camera viewfinder
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Position Document</h3>
        <p className="text-gray-500">
          Position the document within the frame and tap capture when ready
        </p>
      </div>
      
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Document edge detection guides overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner guides */}
          <div className="absolute top-8 left-8 w-12 h-12 border-l-4 border-t-4 border-white opacity-80"></div>
          <div className="absolute top-8 right-8 w-12 h-12 border-r-4 border-t-4 border-white opacity-80"></div>
          <div className="absolute bottom-8 left-8 w-12 h-12 border-l-4 border-b-4 border-white opacity-80"></div>
          <div className="absolute bottom-8 right-8 w-12 h-12 border-r-4 border-b-4 border-white opacity-80"></div>
          
          {/* Center guide */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-40 border-2 border-dashed border-white opacity-60 rounded-lg"></div>
          </div>
          
          {/* Instructions overlay */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              Align document within the guides
            </div>
          </div>
        </div>
        
        {/* Loading overlay */}
        {!cameraState.isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm">Initializing camera...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Capture button */}
      <div className="flex justify-center">
        <button
          onClick={captureImage}
          disabled={!cameraState.isStreaming || isCapturing}
          className="inline-flex items-center justify-center w-16 h-16 border-4 border-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          {isCapturing ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          ) : (
            <CameraIcon className="h-8 w-8 text-white" />
          )}
        </button>
      </div>
      
      {/* Hidden canvas for image capture */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  );
};

export default CameraCapture;