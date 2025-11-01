// ============================================================================
// useCamera Hook - On-Demand Camera Capture
// IMPORTANT: Camera ONLY activates when explicitly requested
// ============================================================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { logger, LogCategory } from '../utils/logger';

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
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    logger.debug(LogCategory.CAMERA, `Camera API supported: ${supported}`);
    return supported;
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Start camera - ONLY called when user explicitly clicks "Take Picture"
   */
  const startCamera = useCallback(async () => {
    logger.camera.start();

    if (!isSupported) {
      const errorMsg = 'Camera is not supported in this browser';
      logger.camera.error(errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      setError(null);

      // DIAGNOSTIC: Check available devices first
      console.log('==== CAMERA DIAGNOSTIC START ====');
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === 'videoinput');
        console.log('Total devices:', devices.length);
        console.log('Camera devices:', cameras.length);
        console.log('Camera details:', cameras);

        if (cameras.length === 0) {
          console.error('❌ NO CAMERAS DETECTED - macOS may be blocking camera access');
          console.error('Fix: System Settings → Privacy & Security → Camera → Enable Chrome');
        }
      } catch (enumError) {
        console.error('Error enumerating devices:', enumError);
      }
      console.log('================================');

      logger.info(LogCategory.CAMERA, 'Requesting camera permission and stream');

      // Request camera permission and start stream
      // On macOS, be more flexible with camera constraints
      let stream: MediaStream;
      try {
        // First try: Simple request with minimal constraints
        console.log('Attempt 1: Trying simple video request...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        console.log('✓ Simple video request succeeded');
      } catch (simpleError) {
        console.log('Simple request failed, trying with ideal constraints...');
        try {
          // Second try: With ideal constraints (not required)
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
          console.log('✓ Ideal constraints succeeded');
        } catch (idealError) {
          console.log('Ideal constraints failed, trying with environment facing mode...');
          // Third try: With facing mode for mobile
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
            },
            audio: false,
          });
          console.log('✓ Environment facing mode succeeded');
        }
      }

      streamRef.current = stream;

      // Attach stream to video element
      if (!videoRef.current) {
        logger.error(LogCategory.CAMERA, 'Video ref is null, cannot attach stream');
        // Stop the stream we just got
        stream.getTracks().forEach(track => track.stop());
        throw new Error('Video element not available. Please try refreshing the page.');
      }

      logger.debug(LogCategory.CAMERA, 'Attaching stream to video element');

      // Set the stream
      videoRef.current.srcObject = stream;

      // Ensure video element properties are set
      videoRef.current.muted = true;  // Required for autoplay in most browsers
      videoRef.current.playsInline = true;  // Required for mobile

      // Wait for video metadata to load before considering it active
      await new Promise<void>((resolve, reject) => {
        if (!videoRef.current) {
          logger.warn(LogCategory.CAMERA, 'Video ref became null during setup');
          resolve();
          return;
        }

        const video = videoRef.current;
        const timeout = setTimeout(() => {
          logger.warn(LogCategory.CAMERA, 'Video metadata load timeout - continuing anyway');
          resolve(); // Resolve anyway, might still work
        }, 5000);

        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          logger.debug(LogCategory.CAMERA, 'Video metadata loaded', {
            width: video.videoWidth,
            height: video.videoHeight,
            readyState: video.readyState,
          });
          resolve();
        };

        video.onerror = (err) => {
          clearTimeout(timeout);
          logger.error(LogCategory.CAMERA, 'Video element error', err as any);
          reject(new Error('Video element failed to load'));
        };
      });

      // Start video playback
      if (videoRef.current) {
        try {
          logger.debug(LogCategory.CAMERA, 'Attempting to play video');
          await videoRef.current.play();
          logger.info(LogCategory.CAMERA, 'Video playback started successfully');
        } catch (playError) {
          logger.warn(LogCategory.CAMERA, 'Video autoplay may have been blocked', playError);
          // Continue anyway - some browsers block autoplay but video still works
          // User interaction (clicking capture) will trigger play
        }
      }

      setIsActive(true);
      setHasPermission(true);
      logger.info(LogCategory.CAMERA, 'Camera started successfully', {
        videoWidth: videoRef.current?.videoWidth,
        videoHeight: videoRef.current?.videoHeight,
      });
    } catch (err) {
      let errorMessage = 'Failed to access camera';
      let detailedError = '';

      if (err instanceof Error) {
        detailedError = `${err.name}: ${err.message}`;

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = 'Camera permission denied. Please click "Allow" when prompted.';
          setHasPermission(false);
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = 'No camera found on this device. Make sure you have a camera connected.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = 'Camera is already in use. Close other apps (Zoom, FaceTime, etc.) and try again.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera does not support the requested settings. Try a different camera.';
        } else if (err.name === 'SecurityError') {
          errorMessage = 'Camera access blocked. Check browser settings and make sure you are using localhost.';
        } else {
          // Unknown error - include details
          errorMessage = `Camera error: ${err.message || 'Unknown error'}`;
        }
      } else {
        detailedError = String(err);
      }

      logger.camera.error(`${errorMessage} | ${detailedError}`, err as Error);

      // DIAGNOSTIC: Log to console for debugging
      console.error('==== CAMERA ERROR DIAGNOSTIC ====');
      console.error('Error Name:', err instanceof Error ? err.name : 'Unknown');
      console.error('Error Message:', err instanceof Error ? err.message : String(err));
      console.error('Full Error Object:', err);
      console.error('User-Facing Message:', errorMessage);
      console.error('================================');

      setError(errorMessage);
      setIsActive(false);
    }
  }, [isSupported]);

  /**
   * Stop camera and release resources
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      logger.info(LogCategory.CAMERA, 'Stopping camera and releasing resources');

      // Stop all tracks (this turns off the camera light)
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        logger.debug(LogCategory.CAMERA, `Camera track stopped: ${track.label}`);
      });

      streamRef.current = null;

      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsActive(false);
      logger.camera.stop();
    }
  }, []);

  /**
   * Capture a photo from the current video stream
   * Returns base64-encoded image data
   */
  const capturePhoto = useCallback(async (): Promise<string | null> => {
    logger.info(LogCategory.CAMERA, 'Attempting to capture photo');

    if (!videoRef.current || !isActive) {
      const errorMsg = 'Camera is not active';
      logger.camera.error(errorMsg);
      setError(errorMsg);
      return null;
    }

    try {
      const video = videoRef.current;

      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      logger.debug(LogCategory.CAMERA, `Canvas size: ${canvas.width}x${canvas.height}`);

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64 JPEG (reduce size for transmission)
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const imageSizeKB = Math.round((imageData.length * 3) / 4 / 1024);

      logger.camera.capture(imageSizeKB * 1024);

      // IMPORTANT: Stop camera immediately after capture
      stopCamera();

      return imageData;
    } catch (err) {
      logger.camera.error('Error capturing photo', err as Error);
      setError('Failed to capture photo');
      return null;
    }
  }, [isActive, stopCamera]);

  // Cleanup on unmount - stop camera when component unmounts
  useEffect(() => {
    return () => {
      logger.debug(LogCategory.CAMERA, 'Camera hook unmounting, cleaning up');
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
