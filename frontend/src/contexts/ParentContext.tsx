// ============================================================================
// ParentContext - Manages parent dashboard state and child monitoring
// ============================================================================

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Child, Session } from '../types';
import api from '../services/api';
import { logger, LogCategory } from '../utils/logger';

interface ParentContextType {
  // Parent info
  parentId: string | null;
  setParentId: (id: string | null) => void;

  // Children management
  children: Child[];
  selectedChild: Child | null;
  selectChild: (child: Child | null) => void;
  refreshChildren: () => Promise<void>;

  // Selected child's active session
  activeSession: Session | null;
  refreshActiveSession: () => Promise<void>;

  // Loading and error states
  loading: boolean;
  error: string | null;
}

const ParentContext = createContext<ParentContextType | undefined>(undefined);

interface ParentProviderProps {
  children: ReactNode;
}

const PARENT_ID_KEY = 'parent_id';
const SELECTED_CHILD_KEY = 'parent_selected_child_id';

export const ParentProvider: React.FC<ParentProviderProps> = ({ children }) => {
  const [parentId, setParentIdState] = useState<string | null>(null);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChild, setSelectedChildState] = useState<Child | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wrapper to persist parent ID
  const setParentId = useCallback((id: string | null) => {
    setParentIdState(id);
    if (id) {
      localStorage.setItem(PARENT_ID_KEY, id);
      logger.debug(LogCategory.PARENT, 'Parent ID saved to localStorage', { parentId: id });
    } else {
      localStorage.removeItem(PARENT_ID_KEY);
      localStorage.removeItem(SELECTED_CHILD_KEY);
      logger.debug(LogCategory.PARENT, 'Parent ID removed from localStorage');
    }
  }, []);

  // Select a child to monitor
  const selectChild = useCallback((child: Child | null) => {
    setSelectedChildState(child);
    if (child) {
      localStorage.setItem(SELECTED_CHILD_KEY, child.child_id);
      logger.info(LogCategory.PARENT, 'Selected child', {
        childId: child.child_id,
        childName: child.name,
      });
    } else {
      localStorage.removeItem(SELECTED_CHILD_KEY);
      logger.debug(LogCategory.PARENT, 'Deselected child');
    }
    setActiveSession(null); // Clear active session when changing child
  }, []);

  // Auto-discover children from sessions and create profiles
  const autoDiscoverChildren = useCallback(async () => {
    if (!parentId) {
      logger.warn(LogCategory.PARENT, 'Cannot auto-discover: no parent ID');
      return;
    }

    try {
      logger.info(LogCategory.PARENT, 'Auto-discovering children from sessions', { parentId });
      const result = await api.children.autoDiscover(parentId);

      if (result.discovered_count > 0) {
        logger.info(LogCategory.PARENT, `Auto-discovered ${result.discovered_count} new children`, {
          parentId,
          discoveredCount: result.discovered_count,
        });
      } else {
        logger.debug(LogCategory.PARENT, 'No new children discovered');
      }

      return result;
    } catch (err) {
      logger.error(LogCategory.PARENT, 'Failed to auto-discover children', err as Error);
      // Don't throw - auto-discovery failure shouldn't block the app
    }
  }, [parentId]);

  // Fetch children for the current parent
  const refreshChildren = useCallback(async () => {
    if (!parentId) {
      logger.warn(LogCategory.PARENT, 'Cannot refresh children: no parent ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      logger.debug(LogCategory.PARENT, 'Fetching children for parent', { parentId });

      // First, auto-discover any new children from sessions
      await autoDiscoverChildren();

      // Then fetch all children
      const fetchedChildren = await api.children.getAll(parentId);
      setChildrenList(fetchedChildren);

      logger.info(LogCategory.PARENT, `Loaded ${fetchedChildren.length} children`, {
        parentId,
        childCount: fetchedChildren.length,
      });

      // If we have a selected child ID but no selected child object, restore it
      if (!selectedChild) {
        const savedChildId = localStorage.getItem(SELECTED_CHILD_KEY);
        if (savedChildId) {
          const childToSelect = fetchedChildren.find(c => c.child_id === savedChildId);
          if (childToSelect) {
            logger.debug(LogCategory.PARENT, 'Restoring selected child from localStorage', {
              childId: childToSelect.child_id,
              childName: childToSelect.name,
            });
            setSelectedChildState(childToSelect);
          } else {
            // Saved child no longer exists, clear it
            localStorage.removeItem(SELECTED_CHILD_KEY);
            logger.debug(LogCategory.PARENT, 'Saved child no longer exists, cleared selection');
          }
        } else if (fetchedChildren.length > 0) {
          // Auto-select first child if none selected
          logger.debug(LogCategory.PARENT, 'Auto-selecting first child', {
            childId: fetchedChildren[0].child_id,
            childName: fetchedChildren[0].name,
          });
          setSelectedChildState(fetchedChildren[0]);
          localStorage.setItem(SELECTED_CHILD_KEY, fetchedChildren[0].child_id);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch children';
      setError(errorMessage);
      logger.error(LogCategory.PARENT, 'Failed to fetch children', err as Error);
    } finally {
      setLoading(false);
    }
  }, [parentId, autoDiscoverChildren]); // Removed selectedChild to prevent unnecessary re-renders

  // Fetch active session for selected child
  const refreshActiveSession = useCallback(async () => {
    if (!selectedChild) {
      logger.debug(LogCategory.PARENT, 'Cannot refresh active session: no selected child');
      setActiveSession(null);
      return;
    }

    try {
      logger.debug(LogCategory.PARENT, 'Fetching active sessions for child', {
        childId: selectedChild.id,
        childName: selectedChild.name,
      });

      // Get all sessions for this parent
      const sessions = await api.session.getByParentId(parentId || '');

      // Find active session for selected child
      const childActiveSession = sessions.find(
        s => s.child_id === selectedChild.child_id && s.is_active
      );

      if (childActiveSession) {
        setActiveSession(childActiveSession);
        logger.info(LogCategory.PARENT, 'Found active session for child', {
          sessionId: childActiveSession.session_id,
          childName: selectedChild.name,
        });
      } else {
        setActiveSession(null);
        logger.debug(LogCategory.PARENT, 'No active session found for child', {
          childName: selectedChild.name,
        });
      }
    } catch (err) {
      logger.error(LogCategory.PARENT, 'Failed to fetch active session', err as Error);
      setActiveSession(null);
    }
  }, [selectedChild, parentId]);

  // Restore parent ID from localStorage on mount
  useEffect(() => {
    const savedParentId = localStorage.getItem(PARENT_ID_KEY);
    if (savedParentId) {
      logger.debug(LogCategory.PARENT, 'Restoring parent ID from localStorage', {
        parentId: savedParentId,
      });
      setParentIdState(savedParentId);
    }
  }, []);

  // Fetch children when parent ID is set
  useEffect(() => {
    if (parentId) {
      refreshChildren();
    } else {
      setChildrenList([]);
      setSelectedChildState(null);
      setActiveSession(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentId]); // Only re-run when parentId changes, not when refreshChildren changes

  // Fetch active session when child is selected
  useEffect(() => {
    if (selectedChild) {
      refreshActiveSession();

      // Auto-refresh active session every 10 seconds
      const intervalId = setInterval(() => {
        refreshActiveSession();
      }, 10000);

      return () => clearInterval(intervalId);
    }
  }, [selectedChild, refreshActiveSession]);

  const value: ParentContextType = {
    parentId,
    setParentId,
    children: childrenList,
    selectedChild,
    selectChild,
    refreshChildren,
    activeSession,
    refreshActiveSession,
    loading,
    error,
  };

  return <ParentContext.Provider value={value}>{children}</ParentContext.Provider>;
};

export const useParent = (): ParentContextType => {
  const context = useContext(ParentContext);
  if (!context) {
    throw new Error('useParent must be used within a ParentProvider');
  }
  return context;
};
