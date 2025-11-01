/**
 * Emergency Call Modal
 *
 * Provides multiple ways to contact emergency contact:
 * 1. Direct device call (instant)
 * 2. Voice chat through app (with visual controls)
 */

import React, { useState, useEffect, useRef } from 'react';
import { emergencyCallService, CallStatus } from '../../services/emergencyCallService';
import { logger, LogCategory } from '../../utils/logger';

interface EmergencyCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  emergencyContact: string;
  childName: string;
  sessionId: string;
  reason?: string;
}

const EmergencyCallModal: React.FC<EmergencyCallModalProps> = ({
  isOpen,
  onClose,
  emergencyContact,
  childName,
  sessionId,
  reason = 'Emergency button pressed',
}) => {
  const [callStatus, setCallStatus] = useState<CallStatus>({
    isActive: false,
    isConnecting: false,
    duration: 0,
    error: null,
  });
  const [isMuted, setIsMuted] = useState(false);
  const [callMethod, setCallMethod] = useState<'none' | 'direct' | 'voice'>('none');

  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // Clean up when modal closes
      if (callMethod === 'voice') {
        emergencyCallService.endVoiceChat();
      }
      setCallMethod('none');
      setCallStatus({
        isActive: false,
        isConnecting: false,
        duration: 0,
        error: null,
      });
    }
  }, [isOpen, callMethod]);

  useEffect(() => {
    // Set up callbacks
    emergencyCallService.onStatusChange(setCallStatus);
    emergencyCallService.onRemoteStream((stream) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(err =>
          logger.error(LogCategory.VOICE, 'Failed to play remote audio', err)
        );
      }
    });
  }, []);

  const handleDirectCall = () => {
    logger.info(LogCategory.UI, 'Initiating direct device call');
    setCallMethod('direct');
    emergencyCallService.makeDirectCall(emergencyContact, childName);

    // Show confirmation message
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleVoiceChat = async () => {
    logger.info(LogCategory.UI, 'Initiating voice chat');
    setCallMethod('voice');

    try {
      await emergencyCallService.startVoiceChat({
        emergencyContact,
        childName,
        sessionId,
        reason,
      });
    } catch (error) {
      logger.error(LogCategory.UI, 'Failed to start voice chat', error as Error);
    }
  };

  const handleEndCall = () => {
    emergencyCallService.endVoiceChat();
    setCallMethod('none');
    onClose();
  };

  const handleToggleMute = () => {
    const muted = emergencyCallService.toggleMute();
    setIsMuted(muted);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 text-white p-6 text-center">
          <div className="text-6xl mb-3">🚨</div>
          <h2 className="text-2xl font-bold mb-2">Emergency Contact</h2>
          <p className="text-red-100 text-sm">Call {emergencyContact}</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Call method selection (shown when no call active) */}
          {callMethod === 'none' && !callStatus.isConnecting && (
            <div className="space-y-4">
              <p className="text-gray-700 text-center mb-6">
                Choose how to contact your emergency contact:
              </p>

              {/* Direct Call Button */}
              <button
                onClick={handleDirectCall}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
              >
                <span className="text-3xl">📞</span>
                <div className="text-left">
                  <div className="text-xl">Call on Device</div>
                  <div className="text-sm text-red-100">Opens phone dialer (fastest)</div>
                </div>
              </button>

              {/* Voice Chat Button */}
              <button
                onClick={handleVoiceChat}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-3"
              >
                <span className="text-3xl">💬</span>
                <div className="text-left">
                  <div className="text-xl">Voice Chat</div>
                  <div className="text-sm text-blue-100">Talk through this app</div>
                </div>
              </button>

              <button
                onClick={onClose}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Connecting state */}
          {callStatus.isConnecting && callMethod === 'voice' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-xl font-semibold text-gray-700 mb-2">Connecting...</p>
              <p className="text-gray-600">Calling {emergencyContact}</p>
              <button
                onClick={handleEndCall}
                className="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Active call (voice chat) */}
          {callStatus.isActive && callMethod === 'voice' && (
            <div className="text-center">
              {/* Animated call indicator */}
              <div className="relative mb-6">
                <div className="w-32 h-32 bg-green-100 rounded-full mx-auto flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-25"></div>
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-pulse opacity-50"></div>
                  <span className="text-6xl z-10">🎙️</span>
                </div>
              </div>

              <p className="text-2xl font-bold text-gray-800 mb-2">Call in Progress</p>
              <p className="text-gray-600 mb-1">{emergencyContact}</p>
              <p className="text-3xl font-mono text-green-600 mb-8">
                {formatDuration(callStatus.duration)}
              </p>

              {/* Call controls */}
              <div className="flex gap-4 justify-center mb-6">
                {/* Mute button */}
                <button
                  onClick={handleToggleMute}
                  className={`w-16 h-16 rounded-full transition-all transform hover:scale-110 shadow-lg flex items-center justify-center ${
                    isMuted
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  <span className="text-2xl">{isMuted ? '🔇' : '🎤'}</span>
                </button>

                {/* End call button */}
                <button
                  onClick={handleEndCall}
                  className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all transform hover:scale-110 shadow-lg flex items-center justify-center"
                  title="End call"
                >
                  <span className="text-2xl">📞</span>
                </button>
              </div>

              <p className="text-sm text-gray-500">
                {isMuted ? '🔇 Microphone muted' : '🎤 Microphone active'}
              </p>
            </div>
          )}

          {/* Direct call confirmation */}
          {callMethod === 'direct' && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-xl font-semibold text-gray-700 mb-2">Opening phone dialer...</p>
              <p className="text-gray-600">Calling {emergencyContact}</p>
            </div>
          )}

          {/* Error state */}
          {callStatus.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 font-semibold mb-1">Call Failed</p>
              <p className="text-red-600 text-sm">{callStatus.error}</p>
              <button
                onClick={() => {
                  setCallMethod('none');
                  setCallStatus({ ...callStatus, error: null });
                }}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Hidden audio element for remote stream */}
          <audio ref={remoteAudioRef} autoPlay playsInline hidden />
        </div>
      </div>
    </div>
  );
};

export default EmergencyCallModal;
