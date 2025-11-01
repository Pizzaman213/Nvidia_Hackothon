// ============================================================================
// CameraCapture - On-demand photo capture component
// CRITICAL: Camera ONLY activates when user explicitly clicks button
// ============================================================================

import React, { useState } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { ImageAnalysisContext } from '../../types';

interface CameraCaptureProps {
  onPhotoCapture: (imageData: string) => void;
  context?: ImageAnalysisContext;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onPhotoCapture,
  context = 'homework',
}) => {
  const {
    isActive,
    hasPermission,
    error,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
    isSupported,
  } = useCamera();

  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleStartCamera = async () => {
    setCapturedImage(null);
    await startCamera();
  };

  const handleCapturePhoto = async () => {
    const imageData = await capturePhoto();

    if (imageData && imageData.trim() !== '') {
      setCapturedImage(imageData);
    } else {
      console.error('Camera returned empty or null image data');
    }
  };

  const handleSendPhoto = () => {
    if (capturedImage && capturedImage.trim() !== '') {
      onPhotoCapture(capturedImage);
      setCapturedImage(null);
    } else {
      console.error('Attempted to send empty or null image');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  if (!isSupported) {
    return (
      <div className="bg-red-100 border-2 border-red-400 rounded-xl p-4 text-center">
        <p className="text-red-700 font-child">
          Camera is not supported on this device
        </p>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-4 text-center">
        <p className="text-yellow-700 font-child mb-2">
          Camera permission was denied
        </p>
        <p className="text-sm text-yellow-600">
          Please allow camera access in your browser settings
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-white rounded-xl shadow-lg">
      {/* Camera Preview or Captured Image */}
      <div className="relative w-full max-w-md aspect-video bg-gray-200 rounded-lg overflow-hidden">
        {/* Video element - Always rendered but hidden when not active */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover bg-black"
          style={{
            transform: 'scaleX(1)', // Mirror for front camera (optional)
            display: isActive && !capturedImage ? 'block' : 'none',
            width: '100%',
            height: '100%'
          }}
          onLoadedMetadata={(e) => {
            console.log('Video metadata loaded:', {
              width: (e.target as HTMLVideoElement).videoWidth,
              height: (e.target as HTMLVideoElement).videoHeight
            });
          }}
          onCanPlay={() => {
            console.log('Video can play');
          }}
          onError={(e) => {
            console.error('Video element error:', e);
          }}
        />

        {/* Camera On indicator */}
        {isActive && !capturedImage && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse z-10">
            🔴 Camera On
          </div>
        )}

        {/* Captured image */}
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover absolute inset-0"
          />
        )}

        {/* Placeholder when not active */}
        {!isActive && !capturedImage && (
          <div className="w-full h-full flex items-center justify-center text-gray-400 absolute inset-0">
            <div className="text-center">
              <div className="text-6xl mb-2">📸</div>
              <p className="font-child">Click below to take a picture</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="w-full bg-red-100 border-2 border-red-400 rounded-lg p-4 text-center">
          <p className="text-red-700 font-child font-bold mb-2">{error}</p>
          <div className="text-sm text-red-600 space-y-1 mb-3">
            <p>💡 Try these solutions:</p>
            <ul className="text-left list-disc list-inside">
              <li>Allow camera access when prompted</li>
              <li>Close other apps using the camera (Zoom, FaceTime, etc.)</li>
              <li>Make sure you're using <strong>localhost</strong> in the URL</li>
              <li>Try a different browser (Chrome/Edge recommended)</li>
            </ul>
            {window.location.hostname !== 'localhost' && (
              <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mt-2">
                <p className="font-bold text-yellow-800">⚠️ Not using localhost!</p>
                <p className="text-xs">Current: {window.location.hostname}</p>
                <p className="text-xs">Use: http://localhost:3000</p>
              </div>
            )}
          </div>
          <button
            onClick={handleStartCamera}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-all"
          >
            🔄 Try Again
          </button>
        </div>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="w-full bg-blue-50 border border-blue-300 rounded-lg p-3 text-xs text-blue-700 space-y-1">
          <p className="font-bold mb-2">🔍 Debug Info:</p>
          <p>Browser: {navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'}</p>
          <p>Camera Supported: {isSupported ? '✓ Yes' : '✗ No'}</p>
          <p>Camera Status: {isActive ? '✓ Active' : '✗ Inactive'}</p>
          <p>Permission: {hasPermission === null ? '❓ Not requested' : hasPermission ? '✓ Granted' : '✗ Denied'}</p>
          <p>Video Element: {videoRef.current ? '✓ Ready' : '✗ Not Ready'}</p>
          <p>Stream: {videoRef.current?.srcObject ? '✓ Connected' : '✗ No Stream'}</p>
          <p>Protocol: {window.location.protocol}</p>
          <p className={window.location.hostname === 'localhost' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            Hostname: {window.location.hostname} {window.location.hostname === 'localhost' ? '✓' : '✗ (use localhost!)'}
          </p>
          {videoRef.current && isActive && (
            <>
              <p>Video Size: {videoRef.current.videoWidth}x{videoRef.current.videoHeight}</p>
              <p>Ready State: {videoRef.current.readyState}</p>
            </>
          )}
          {error && <p className="text-red-600 font-bold">Full Error: {error}</p>}
          <p className="text-xs text-gray-600 mt-2">💡 Click "Take Picture" button to start camera</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 w-full max-w-md">
        {!isActive && !capturedImage && (
          <button
            onClick={handleStartCamera}
            className="flex-1 bg-child-primary hover:bg-pink-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child text-lg"
          >
            📸 Take Picture
          </button>
        )}

        {isActive && !capturedImage && (
          <>
            <button
              onClick={handleCapturePhoto}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child text-lg"
            >
              ✓ Capture
            </button>
            <button
              onClick={stopCamera}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child text-lg"
            >
              ✕ Cancel
            </button>
          </>
        )}

        {capturedImage && (
          <>
            <button
              onClick={handleSendPhoto}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child text-lg"
            >
              ✓ Send Photo
            </button>
            <button
              onClick={handleRetake}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child text-lg"
            >
              🔄 Retake
            </button>
          </>
        )}
      </div>

      {/* Context Info */}
      <p className="text-sm text-gray-500 text-center">
        Photo will be sent to AI for: {context}
      </p>
    </div>
  );
};
