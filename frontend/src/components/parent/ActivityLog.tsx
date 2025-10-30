// ============================================================================
// ActivityLog - Display child's activity history
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import { Activity, ActivityType } from '../../types';
import api from '../../services/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface ActivityLogProps {
  sessionId: string;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ sessionId }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = useCallback(async (pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Backend returns Activity[] directly (not a paginated response object)
      const activitiesData = await api.activities.getAll(sessionId, pageNum, 20);

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
  }, [sessionId]);

  useEffect(() => {
    fetchActivities(1);
  }, [sessionId, fetchActivities]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchActivities(nextPage);
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case ActivityType.STORY_TIME:
        return '📚';
      case ActivityType.I_SPY:
        return '🔍';
      case ActivityType.HOMEWORK_HELPER:
        return '✏️';
      case ActivityType.FREE_CHAT:
        return '💬';
      default:
        return '📋';
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case ActivityType.STORY_TIME:
        return 'bg-purple-100 border-purple-300 text-purple-800';
      case ActivityType.I_SPY:
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case ActivityType.HOMEWORK_HELPER:
        return 'bg-green-100 border-green-300 text-green-800';
      case ActivityType.FREE_CHAT:
        return 'bg-pink-100 border-pink-300 text-pink-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
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

  if (loading && activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <LoadingSpinner message="Loading activities..." />
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="bg-red-100 border-2 border-red-400 rounded-lg p-6">
        <p className="text-red-700 font-semibold">{error}</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 text-center">
        <div className="text-5xl mb-3">📋</div>
        <p className="text-gray-700 font-semibold">No activities yet</p>
        <p className="text-gray-500 text-sm mt-2">Activity history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Activity Log ({activities.length})
      </h2>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className={`
              ${getActivityColor(activity.activity_type)}
              border-2 rounded-lg p-4 shadow-sm
            `}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{getActivityIcon(activity.activity_type)}</span>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold capitalize">
                    {activity.activity_type.replace('_', ' ')}
                  </h3>
                  <span className="text-xs opacity-70">
                    {formatDuration(activity.start_time, activity.end_time)}
                  </span>
                </div>

                <p className="text-sm mb-2">{activity.description}</p>

                <p className="text-xs opacity-70">
                  {new Date(activity.start_time).toLocaleString()}
                  {activity.end_time && ` - ${new Date(activity.end_time).toLocaleTimeString()}`}
                </p>

                {!activity.end_time && (
                  <div className="mt-2 inline-block bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    🟢 In Progress
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};
