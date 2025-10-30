// ============================================================================
// VoiceContext - Manages voice recognition and synthesis
// ============================================================================

import React, { createContext, useContext, ReactNode } from 'react';
import { VoiceContextType } from '../types';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useVoiceSynthesis } from '../hooks/useVoiceSynthesis';

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

interface VoiceProviderProps {
  children: ReactNode;
}

export const VoiceProvider: React.FC<VoiceProviderProps> = ({ children }) => {
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    error: recognitionError,
  } = useVoiceRecognition();

  const {
    isSpeaking,
    speak,
    stop: stopSpeaking,
    error: synthesisError,
  } = useVoiceSynthesis();

  const error = recognitionError || synthesisError;

  const value: VoiceContextType = {
    isListening,
    isSpeaking,
    currentTranscript: transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    error,
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};

export const useVoice = (): VoiceContextType => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};
