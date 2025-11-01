// ============================================================================
// AlertPanel - Modern Dark Theme with Neon Accents and Glow Effects
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useParent } from '../../contexts/ParentContext';
import { Alert, AlertLevel } from '../../types';
import api from '../../services/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { useParentWebSocket } from '../../hooks/useParentWebSocket';
import { logger, LogCategory } from '../../utils/logger';

interface AlertPanelProps {
  sessionId?: string; // Optional - will fetch from most recent session if not provided
  childName?: string; // Required when sessionId is not provided
  parentId?: string | null; // Required when sessionId is not provided
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({
  sessionId,
  childName,
  parentId: parentIdProp,
  autoRefresh = true,
  refreshInterval = 10000, // 10 seconds
}) => {
  const { parentTheme } = useTheme();
  const { parentId: contextParentId } = useParent();
  const parentId = parentIdProp || contextParentId;
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifiedAlertIds, setNotifiedAlertIds] = useState<Set<number>>(new Set());
  const [resolvingAlertIds, setResolvingAlertIds] = useState<Set<number>>(new Set());
  const [isOffline, setIsOffline] = useState(false);

  const isLight = parentTheme === 'light';


  // Play emergency alert sound
  const playEmergencySound = useCallback(() => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // High-pitched beep
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      // Play 3 beeps
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 800;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc2.start();
        osc2.stop(audioContext.currentTime + 0.5);
      }, 600);

      setTimeout(() => {
        const osc3 = audioContext.createOscillator();
        const gain3 = audioContext.createGain();
        osc3.connect(gain3);
        gain3.connect(audioContext.destination);
        osc3.frequency.value = 800;
        osc3.type = 'sine';
        gain3.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc3.start();
        osc3.stop(audioContext.currentTime + 0.5);
      }, 1200);
    } catch (error) {
      console.error('Failed to play emergency sound:', error);
    }
  }, []);

  // Show browser notification for emergency alerts
  const showEmergencyNotification = useCallback((alert: Alert) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🚨 EMERGENCY ALERT', {
        body: alert.message,
        icon: '/logo.png',
        badge: '/logo.png',
        requireInteraction: true,
        tag: `alert-${alert.id}`,
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('🚨 EMERGENCY ALERT', {
            body: alert.message,
            requireInteraction: true,
          });
        }
      });
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
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
            setIsOffline(!latestSession.is_active);
          } else {
            // No sessions found for this child
            setAlerts([]);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Failed to fetch sessions for alerts:', err);
          setAlerts([]);
          setLoading(false);
          return;
        }
      } else {
        setIsOffline(false);
      }

      if (!targetSessionId) {
        setAlerts([]);
        setLoading(false);
        return;
      }

      const data = await api.alerts.getUnresolved(targetSessionId);

      // Check for new emergency alerts
      const newEmergencyAlerts = data.filter(
        alert => alert.alert_level === AlertLevel.EMERGENCY && !notifiedAlertIds.has(alert.id)
      );

      // Notify for new emergency alerts
      if (newEmergencyAlerts.length > 0) {
        playEmergencySound();
        newEmergencyAlerts.forEach(alert => {
          showEmergencyNotification(alert);
          setNotifiedAlertIds(prev => new Set(prev).add(alert.id));
        });
      }

      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load alerts';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [sessionId, childName, parentId, notifiedAlertIds, playEmergencySound, showEmergencyNotification]);

  // WebSocket connection for real-time alerts
  useParentWebSocket({
    parentId,
    onEmergency: useCallback((wsAlert: any) => {
      logger.error(LogCategory.PARENT, '🚨 INSTANT EMERGENCY ALERT RECEIVED!', undefined, {
        message: wsAlert.message,
        timestamp: wsAlert.timestamp,
      });

      // Play sound immediately
      playEmergencySound();

      // Show browser notification immediately
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 EMERGENCY ALERT', {
          body: wsAlert.message,
          icon: '/logo.png',
          badge: '/logo.png',
          requireInteraction: true,
          tag: `ws-emergency-${Date.now()}`,
        });
      }

      // Refresh alerts to show the new one
      fetchAlerts();
    }, [playEmergencySound, fetchAlerts]),
    onAlert: useCallback((wsAlert: any) => {
      logger.info(LogCategory.PARENT, 'Real-time alert received', {
        level: wsAlert.level,
        message: wsAlert.message,
      });

      // Refresh alerts to show the new one
      fetchAlerts();
    }, [fetchAlerts]),
    enabled: true,
  });

  useEffect(() => {
    fetchAlerts();

    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [sessionId, autoRefresh, refreshInterval, fetchAlerts]);

  const handleResolve = async (alertId: number) => {
    console.log('handleResolve called with alertId:', alertId);

    // Mark as resolving
    setResolvingAlertIds((prev) => new Set(prev).add(alertId));

    // Optimistic update - remove alert immediately from display
    const originalAlerts = alerts;
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));

    try {
      console.log('Calling API to resolve alert:', alertId);
      await api.alerts.resolve(alertId);
      console.log('Alert resolved successfully:', alertId);

      // Also remove from notified set
      setNotifiedAlertIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    } catch (err) {
      console.error('Failed to resolve alert:', err);
      // Restore alerts on error
      setAlerts(originalAlerts);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      alert(`Could not resolve alert: ${errorMessage}\nPlease try again.`);
    } finally {
      // Remove from resolving set
      setResolvingAlertIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

  const getSeverityColor = (alertLevel: AlertLevel) => {
    if (isLight) {
      switch (alertLevel) {
        case AlertLevel.INFO:
          return {
            bg: 'bg-blue-50 border border-blue-200',
            border: '',
            text: 'text-blue-700',
            glow: 'hover:shadow-md',
            badge: 'bg-blue-100 text-blue-700 border border-blue-300'
          };
        case AlertLevel.WARNING:
          return {
            bg: 'bg-yellow-50 border border-yellow-200',
            border: '',
            text: 'text-yellow-700',
            glow: 'hover:shadow-md',
            badge: 'bg-yellow-100 text-yellow-700 border border-yellow-300'
          };
        case AlertLevel.URGENT:
          return {
            bg: 'bg-orange-50 border border-orange-200',
            border: '',
            text: 'text-orange-700',
            glow: 'hover:shadow-lg',
            badge: 'bg-orange-100 text-orange-700 border border-orange-300'
          };
        case AlertLevel.EMERGENCY:
          return {
            bg: 'bg-red-50 border border-red-300',
            border: '',
            text: 'text-red-700',
            glow: 'hover:shadow-xl shadow-red-200/50',
            badge: 'bg-red-100 text-red-700 border border-red-300'
          };
        default:
          return {
            bg: 'bg-gray-50 border border-gray-200',
            border: '',
            text: 'text-gray-700',
            glow: '',
            badge: 'bg-gray-100 text-gray-700 border border-gray-300'
          };
      }
    } else {
      switch (alertLevel) {
        case AlertLevel.INFO:
          return {
            bg: 'glass-dark',
            border: 'border-blue-500/30',
            text: 'text-blue-300',
            glow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]',
            badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          };
        case AlertLevel.WARNING:
          return {
            bg: 'glass-dark',
            border: 'border-yellow-500/30',
            text: 'text-yellow-300',
            glow: 'hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]',
            badge: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
          };
        case AlertLevel.URGENT:
          return {
            bg: 'glass-dark',
            border: 'border-orange-500/30',
            text: 'text-orange-300',
            glow: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.3)]',
            badge: 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
          };
        case AlertLevel.EMERGENCY:
          return {
            bg: 'glass-dark bg-red-500/10',
            border: 'border-red-500/50 glow-purple shadow-[0_0_60px_rgba(239,68,68,0.6)]',
            text: 'text-red-300',
            glow: 'hover:shadow-[0_0_80px_rgba(239,68,68,0.8)] animate-pulse',
            badge: 'bg-red-500/30 text-red-100 border border-red-500/50 font-bold animate-pulse'
          };
        default:
          return {
            bg: 'glass-dark',
            border: 'border-gray-500/30',
            text: 'text-gray-300',
            glow: '',
            badge: 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
          };
      }
    }
  };

  const getSeverityIcon = (alertLevel: AlertLevel) => {
    switch (alertLevel) {
      case AlertLevel.INFO:
        return '💡';
      case AlertLevel.WARNING:
        return '⚠️';
      case AlertLevel.URGENT:
        return '🔶';
      case AlertLevel.EMERGENCY:
        return '🚨';
      default:
        return '📢';
    }
  };

  if (loading) {
    return (
      <div className="glass-dark rounded-2xl p-8 border border-white/10">
        <LoadingSpinner message="Loading alerts..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-dark rounded-2xl p-6 border border-red-500/30 glow-purple">
        <p className="text-red-300 font-semibold">⚠️ {error}</p>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className={`${isLight ? 'bg-green-50 border-green-300' : 'glass-dark border-terminal-green/30 glow-green'} rounded-2xl p-12 text-center border animate-fade-in`}>
        <div className={`w-20 h-20 ${isLight ? 'bg-green-100 border-green-300' : 'bg-terminal-green/20 border-terminal-green/30'} rounded-full flex items-center justify-center mx-auto mb-6 border`}>
          <svg className={`w-10 h-10 ${isLight ? 'text-green-600' : 'text-terminal-green'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className={`${isLight ? 'text-green-700' : 'text-terminal-green'} font-bold text-xl font-geometric mb-2`}>All Clear!</p>
        <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-sm font-mono`}>No active alerts detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className={`text-2xl font-bold font-geometric ${isLight ? 'text-gray-800' : 'text-white'}`}>
            Active Alerts{' '}
            <span className={`${isLight ? 'text-cyan-600' : 'text-neon-cyan'} font-mono text-xl`}>({alerts.length})</span>
          </h2>
          {isOffline && (
            <span className={`${isLight ? 'bg-gray-100 text-gray-600 border-gray-300' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'} px-3 py-1 rounded-lg text-xs font-semibold font-mono border flex items-center gap-2`}>
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              OFFLINE - Showing Previous Alerts
            </span>
          )}
        </div>
        <button
          onClick={fetchAlerts}
          className={`${isLight ? 'bg-white border-cyan-300 text-cyan-600 hover:bg-cyan-50' : 'glass-dark border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 hover-glow-cyan'} px-4 py-2 rounded-xl border transition-all duration-300 flex items-center gap-2 font-mono text-sm`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Alerts Grid */}
      <div className="grid gap-4">
        {alerts.map((alert) => {
          const colors = getSeverityColor(alert.alert_level);
          const isEmergency = alert.alert_level === AlertLevel.EMERGENCY;

          return (
            <div
              key={alert.id}
              className={`
                ${colors.bg} ${colors.border} ${colors.glow}
                border rounded-2xl ${isEmergency ? 'p-8' : 'p-6'} transition-all duration-300 card-hover
                animate-slide-up
                ${isEmergency ? 'ring-4 ring-red-500/40' : ''}
              `}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Alert Content */}
                <div className="flex-1 space-y-3">
                  {/* Header with Icon and Severity */}
                  <div className="flex items-center gap-3">
                    <span className={isEmergency ? 'text-5xl' : 'text-3xl'}>{getSeverityIcon(alert.alert_level)}</span>
                    <span className={`${colors.badge} ${isEmergency ? 'px-4 py-2 text-sm' : 'px-3 py-1 text-xs'} rounded-lg font-bold uppercase tracking-wider font-mono`}>
                      {alert.alert_level}
                    </span>
                    {alert.requires_action && (
                      <span className={`bg-red-500/30 text-red-100 border border-red-500/50 ${isEmergency ? 'px-4 py-2 text-sm' : 'px-3 py-1 text-xs'} rounded-lg font-semibold font-mono ${isEmergency ? 'animate-pulse' : ''}`}>
                        ACTION REQUIRED
                      </span>
                    )}
                  </div>

                  {/* Alert Message */}
                  <p className={`${isLight ? 'text-gray-900' : 'text-white'} font-semibold ${isEmergency ? 'text-2xl' : 'text-lg'} font-geometric leading-relaxed`}>
                    {alert.message}
                  </p>

                  {/* Context */}
                  {alert.context && (
                    <div className={`glass rounded-xl p-4 border ${isEmergency ? 'border-red-400/30 bg-red-500/10' : 'border-white/10'}`}>
                      <p className={`${isEmergency ? 'text-base' : 'text-sm'} ${isLight ? 'text-gray-700' : 'text-gray-300'} font-mono`}>
                        <span className={isLight ? 'text-gray-500' : 'text-gray-500'}>Context:</span> {alert.context}
                      </p>
                    </div>
                  )}

                  {/* AI Assessment */}
                  {alert.ai_assessment && (
                    <div className={`glass rounded-xl p-4 border ${isEmergency ? 'border-red-400/30 bg-red-500/10' : 'border-neon-cyan/20'}`}>
                      <p className={`${isEmergency ? 'text-base' : 'text-sm'} ${isEmergency ? (isLight ? 'text-red-600' : 'text-red-300') : 'text-neon-cyan'} font-mono`}>
                        <span className={isLight ? 'text-gray-500' : 'text-gray-500'}>AI Assessment:</span> {alert.ai_assessment}
                      </p>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-gray-500 font-mono flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>

                {/* Resolve Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResolve(alert.id);
                  }}
                  disabled={resolvingAlertIds.has(alert.id)}
                  className={`glass-dark border border-terminal-green/30 hover:bg-terminal-green/20 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover-glow-cyan flex items-center gap-2 text-terminal-green font-mono text-sm shrink-0 ${
                    resolvingAlertIds.has(alert.id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
                >
                  {resolvingAlertIds.has(alert.id) ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Resolving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Resolve
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
