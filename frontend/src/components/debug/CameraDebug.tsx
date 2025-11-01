// ============================================================================
// Camera Debug Component - Diagnostic tool for camera issues
// ============================================================================

import React, { useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export const CameraDebug: React.FC = () => {
  const { parentTheme } = useTheme();
  const isLight = parentTheme === 'light';

  const [logs, setLogs] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const checkSupport = () => {
    addLog('=== Checking Browser Support ===');
    addLog(`Navigator exists: ${!!navigator}`);
    addLog(`MediaDevices exists: ${!!navigator.mediaDevices}`);
    addLog(`getUserMedia exists: ${!!navigator.mediaDevices?.getUserMedia}`);
    addLog(`User Agent: ${navigator.userAgent}`);
    addLog(`Platform: ${navigator.platform}`);
    addLog(`Is HTTPS: ${window.location.protocol === 'https:'}`);
    addLog(`Is localhost: ${window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'}`);
  };

  const checkPermissions = async () => {
    addLog('=== Checking Permissions ===');
    try {
      if ('permissions' in navigator) {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        addLog(`Camera permission state: ${result.state}`);
      } else {
        addLog('Permissions API not supported');
      }
    } catch (err) {
      addLog(`Error checking permissions: ${err}`);
    }
  };

  const listDevices = async () => {
    addLog('=== Listing Media Devices ===');
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      addLog(`Total devices: ${devices.length}`);
      addLog(`Video devices: ${videoDevices.length}`);
      videoDevices.forEach((device, i) => {
        addLog(`  ${i + 1}. ${device.label || 'Unnamed'} (${device.deviceId})`);
      });
    } catch (err) {
      addLog(`Error listing devices: ${err}`);
    }
  };

  const startCamera = async () => {
    addLog('=== Starting Camera ===');
    setError(null);

    try {
      addLog('Requesting camera access...');

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      addLog(`Constraints: ${JSON.stringify(constraints)}`);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      addLog('✓ Camera access granted!');
      addLog(`Stream ID: ${stream.id}`);
      addLog(`Video tracks: ${stream.getVideoTracks().length}`);

      stream.getVideoTracks().forEach((track, i) => {
        addLog(`  Track ${i + 1}: ${track.label}`);
        addLog(`    Enabled: ${track.enabled}`);
        addLog(`    Muted: ${track.muted}`);
        addLog(`    Ready state: ${track.readyState}`);
        const settings = track.getSettings();
        addLog(`    Resolution: ${settings.width}x${settings.height}`);
      });

      streamRef.current = stream;

      if (videoRef.current) {
        addLog('Attaching stream to video element...');
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          addLog('✓ Video metadata loaded');
          addLog(`  Video dimensions: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
        };

        videoRef.current.onplay = () => {
          addLog('✓ Video playback started');
        };

        videoRef.current.onerror = (e) => {
          addLog(`✗ Video error: ${e}`);
        };

        try {
          await videoRef.current.play();
          addLog('✓ Play() succeeded');
        } catch (playErr) {
          addLog(`⚠ Play() failed: ${playErr}`);
          addLog('  This may be normal - browser may block autoplay');
        }
      } else {
        addLog('⚠ Video ref is null');
      }

      setIsActive(true);
      addLog('=== Camera started successfully ===');
    } catch (err: any) {
      addLog(`✗ CAMERA ERROR: ${err.name}`);
      addLog(`  Message: ${err.message}`);
      addLog(`  Stack: ${err.stack}`);

      let errorMessage = 'Unknown error';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Permission denied - user blocked camera access';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device';
      } else if (err.name === 'NotReadableError') {
        errorMessage = 'Camera is in use by another application';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not supported';
      } else if (err.name === 'SecurityError') {
        errorMessage = 'Security error - HTTPS may be required';
      }

      setError(errorMessage);
      addLog(`  Friendly message: ${errorMessage}`);
    }
  };

  const stopCamera = () => {
    addLog('=== Stopping Camera ===');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        addLog(`  Stopped track: ${track.label}`);
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    addLog('=== Camera stopped ===');
  };

  const capturePhoto = () => {
    addLog('=== Capturing Photo ===');
    if (!videoRef.current || !isActive) {
      addLog('✗ Camera not active');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      addLog(`Canvas size: ${canvas.width}x${canvas.height}`);

      const context = canvas.getContext('2d');
      if (!context) {
        addLog('✗ Failed to get canvas context');
        return;
      }

      context.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const sizeKB = Math.round((imageData.length * 3) / 4 / 1024);
      addLog(`✓ Photo captured: ${sizeKB} KB`);
      addLog(`  Data URL length: ${imageData.length}`);
      addLog(`  First 50 chars: ${imageData.substring(0, 50)}...`);

      // Create preview
      const img = document.createElement('img');
      img.src = imageData;
      img.style.maxWidth = '200px';
      img.style.border = '2px solid green';
      img.alt = 'Captured photo';

      const previewDiv = document.getElementById('photo-preview');
      if (previewDiv) {
        previewDiv.innerHTML = '';
        previewDiv.appendChild(img);
        addLog('✓ Preview created');
      }

      stopCamera();
    } catch (err) {
      addLog(`✗ Capture error: ${err}`);
    }
  };

  return (
    <div className={`p-6 ${isLight ? 'bg-gray-100' : 'bg-dark'} min-h-screen`}>
      <div className="max-w-6xl mx-auto">
        <h1 className={`text-3xl font-bold mb-6 ${isLight ? 'text-gray-800' : 'text-white'}`}>
          Camera Diagnostic Tool
        </h1>

        {/* Controls */}
        <div className={`${isLight ? 'bg-white' : 'bg-dark-100 border border-white/10'} rounded-lg shadow p-6 mb-6`}>
          <h2 className={`text-xl font-bold mb-4 ${isLight ? 'text-gray-800' : 'text-white'}`}>Controls</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={checkSupport}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Check Support
            </button>
            <button
              onClick={checkPermissions}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
            >
              Check Permissions
            </button>
            <button
              onClick={listDevices}
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded"
            >
              List Devices
            </button>
            <button
              onClick={startCamera}
              disabled={isActive}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              Start Camera
            </button>
            <button
              onClick={stopCamera}
              disabled={!isActive}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              Stop Camera
            </button>
            <button
              onClick={capturePhoto}
              disabled={!isActive}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              Capture Photo
            </button>
            <button
              onClick={() => setLogs([])}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className={`${isLight ? 'bg-red-100 border-red-400 text-red-700' : 'bg-red-900/20 border-red-500/30 text-red-400'} border-2 rounded-lg p-4 mb-6`}>
            <h3 className="font-bold mb-2">Error</h3>
            <p className={isLight ? 'text-red-600' : 'text-red-300'}>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Preview */}
          <div className={`${isLight ? 'bg-white' : 'bg-dark-100 border border-white/10'} rounded-lg shadow p-6`}>
            <h2 className={`text-xl font-bold mb-4 ${isLight ? 'text-gray-800' : 'text-white'}`}>Video Preview</h2>
            <div className={`aspect-video ${isLight ? 'bg-gray-200' : 'bg-gray-800'} rounded overflow-hidden relative`}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isActive && (
                <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                  🔴 LIVE
                </div>
              )}
              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-4xl">
                  📷
                </div>
              )}
            </div>

            {/* Photo Preview */}
            <div className="mt-4">
              <h3 className={`font-bold mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>Captured Photo:</h3>
              <div id="photo-preview" className={`min-h-[100px] ${isLight ? 'bg-gray-100' : 'bg-gray-800'} rounded p-2 flex items-center justify-center`}>
                <span className="text-gray-400">No photo captured yet</span>
              </div>
            </div>
          </div>

          {/* Logs */}
          <div className={`${isLight ? 'bg-white' : 'bg-dark-100 border border-white/10'} rounded-lg shadow p-6`}>
            <h2 className={`text-xl font-bold mb-4 ${isLight ? 'text-gray-800' : 'text-white'}`}>Diagnostic Logs</h2>
            <div className={`${isLight ? 'bg-gray-900 text-green-400' : 'bg-black text-green-300'} p-4 rounded font-mono text-sm h-[600px] overflow-y-auto`}>
              {logs.length === 0 && (
                <div className="text-gray-500">No logs yet. Click buttons to run diagnostics.</div>
              )}
              {logs.map((log, i) => (
                <div key={i} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
