// ============================================================================
// SessionContext - Manages child session state
// ============================================================================

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Session, SessionContextType } from '../types';
import api from '../services/api';
import { logger, LogCategory } from '../utils/logger';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

logger.debug(LogCategory.SESSION, 'SessionContext initialized');

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to refresh session data from backend
  const refreshSession = useCallback(async (sessionId: string) => {
    try {
      const updatedSession = await api.session.get(sessionId);
      setSession(updatedSession);
      localStorage.setItem('current_session', JSON.stringify(updatedSession));
      logger.debug(LogCategory.SESSION, 'Session refreshed from backend', {
        sessionId,
        isActive: updatedSession.is_active,
      });
    } catch (err) {
      logger.error(LogCategory.SESSION, 'Failed to refresh session', err as Error);
      // If session no longer exists, clear it
      if ((err as any)?.response?.status === 404) {
        setSession(null);
        localStorage.removeItem('current_session');
        logger.info(LogCategory.SESSION, 'Session not found on backend, cleared local session');
      }
    }
  }, []);

  const startSession = useCallback(
    async (childName: string, childAge: number, parentId: string, childGender?: 'boy' | 'girl' | null) => {
      logger.info(LogCategory.SESSION, 'Attempting to start session', {
        childName,
        childAge,
        parentId,
        childGender,
      });

      try {
        setLoading(true);
        setError(null);

        const newSession = await api.session.start(childName, childAge, parentId, childGender);
        setSession(newSession);

        // Store session in localStorage for persistence
        localStorage.setItem('current_session', JSON.stringify(newSession));
        logger.debug(LogCategory.SESSION, 'Session stored in localStorage');

        logger.session.start(newSession.session_id, childName, childAge);
      } catch (err) {
        logger.session.error('Failed to start session', err as Error);
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
    if (!session) {
      logger.warn(LogCategory.SESSION, 'Attempted to end session but no active session');
      return;
    }

    logger.info(LogCategory.SESSION, `Ending session: ${session.session_id}`);

    try {
      setLoading(true);
      await api.session.end(session.session_id);
      setSession(null);

      // Remove from localStorage
      localStorage.removeItem('current_session');
      logger.debug(LogCategory.SESSION, 'Session removed from localStorage');

      logger.session.end(session.session_id);
    } catch (err) {
      logger.session.error('Failed to end session', err as Error);
      const errorMessage = err instanceof Error ? err.message : 'Failed to end session';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Clear any saved session on mount to prevent auto-login
  React.useEffect(() => {
    logger.debug(LogCategory.SESSION, 'Clearing any saved session from localStorage');
    localStorage.removeItem('current_session');
    logger.info(LogCategory.SESSION, 'Session auto-restore disabled - users must select child each time');
  }, []);

  // Auto-refresh active session every 30 seconds
  React.useEffect(() => {
    if (!session?.session_id || !session?.is_active) {
      return;
    }

    logger.debug(LogCategory.SESSION, 'Starting auto-refresh for active session');
    const intervalId = setInterval(() => {
      refreshSession(session.session_id);
    }, 30000); // 30 seconds

    return () => {
      logger.debug(LogCategory.SESSION, 'Stopping auto-refresh');
      clearInterval(intervalId);
    };
  }, [session?.session_id, session?.is_active, refreshSession]);

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
