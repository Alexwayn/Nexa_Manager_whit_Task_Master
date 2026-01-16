// Camera capture component for document scanning
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  CameraIcon, 
  CheckIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';

interface CameraCaptureProps {
  onCapture: (image: Blob) => void;
  onError: (error: string) => void;
  isProcessing?: boolean;
}

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
  isProcessing = false
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

  // Initialize camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setCameraState(prev => ({ 
      ...prev, 
      error: null, 
      permissionDenied: false,
      isInitialized: false 
    }));

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const error = 'Camera not supported on this device';
      setCameraState(prev => ({ ...prev, error }));
      onError(error);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = () => {
          setCameraState(prev => ({
            ...prev,
            isInitialized: true,
            isStreaming: true,
            hasPermission: true,
            error: null
          }));
        };
      }
    } catch (error) {
      console.error('Camera access error:', error);
      
      let errorMessage = 'Failed to access camera';
      let permissionDenied = false;
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = 'Camera access denied. Please enable camera permissions.';
          permissionDenied = true;
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage = 'No camera found on this device';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
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
  }, [onError]);

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
      onError('Camera not ready for capture');
      return;
    }

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
      
      // Draw current video frame to canvas
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
      
    } catch (error) {
      console.error('Image capture error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture image';
      onError(errorMessage);
    }
  }, [cameraState.isStreaming, onError]);

  // Confirm captured image
  const confirmCapture = useCallback(async () => {
    if (!capturedImage) return;

    try {
      // Convert data URL back to blob for processing
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
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

  // Render permission denied state
  if (cameraState.permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <ShieldExclamationIcon className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Permission Required</h3>
        <p className="text-gray-500 mb-4">
          Please enable camera access in your browser settings to capture documents.
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

  // Render camera not supported state
  if (cameraState.error && !cameraState.permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Camera Not Supported</h3>
        <p className="text-gray-500 mb-4">
          Your device or browser doesn't support camera access. Please use the upload option instead.
        </p>
      </div>
    );
  }

  // Render camera error state
  if (cameraState.error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mb-4" />
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
          <p className="text-gray-500">
            Review the captured image and confirm or retake if needed
          </p>
        </div>
        
        <div className="relative bg-black rounded-lg overflow-hidden">
          <img
            src={capturedImage}
            alt="Captured document"
            className="w-full h-auto"
          />
          
          {/* Corner guides overlay */}
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
            disabled={isProcessing}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Use This Image'}
          </button>
        </div>
      </div>
    );
  }

  // Render camera interface
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Capture Document</h3>
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
        
        {/* Corner guides overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-blue-500"></div>
          <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-blue-500"></div>
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-blue-500"></div>
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-blue-500"></div>
          
          {/* Center instruction */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
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
          disabled={!cameraState.isStreaming || isProcessing}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CameraIcon className="h-5 w-5 mr-2" />
          {isProcessing ? 'Processing...' : 'Capture'}
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
