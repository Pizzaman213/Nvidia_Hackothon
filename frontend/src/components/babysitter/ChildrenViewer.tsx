// ============================================================================
// ChildrenViewer - View-only children list for babysitters (no add/edit/delete)
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Child, ChildSummary } from '../../types';
import { api } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface ChildrenViewerProps {
  parentId: string;
  onSelectChild?: (child: Child | null) => void;
  selectedChild?: Child | null;
}

export const ChildrenViewer: React.FC<ChildrenViewerProps> = ({ parentId, onSelectChild, selectedChild }) => {
  const { parentTheme } = useTheme();
  const [children, setChildren] = useState<Child[]>([]);
  const [childSummaries, setChildSummaries] = useState<Map<string, ChildSummary>>(new Map());
  const [loading, setLoading] = useState(true);

  // Theme variables
  const isLight = parentTheme === 'light';
  const glassClass = isLight ? 'glass-light' : 'glass-dark';
  const textPrimaryClass = isLight ? 'text-gray-800' : 'text-white';
  const textSecondaryClass = isLight ? 'text-gray-600' : 'text-gray-400';
  const borderClass = isLight ? 'border-gray-200' : 'border-white/10';
  const cardBgClass = isLight ? 'bg-white border border-gray-200' : 'glass-dark border border-white/10';

  const loadChildren = useCallback(async () => {
    try {
      setLoading(true);

      // Load all children
      const childrenData = await api.children.getAll(parentId);
      setChildren(childrenData);

      // Load summaries for each child
      const summaries = new Map<string, ChildSummary>();
      await Promise.all(
        childrenData.map(async (child) => {
          try {
            const summary = await api.children.getSummary(child.child_id);
            summaries.set(child.child_id, summary);
          } catch (error) {
            console.error(`Failed to load summary for ${child.name}:`, error);
          }
        })
      );
      setChildSummaries(summaries);
    } catch (error) {
      console.error('Failed to load children:', error);
    } finally {
      setLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    loadChildren();

    // Auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      loadChildren();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [loadChildren]);

  if (loading) {
    return (
      <div className={`${glassClass} rounded-2xl shadow-xl p-8`}>
        <LoadingSpinner message="Loading children..." />
      </div>
    );
  }

  return (
    <div className={`${glassClass} rounded-2xl shadow-xl p-6`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className={`text-2xl font-bold ${textPrimaryClass} mb-2`}>Children</h2>
        <p className={`${textSecondaryClass} text-sm`}>
          View and monitor children (read-only access as babysitter)
        </p>
      </div>

      {/* Children List */}
      {children.length === 0 ? (
        <div className={`${cardBgClass} rounded-lg p-12 text-center`}>
          <div className="text-6xl mb-4">👶</div>
          <h3 className={`text-xl font-bold ${textPrimaryClass} mb-2`}>No Children Found</h3>
          <p className={`${textSecondaryClass}`}>
            The parent hasn't added any children yet.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => {
            const summary = childSummaries.get(child.child_id);
            const isSelected = selectedChild?.child_id === child.child_id;

            return (
              <button
                key={child.child_id}
                onClick={() => onSelectChild?.(child)}
                className={`${cardBgClass} rounded-lg p-5 text-left transition-all transform hover:scale-105 hover:shadow-lg ${
                  isSelected
                    ? 'ring-2 ring-purple-500 shadow-lg'
                    : ''
                }`}
              >
                {/* Child Avatar and Name */}
                <div className="flex items-center gap-3 mb-3">
                  {child.profile_picture_url ? (
                    <img
                      src={child.profile_picture_url}
                      alt={`${child.name}'s profile`}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
                      style={{ backgroundColor: child.avatar_color }}
                    >
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-bold ${textPrimaryClass} truncate`}>{child.name}</h3>
                    <p className={`text-sm ${textSecondaryClass}`}>{child.age} years old</p>
                  </div>
                  {isSelected && (
                    <div className="text-purple-500">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Child Summary */}
                {summary && summary.stats && (
                  <div className={`pt-3 border-t ${borderClass} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${textSecondaryClass}`}>Total Sessions</span>
                      <span className={`text-sm font-bold ${textPrimaryClass}`}>{summary.stats.total_sessions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${textSecondaryClass}`}>Total Activities</span>
                      <span className={`text-sm font-bold ${textPrimaryClass}`}>{summary.stats.total_activities}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${textSecondaryClass}`}>Total Alerts</span>
                      <span className={`text-sm font-bold ${textPrimaryClass}`}>{summary.stats.total_alerts}</span>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Info Banner */}
      <div className={`mt-6 p-4 ${isLight ? 'bg-purple-50 border-purple-200' : 'bg-purple-900/20 border-purple-500/30'} border rounded-lg`}>
        <div className="flex items-start gap-3">
          <svg className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'} flex-shrink-0 mt-0.5`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className={`text-sm font-semibold ${isLight ? 'text-purple-900' : 'text-purple-300'} mb-1`}>
              Babysitter Access - Read Only
            </p>
            <p className={`text-xs ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>
              As a babysitter, you can view and monitor children but cannot add, edit, or delete child profiles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
