// ============================================================================
// useVoiceRecognition Hook - Speech-to-Text
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger, LogCategory } from '../utils/logger';

interface UseVoiceRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
  error: string | null;
  resetTranscript: () => void;
}

// Global per-user cooldown tracking (persists across component re-renders)
const userStopTimestamps: { [sessionId: string]: number[] } = {};
const MAX_STOPS_PER_MINUTE = 3;
const COOLDOWN_PERIOD_MS = 60000; // 1 minute

export const useVoiceRecognition = (sessionId?: string): UseVoiceRecognitionReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    logger.debug(LogCategory.VOICE, 'Initializing voice recognition');

    // Check if browser supports Web Speech API
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const errorMsg = 'Speech recognition is not supported in this browser';
      logger.voice.error(errorMsg);
      setError(errorMsg);
      setIsSupported(false);
      return;
    }

    logger.info(LogCategory.VOICE, 'Speech recognition supported');
    setIsSupported(true);

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening until manually stopped
    recognition.interimResults = true; // Get real-time results
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      logger.voice.startListening();
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        if (result.isFinal) {
          finalText += transcriptText + ' ';
          logger.voice.transcript(transcriptText, true);
        } else {
          interimText += transcriptText;
          logger.voice.transcript(transcriptText, false);
        }
      }

      if (finalText) {
        setTranscript((prev) => prev + finalText);
      }

      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: any) => {
      let errorMessage = 'An error occurred';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found or permission denied';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied';
          break;
        case 'network':
          errorMessage = 'Network error occurred';
          break;
        default:
          errorMessage = `Error: ${event.error}`;
      }

      logger.voice.error(`Voice recognition error: ${event.error}`, new Error(errorMessage));
      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      logger.voice.stopListening();
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        logger.debug(LogCategory.VOICE, 'Cleaning up voice recognition');
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      const errorMsg = 'Speech recognition not initialized';
      logger.voice.error(errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      logger.info(LogCategory.VOICE, 'Attempting to start listening');
      setError(null);
      recognitionRef.current.start();
    } catch (err) {
      logger.voice.error('Error starting recognition', err as Error);
      setError('Failed to start listening');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    // Use session ID for per-user tracking, fallback to 'default' if no session
    const userId = sessionId || 'default';
    const now = Date.now();

    // Initialize timestamps array for this user if it doesn't exist
    if (!userStopTimestamps[userId]) {
      userStopTimestamps[userId] = [];
    }

    // Clean up old timestamps (older than 1 minute)
    userStopTimestamps[userId] = userStopTimestamps[userId].filter(
      (timestamp) => now - timestamp < COOLDOWN_PERIOD_MS
    );

    // Check if user has exceeded stop limit
    if (userStopTimestamps[userId].length >= MAX_STOPS_PER_MINUTE) {
      logger.warn(LogCategory.VOICE, `Stop button cooldown active for user ${userId}. Please wait before stopping again.`);
      setError('Please wait a moment before stopping again.');
      setTimeout(() => setError(null), 2000); // Clear error after 2 seconds
      return;
    }

    // Record this stop press for this user
    userStopTimestamps[userId].push(now);

    try {
      logger.info(LogCategory.VOICE, 'Stopping voice recognition');
      recognitionRef.current.stop();
    } catch (err) {
      logger.voice.error('Error stopping recognition', err as Error);
    }
  }, [sessionId]);

  const resetTranscript = useCallback(() => {
    logger.debug(LogCategory.VOICE, 'Resetting transcript');
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    isSupported,
    error,
    resetTranscript,
  };
};
