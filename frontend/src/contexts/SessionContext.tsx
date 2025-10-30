// ============================================================================
// SessionContext - Manages child session state
// ============================================================================

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Session, SessionContextType } from '../types';
import api from '../services/api';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(
    async (childName: string, childAge: number, parentId: string) => {
      try {
        setLoading(true);
        setError(null);

        const newSession = await api.session.start(childName, childAge, parentId);
        setSession(newSession);

        // Store session in localStorage for persistence
        localStorage.setItem('current_session', JSON.stringify(newSession));

        console.log('Session started:', newSession.session_id);
      } catch (err) {
        console.error('Failed to start session:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to start session';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const endSession = useCallback(async () => {
    if (!session) return;

    try {
      setLoading(true);
      await api.session.end(session.session_id);
      setSession(null);

      // Remove from localStorage
      localStorage.removeItem('current_session');

      console.log('Session ended');
    } catch (err) {
      console.error('Failed to end session:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to end session';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Try to restore session from localStorage on mount
  React.useEffect(() => {
    const savedSession = localStorage.getItem('current_session');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        setSession(parsedSession);
        console.log('Session restored from storage');
      } catch (err) {
        console.error('Failed to restore session:', err);
        localStorage.removeItem('current_session');
      }
    }
  }, []);

  const value: SessionContextType = {
    session,
    startSession,
    endSession,
    loading,
    error,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
