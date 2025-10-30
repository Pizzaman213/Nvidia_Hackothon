// ============================================================================
// useCamera Hook - On-Demand Camera Capture
// IMPORTANT: Camera ONLY activates when explicitly requested
// ============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraReturn {
  isActive: boolean;
  hasPermission: boolean | null;
  error: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => Promise<string | null>;
  isSupported: boolean;
}

export const useCamera = (): UseCameraReturn => {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Start camera - ONLY called when user explicitly clicks "Take Picture"
   */
  const startCamera = useCallback(async () => {
    if (!isSupported) {
      setError('Camera is not supported in this browser');
      return;
    }

    try {
      setError(null);

      // Request camera permission and start stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile if available
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false, // We don't need audio for photos
      });

      streamRef.current = stream;

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsActive(true);
      setHasPermission(true);
      console.log('Camera started successfully');
    } catch (err) {
      console.error('Camera error:', err);

      let errorMessage = 'Failed to access camera';

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = 'Camera permission denied. Please allow camera access.';
          setHasPermission(false);
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = 'No camera found on this device';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = 'Camera is already in use by another application';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera does not support the requested settings';
        } else if (err.name === 'SecurityError') {
          errorMessage = 'Camera access blocked for security reasons';
        }
      }

      setError(errorMessage);
      setIsActive(false);
    }
  }, [isSupported]);

  /**
   * Stop camera and release resources
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      // Stop all tracks (this turns off the camera light)
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log('Camera track stopped:', track.label);
      });

      streamRef.current = null;

      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsActive(false);
      console.log('Camera stopped');
    }
  }, []);

  /**
   * Capture a photo from the current video stream
   * Returns base64-encoded image data
   */
  const capturePhoto = useCallback(async (): Promise<string | null> => {
    if (!videoRef.current || !isActive) {
      setError('Camera is not active');
      return null;
    }

    try {
      const video = videoRef.current;

      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64 JPEG (reduce size for transmission)
      const imageData = canvas.toDataURL('image/jpeg', 0.8);

      console.log('Photo captured successfully');

      // IMPORTANT: Stop camera immediately after capture
      stopCamera();

      return imageData;
    } catch (err) {
      console.error('Error capturing photo:', err);
      setError('Failed to capture photo');
      return null;
    }
  }, [isActive, stopCamera]);

  // Cleanup on unmount - stop camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    isActive,
    hasPermission,
    error,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
    isSupported,
  };
};
