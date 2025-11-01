// ============================================================================
// useVoiceSynthesis Hook - Text-to-Speech
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseVoiceSynthesisReturn {
  speak: (text: string, rate?: number, pitch?: number, volume?: number) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setVoice: (voice: SpeechSynthesisVoice) => void;
  error: string | null;
}

// Global per-user cooldown tracking (persists across component re-renders)
const userStopTimestamps: { [sessionId: string]: number[] } = {};
const MAX_STOPS_PER_MINUTE = 3;
const COOLDOWN_PERIOD_MS = 60000; // 1 minute

/**
 * Remove emojis, asterisks, and other non-speech elements from text before TTS
 */
const cleanTextForSpeech = (text: string): string => {
  // Remove emojis (comprehensive pattern covering all emoji Unicode ranges)
  // Using character class ranges compatible with ES5
  let cleaned = text
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // Surrogate pairs (emojis)
    .replace(/[\u2600-\u27BF]/g, '') // Miscellaneous symbols
    .replace(/[\u2700-\u27BF]/g, '') // Dingbats
    .replace(/[\u2300-\u23FF]/g, '') // Miscellaneous technical
    .replace(/[\u2B50-\u2B55]/g, '') // Stars and other symbols
    .replace(/[\u2190-\u21FF]/g, '') // Arrows
    .replace(/[\u2600-\u26FF]/g, '') // Miscellaneous symbols
    .replace(/[\u2700-\u27BF]/g, ''); // Dingbats

  // Remove asterisks (used for markdown emphasis/bold)
  cleaned = cleaned.replace(/\*/g, '');

  // Remove multiple spaces created by emoji/asterisk removal
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Remove standalone punctuation that may be left over
  cleaned = cleaned.replace(/\s+([.!?,;:])\s+/g, '$1 ');

  // Strip leading/trailing whitespace
  cleaned = cleaned.trim();

  return cleaned;
};

export const useVoiceSynthesis = (sessionId?: string): UseVoiceSynthesisReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if browser supports Speech Synthesis
    if (!window.speechSynthesis) {
      setError('Text-to-speech is not supported in this browser');
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    // Load available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Try to select a friendly voice (prefer female voices for children)
      const preferredVoice =
        availableVoices.find((v) => v.name.includes('Female')) ||
        availableVoices.find((v) => v.lang.startsWith('en')) ||
        availableVoices[0];

      setSelectedVoice(preferredVoice || null);
    };

    // Voices might load asynchronously
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback(
    (text: string, rate: number = 1.0, pitch: number = 1.0, volume: number = 1.0) => {
      if (!window.speechSynthesis) {
        setError('Speech synthesis not available');
        return;
      }

      // Clean text: remove emojis and other non-speech elements
      const cleanedText = cleanTextForSpeech(text);

      // If after cleaning there's no text left, don't speak
      if (!cleanedText || !cleanedText.trim()) {
        console.warn('No readable text found after cleaning emojis');
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanedText);

      // Set voice properties
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = rate; // 0.1 to 10 (1 is normal)
      utterance.pitch = pitch; // 0 to 2 (1 is normal)
      utterance.volume = volume; // 0 to 1 (1 is max)

      // Event listeners
      utterance.onstart = () => {
        console.log('Speech started');
        setIsSpeaking(true);
        setIsPaused(false);
        setError(null);
      };

      utterance.onend = () => {
        console.log('Speech ended');
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech error:', event.error);
        setError(`Speech error: ${event.error}`);
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [selectedVoice]
  );

  const stop = useCallback(() => {
    if (!window.speechSynthesis) return;

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
      console.warn(`Stop button cooldown active for user ${userId}. Please wait before stopping again.`);
      setError('Please wait a moment before stopping again.');
      setTimeout(() => setError(null), 2000); // Clear error after 2 seconds
      return;
    }

    // Record this stop press for this user
    userStopTimestamps[userId].push(now);

    // Perform stop action
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [sessionId]);

  const pause = useCallback(() => {
    if (window.speechSynthesis && isSpeaking) {
      window.speechSynthesis.pause();
    }
  }, [isSpeaking]);

  const resume = useCallback(() => {
    if (window.speechSynthesis && isPaused) {
      window.speechSynthesis.resume();
    }
  }, [isPaused]);

  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
  }, []);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    selectedVoice,
    setVoice,
    error,
  };
};
