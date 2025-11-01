// ============================================================================
// ActivityLog - Display child's activity history with expandable details
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import { Activity, ActivityType, ChatMessage } from '../../types';
import api from '../../services/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { useTheme } from '../../contexts/ThemeContext';

interface ActivityLogProps {
  sessionId?: string; // Optional - will fetch from most recent session if not provided
  childName?: string; // Required when sessionId is not provided
  parentId?: string; // Required when sessionId is not provided
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  sessionId,
  childName,
  parentId,
  autoRefresh = true,
  refreshInterval = 15000 // 15 seconds
}) => {
  const { parentTheme } = useTheme();
  const isLight = parentTheme === 'light';

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedActivities, setExpandedActivities] = useState<Set<number>>(new Set());
  const [activityMessages, setActivityMessages] = useState<Map<number, ChatMessage[]>>(new Map());
  const [loadingMessages, setLoadingMessages] = useState<Set<number>>(new Set());
  const [isOffline, setIsOffline] = useState(false);
  const [resolvedSessionId, setResolvedSessionId] = useState<string | undefined>(sessionId);

  const fetchActivities = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Resolve sessionId if not provided
      let targetSessionId = sessionId;

      if (!targetSessionId && childName && parentId) {
        // Fetch the most recent session for this child
        try {
          const sessions = await api.session.getByParentId(parentId);
          const childSessions = sessions.filter(s => s.child_name === childName);

          if (childSessions.length > 0) {
            // Get the most recent session
            const latestSession = childSessions.sort((a, b) =>
              new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
            )[0];
            targetSessionId = latestSession.session_id;
            setResolvedSessionId(targetSessionId);
            setIsOffline(!latestSession.is_active);
          } else {
            // No sessions found for this child
            setActivities([]);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Failed to fetch sessions for activities:', err);
          setActivities([]);
          setLoading(false);
          return;
        }
      } else {
        setResolvedSessionId(sessionId);
        setIsOffline(false);
      }

      if (!targetSessionId) {
        setActivities([]);
        setLoading(false);
        return;
      }

      // Backend returns Activity[] directly (not a paginated response object)
      const activitiesData = await api.activities.getAll(targetSessionId, pageNum, 20);

      if (pageNum === 1) {
        setActivities(activitiesData);
      } else {
        setActivities((prev) => [...prev, ...activitiesData]);
      }

      // Backend doesn't return has_more yet, so we check if we got a full page
      // If we got less than the page size, there are no more results
      setHasMore(activitiesData.length === 20);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load activities';
      setError(errorMessage);
      // Set empty array on error to prevent undefined errors
      if (pageNum === 1) {
        setActivities([]);
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId, childName, parentId]);

  useEffect(() => {
    fetchActivities(1);

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchActivities(1);
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [sessionId, autoRefresh, refreshInterval, fetchActivities]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivities(nextPage);
  };

  const fetchMessagesForActivity = useCallback(async (activity: Activity) => {
    // Don't fetch if already loading or already have messages
    if (loadingMessages.has(activity.id) || activityMessages.has(activity.id)) {
      return;
    }

    // Need a session ID to fetch messages
    if (!resolvedSessionId) {
      return;
    }

    setLoadingMessages((prev) => new Set(prev).add(activity.id));

    try {
      // Fetch all messages for the session
      const allMessages = await api.session.getMessages(resolvedSessionId, 200);

      // Filter messages by activity time range
      const activityStart = new Date(activity.start_time).getTime();
      const activityEnd = activity.end_time
        ? new Date(activity.end_time).getTime()
        : Date.now();

      const filteredMessages = allMessages.filter((msg) => {
        const msgTime = new Date(msg.timestamp).getTime();
        return msgTime >= activityStart && msgTime <= activityEnd;
      });

      setActivityMessages((prev) => new Map(prev).set(activity.id, filteredMessages));
    } catch (err) {
      console.error('Failed to fetch messages for activity:', err);
    } finally {
      setLoadingMessages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(activity.id);
        return newSet;
      });
    }
  }, [resolvedSessionId, activityMessages, loadingMessages]);

  const toggleActivity = (activityId: number) => {
    setExpandedActivities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
        // Fetch messages when expanding
        const activity = activities.find((a) => a.id === activityId);
        if (activity) {
          fetchMessagesForActivity(activity);
        }
      }
      return newSet;
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'story_time':
      case ActivityType.STORY_TIME:
        return '📚';
      case 'i_spy':
      case ActivityType.I_SPY:
        return '🔍';
      case 'homework_helper':
      case ActivityType.HOMEWORK_HELPER:
        return '✏️';
      case 'free_chat':
      case ActivityType.FREE_CHAT:
        return '💬';
      case 'chat':
        return '💬';
      case 'story':
        return '📚';
      case 'homework':
        return '✏️';
      case 'game':
        return '🎮';
      case 'voice_chat':
        return '🎤';
      case 'image_analysis':
        return '🖼️';
      default:
        return '📋';
    }
  };

  const getActivityLabel = (type: string): string => {
    switch (type) {
      case 'story_time':
      case ActivityType.STORY_TIME:
        return 'Story Time';
      case 'i_spy':
      case ActivityType.I_SPY:
        return 'I Spy';
      case 'homework_helper':
      case ActivityType.HOMEWORK_HELPER:
        return 'Homework Helper';
      case 'free_chat':
      case ActivityType.FREE_CHAT:
        return 'Free Chat';
      case 'chat':
        return 'Chat';
      case 'story':
        return 'Story';
      case 'homework':
        return 'Homework Help';
      case 'game':
        return 'Game';
      case 'voice_chat':
        return 'Voice Chat';
      case 'image_analysis':
        return 'Image Analysis';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getActivityColor = (type: string) => {
    if (isLight) {
      switch (type) {
        case 'story_time':
        case ActivityType.STORY_TIME:
        case 'story':
          return 'bg-purple-50 border-purple-200 text-purple-700';
        case 'i_spy':
        case ActivityType.I_SPY:
        case 'game':
          return 'bg-blue-50 border-blue-200 text-blue-700';
        case 'homework_helper':
        case ActivityType.HOMEWORK_HELPER:
        case 'homework':
          return 'bg-green-50 border-green-200 text-green-700';
        case 'free_chat':
        case ActivityType.FREE_CHAT:
        case 'chat':
        case 'voice_chat':
          return 'bg-pink-50 border-pink-200 text-pink-700';
        case 'image_analysis':
          return 'bg-indigo-50 border-indigo-200 text-indigo-700';
        default:
          return 'bg-gray-50 border-gray-200 text-gray-700';
      }
    } else {
      // Dark mode colors
      switch (type) {
        case 'story_time':
        case ActivityType.STORY_TIME:
        case 'story':
          return 'bg-purple-900/30 border-purple-500/30 text-purple-300';
        case 'i_spy':
        case ActivityType.I_SPY:
        case 'game':
          return 'bg-blue-900/30 border-blue-500/30 text-blue-300';
        case 'homework_helper':
        case ActivityType.HOMEWORK_HELPER:
        case 'homework':
          return 'bg-green-900/30 border-green-500/30 text-green-300';
        case 'free_chat':
        case ActivityType.FREE_CHAT:
        case 'chat':
        case 'voice_chat':
          return 'bg-pink-900/30 border-pink-500/30 text-pink-300';
        case 'image_analysis':
          return 'bg-indigo-900/30 border-indigo-500/30 text-indigo-300';
        default:
          return 'bg-dark-100 border-white/10 text-gray-300';
      }
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / 60000);

    if (minutes < 1) return 'Just started';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getEmotionEmoji = (emotion?: string) => {
    if (!emotion) return '';
    switch (emotion.toLowerCase()) {
      case 'happy':
        return '😊';
      case 'excited':
        return '🤩';
      case 'sad':
        return '😢';
      case 'scared':
        return '😰';
      case 'angry':
        return '😠';
      case 'frustrated':
        return '😤';
      default:
        return '';
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className={`${isLight ? 'bg-white' : 'bg-dark-100 border border-white/10'} rounded-lg shadow-lg p-6`}>
        <LoadingSpinner message="Loading activities..." />
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className={`${isLight ? 'bg-red-50 border-red-200' : 'bg-red-900/20 border-red-500/30'} border-2 rounded-lg p-6`}>
        <p className={`${isLight ? 'text-red-600' : 'text-red-400'} font-semibold`}>{error}</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={`${isLight ? 'bg-gray-50 border-gray-300 text-gray-700' : 'bg-dark-100 border-white/10 text-gray-300'} border-2 rounded-lg p-6 text-center`}>
        <div className="text-5xl mb-3">📋</div>
        <p className="font-semibold">No activities yet</p>
        <p className={`${isLight ? 'text-gray-500' : 'text-gray-400'} text-sm mt-2`}>Activity history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-3">
        <h2 className={`text-xl font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
          Activity Log ({activities.length})
        </h2>
        {isOffline && (
          <span className={`${isLight ? 'bg-gray-100 text-gray-600 border-gray-300' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'} px-3 py-1 rounded-lg text-xs font-semibold font-mono border flex items-center gap-2`}>
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
            OFFLINE - Showing Previous Activities
          </span>
        )}
      </div>

      <div className="space-y-2">
        {activities.map((activity) => {
          const isExpanded = expandedActivities.has(activity.id);

          return (
            <div
              key={activity.id}
              className={`
                ${getActivityColor(activity.activity_type)}
                border-2 rounded-lg shadow-sm transition-all duration-200
                ${isExpanded ? 'shadow-md' : ''}
              `}
            >
              {/* Header - Always Visible */}
              <div
                className="p-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => toggleActivity(activity.id)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-2xl flex-shrink-0">{getActivityIcon(activity.activity_type)}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-bold text-sm truncate">
                        {getActivityLabel(activity.activity_type)}
                      </h3>
                      {/* Dropdown Arrow */}
                      <svg
                        className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>

                    <p className="text-xs mb-1 truncate">{activity.description}</p>

                    <div className="flex items-center gap-3 text-xs opacity-70 flex-wrap">
                      <span>{formatDuration(activity.start_time, activity.end_time)}</span>

                      {/* Show message count if available */}
                      {(activity.details?.messages || activity.data?.messages) && (
                        <span>
                          💬 {activity.details?.messages || activity.data?.messages}
                        </span>
                      )}

                      <span>{formatTime(activity.start_time)}</span>

                      {!activity.end_time && (
                        <span className={`${isLight ? 'bg-green-100 text-green-700' : 'bg-green-900/40 text-green-300'} px-2 py-0.5 rounded-full`}>
                          🟢 In Progress
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details - Shown when clicked */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t-2 border-opacity-30">
                  <div className="space-y-4">
                    {/* Activity Metadata */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold opacity-70">Start Time:</span>
                        <span>{new Date(activity.start_time).toLocaleString()}</span>
                      </div>

                      {activity.end_time && (
                        <div className="flex justify-between items-center">
                          <span className="font-semibold opacity-70">End Time:</span>
                          <span>{new Date(activity.end_time).toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="font-semibold opacity-70">Duration:</span>
                        <span>{formatDuration(activity.start_time, activity.end_time)}</span>
                      </div>
                    </div>

                    {/* Chat History Section */}
                    {loadingMessages.has(activity.id) ? (
                      <div className="py-4">
                        <LoadingSpinner message="Loading chat history..." />
                      </div>
                    ) : activityMessages.has(activity.id) ? (
                      <div className="mt-4 pt-4 border-t border-opacity-30">
                        <h4 className="font-bold text-sm mb-3">
                          💬 Chat History ({(activity.details?.messages || activity.data?.messages || activityMessages.get(activity.id)?.length || 0)} messages)
                        </h4>

                        {activityMessages.get(activity.id)?.length === 0 ? (
                          <p className="text-sm opacity-70 italic">No messages in this activity</p>
                        ) : (
                          <div className={`space-y-3 max-h-96 overflow-y-auto ${isLight ? 'bg-white/30' : 'bg-white/5'} rounded-lg p-3`}>
                            {activityMessages.get(activity.id)?.map((message) => {
                              const isChild = message.role === 'child';
                              return (
                                <div
                                  key={message.id}
                                  className={`flex gap-2 ${isChild ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                  {/* Avatar */}
                                  <div
                                    className={`
                                      flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm
                                      ${isLight
                                        ? (isChild ? 'bg-blue-100' : 'bg-purple-100')
                                        : (isChild ? 'bg-blue-900/50' : 'bg-purple-900/50')
                                      }
                                    `}
                                  >
                                    {isChild ? '👦' : '🤖'}
                                  </div>

                                  {/* Message Bubble */}
                                  <div className={`flex-1 max-w-[80%] ${isChild ? 'text-right' : 'text-left'}`}>
                                    <div className={`flex items-center gap-2 mb-1 ${isChild ? 'justify-end' : 'justify-start'}`}>
                                      <span className="font-semibold text-xs opacity-70">
                                        {isChild ? 'Child' : 'AI'}
                                      </span>
                                      <span className="text-xs opacity-50">
                                        {formatTime(message.timestamp)}
                                      </span>
                                      {message.emotion && isChild && (
                                        <span className="text-sm" title={message.emotion}>
                                          {getEmotionEmoji(message.emotion)}
                                        </span>
                                      )}
                                    </div>

                                    <div
                                      className={`
                                        inline-block rounded-lg px-3 py-2 text-sm
                                        ${isLight
                                          ? (isChild ? 'bg-blue-100 text-gray-700' : 'bg-purple-100 text-gray-700')
                                          : (isChild ? 'bg-blue-900/40 text-blue-100' : 'bg-purple-900/40 text-purple-100')
                                        }
                                      `}
                                    >
                                      <p className="whitespace-pre-wrap break-words">{message.content}</p>

                                      {/* Indicators */}
                                      {(message.has_image || message.audio_url) && (
                                        <div className="flex gap-1 mt-1 text-xs opacity-70">
                                          {message.has_image && <span>📸</span>}
                                          {message.audio_url && <span>🔊</span>}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Additional Details (if any) */}
                    {(activity.details || activity.data) && (
                      <div className="mt-3 pt-3 border-t border-opacity-30">
                        <p className="font-semibold opacity-70 mb-2 text-sm">Additional Details:</p>
                        <pre className={`${isLight ? 'bg-white/50' : 'bg-white/5'} p-3 rounded text-xs overflow-x-auto`}>
                          {JSON.stringify(activity.details || activity.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className={`w-full ${
            isLight
              ? 'bg-blue-400 hover:bg-blue-500 disabled:bg-gray-300'
              : 'bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700'
          } text-white font-semibold py-3 px-6 rounded-lg transition-colors`}
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};
