// ============================================================================
// CameraCapture - On-demand photo capture component
// CRITICAL: Camera ONLY activates when user explicitly clicks button
// ============================================================================

import React, { useState } from 'react';
import { useCamera } from '../../hooks/useCamera';

interface CameraCaptureProps {
  onPhotoCapture: (imageData: string) => void;
  context?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onPhotoCapture,
  context = 'general',
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

    if (imageData) {
      setCapturedImage(imageData);
    }
  };

  const handleSendPhoto = () => {
    if (capturedImage) {
      onPhotoCapture(capturedImage);
      setCapturedImage(null);
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
        {capturedImage ? (
          // Show captured image
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        ) : isActive ? (
          // Show live video preview
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
              🔴 Camera On
            </div>
          </>
        ) : (
          // Show placeholder
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-2">📸</div>
              <p className="font-child">Click below to take a picture</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="w-full bg-red-100 border-2 border-red-400 rounded-lg p-3 text-center">
          <p className="text-red-700 font-child">{error}</p>
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
