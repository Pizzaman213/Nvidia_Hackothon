// ============================================================================
// VoiceChat - Main voice interaction component
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useVoice } from '../../contexts/VoiceContext';
import { useSession } from '../../contexts/SessionContext';
import { Message, ChatRequest } from '../../types';
import api from '../../services/api';
import { MessageDisplay } from './MessageDisplay';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface VoiceChatProps {
  activityType?: string;
  onCameraRequired?: () => void;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({
  activityType,
  onCameraRequired,
}) => {
  const { session } = useSession();
  const {
    isListening,
    isSpeaking,
    currentTranscript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    error: voiceError,
  } = useVoice();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSpoken, setHasSpoken] = useState(false);

  const handleSendMessage = useCallback(
    async (messageText: string) => {
      if (!session || !messageText.trim() || isProcessing) return;

      setIsProcessing(true);
      setError(null);

      // Add child's message to chat
      const childMessage: Message = {
        id: Date.now().toString(),
        content: messageText,
        sender: 'child',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, childMessage]);

      try {
        // Send to backend
        const request: ChatRequest = {
          message: messageText,
          session_id: session.session_id,
          child_age: session.child_age,
        };

        const response = await api.chat.sendMessage(request);

        // Add AI response to chat
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.response,
          sender: 'ai',
          timestamp: new Date(),
          requires_camera: response.requires_camera,
          audio_url: response.audio_url,
        };
        setMessages((prev) => [...prev, aiMessage]);

        // Speak the response
        speak(response.response);

        // Check if camera is needed
        if (response.requires_camera && onCameraRequired) {
          onCameraRequired();
        }

        // Check for safety flags
        if (response.safety_flag) {
          console.warn('Safety flag raised for message:', messageText);
        }
      } catch (err) {
        console.error('Failed to send message:', err);
        const errMsg = err instanceof Error ? err.message : 'Failed to send message';
        setError(errMsg);

        // Add error message
        const aiErrorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "I'm sorry, I couldn't understand that. Can you try again?",
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiErrorMessage]);
      } finally {
        setIsProcessing(false);
      }
    },
    [session, isProcessing, speak, onCameraRequired]
  );

  // When user stops speaking (transcript complete), send to AI
  useEffect(() => {
    if (currentTranscript && hasSpoken && !isListening && !isProcessing) {
      handleSendMessage(currentTranscript);
    }
  }, [currentTranscript, isListening, hasSpoken, isProcessing, handleSendMessage]);

  const handleStartListening = () => {
    setHasSpoken(false);
    startListening();
    setTimeout(() => setHasSpoken(true), 500); // Small delay to avoid immediate trigger
  };

  const handleStopListening = () => {
    stopListening();
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
  };

  return (
    <div className="flex flex-col h-full bg-child-bg">
      {/* Messages */}
      <MessageDisplay messages={messages} />

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="p-4 bg-white border-t-2 border-gray-200">
          <LoadingSpinner size="small" message="Thinking..." />
        </div>
      )}

      {/* Error Display */}
      {(error || voiceError) && (
        <div className="mx-4 mb-2 bg-red-100 border-2 border-red-400 rounded-lg p-3 text-center">
          <p className="text-red-700 font-child">{error || voiceError}</p>
        </div>
      )}

      {/* Current Transcript Display */}
      {isListening && currentTranscript && (
        <div className="mx-4 mb-2 bg-blue-100 border-2 border-blue-400 rounded-lg p-3">
          <p className="text-blue-700 font-child text-sm">
            You're saying: <span className="font-bold">{currentTranscript}</span>
          </p>
        </div>
      )}

      {/* Voice Controls */}
      <div className="p-6 bg-white border-t-2 border-gray-200">
        <div className="flex items-center justify-center gap-4">
          {/* Stop Speaking Button */}
          {isSpeaking && (
            <button
              onClick={handleStopSpeaking}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child"
            >
              🔇 Stop Talking
            </button>
          )}

          {/* Microphone Button */}
          {!isListening && !isSpeaking && !isProcessing && (
            <button
              onClick={handleStartListening}
              className="w-20 h-20 bg-child-primary hover:bg-pink-500 text-white rounded-full shadow-xl transform transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
              aria-label="Start talking"
            >
              <span className="text-4xl">🎤</span>
            </button>
          )}

          {/* Listening Indicator */}
          {isListening && (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleStopListening}
                className="w-20 h-20 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-xl animate-pulse flex items-center justify-center"
                aria-label="Stop talking"
              >
                <span className="text-4xl">🎤</span>
              </button>

              {/* Animated Waveform */}
              <div className="flex gap-1 h-8 items-end">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 bg-child-primary rounded-t animate-waveform"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>

              <p className="text-sm text-gray-600 font-child animate-pulse">
                Listening...
              </p>
            </div>
          )}
        </div>

        {/* Help Text */}
        {!isListening && !isSpeaking && !isProcessing && (
          <p className="text-center text-sm text-gray-500 mt-4 font-child">
            Press the microphone and start talking
          </p>
        )}
      </div>
    </div>
  );
};
