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

export const useVoiceSynthesis = (): UseVoiceSynthesisReturn => {
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

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

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
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

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
