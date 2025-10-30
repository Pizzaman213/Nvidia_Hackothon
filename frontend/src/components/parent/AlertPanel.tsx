// ============================================================================
// AlertPanel - Display safety alerts for parents
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import { Alert, AlertSeverity } from '../../types';
import api from '../../services/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface AlertPanelProps {
  sessionId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({
  sessionId,
  autoRefresh = true,
  refreshInterval = 10000, // 10 seconds
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const data = await api.alerts.getUnresolved(sessionId);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load alerts';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchAlerts();

    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [sessionId, autoRefresh, refreshInterval, fetchAlerts]);

  const handleResolve = async (alertId: string) => {
    try {
      await api.alerts.resolve(alertId);
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    } catch (err) {
      console.error('Failed to resolve alert:', err);
      alert('Could not resolve alert. Please try again.');
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.LOW:
        return 'bg-blue-100 border-blue-400 text-blue-800';
      case AlertSeverity.MEDIUM:
        return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case AlertSeverity.HIGH:
        return 'bg-orange-100 border-orange-400 text-orange-800';
      case AlertSeverity.CRITICAL:
        return 'bg-red-100 border-red-400 text-red-800';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.LOW:
        return 'ℹ️';
      case AlertSeverity.MEDIUM:
        return '⚠️';
      case AlertSeverity.HIGH:
        return '🔶';
      case AlertSeverity.CRITICAL:
        return '🚨';
      default:
        return '📢';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <LoadingSpinner message="Loading alerts..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-2 border-red-400 rounded-lg p-6">
        <p className="text-red-700 font-semibold">{error}</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-green-50 border-2 border-green-400 rounded-lg p-6 text-center">
        <div className="text-5xl mb-3">✅</div>
        <p className="text-green-700 font-semibold text-lg">All Clear!</p>
        <p className="text-green-600 text-sm mt-2">No active alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          Active Alerts ({alerts.length})
        </h2>
        <button
          onClick={fetchAlerts}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`
            ${getSeverityColor(alert.severity)}
            border-2 rounded-lg p-4 shadow-md
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                <span className="font-bold text-sm uppercase">
                  {alert.severity} - {alert.type}
                </span>
              </div>

              <p className="font-semibold mb-2">{alert.message}</p>

              {alert.context && (
                <p className="text-sm opacity-80 mb-2">Context: {alert.context}</p>
              )}

              <p className="text-xs opacity-70">
                {new Date(alert.timestamp).toLocaleString()}
              </p>
            </div>

            <button
              onClick={() => handleResolve(alert.id)}
              className="ml-4 bg-white hover:bg-gray-100 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              ✓ Resolve
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
