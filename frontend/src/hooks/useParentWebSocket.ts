// ============================================================================
// useParentWebSocket - Real-time WebSocket connection for parent notifications
// ============================================================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { Alert, AlertLevel } from '../types';
import { logger, LogCategory } from '../utils/logger';

interface WebSocketAlert {
  type: 'alert';
  level: string;
  message: string;
  context?: string;
  timestamp: string;
  requires_action: boolean;
}

interface UseParentWebSocketProps {
  parentId: string | null;
  onAlert?: (alert: WebSocketAlert) => void;
  onEmergency?: (alert: WebSocketAlert) => void;
  enabled?: boolean;
}

const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';

export const useParentWebSocket = ({
  parentId,
  onAlert,
  onEmergency,
  enabled = true,
}: UseParentWebSocketProps) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (!parentId || !enabled) {
      logger.debug(LogCategory.PARENT, 'WebSocket connection skipped', {
        parentId,
        enabled,
      });
      return;
    }

    // Don't create multiple connections
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      logger.debug(LogCategory.PARENT, 'WebSocket already connected');
      return;
    }

    try {
      const wsUrl = `${WS_BASE_URL}/parent/${parentId}`;
      logger.info(LogCategory.PARENT, `Connecting to WebSocket: ${wsUrl}`);

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        logger.info(LogCategory.PARENT, 'WebSocket connected successfully');
        setIsConnected(true);
        setConnectionError(null);

        // Send heartbeat every 30 seconds
        const heartbeatInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);

        // Store interval ID for cleanup
        (ws as any).heartbeatInterval = heartbeatInterval;
      };

      ws.onmessage = (event) => {
        try {
          // Handle pong response
          if (event.data === 'pong') {
            logger.debug(LogCategory.PARENT, 'Heartbeat acknowledged');
            return;
          }

          // Parse JSON message
          const data = JSON.parse(event.data) as WebSocketAlert;

          logger.info(LogCategory.PARENT, 'WebSocket message received', {
            type: data.type,
            level: data.level,
          });

          // Handle alert messages
          if (data.type === 'alert') {
            // Call general alert handler
            if (onAlert) {
              onAlert(data);
            }

            // Call emergency handler for emergency alerts
            if (data.level === 'emergency' && onEmergency) {
              logger.error(
                LogCategory.PARENT,
                '🚨 EMERGENCY ALERT RECEIVED via WebSocket',
                undefined,
                { message: data.message, context: data.context }
              );
              onEmergency(data);
            }
          }
        } catch (error) {
          logger.error(
            LogCategory.PARENT,
            'Failed to parse WebSocket message',
            error as Error
          );
        }
      };

      ws.onerror = (error) => {
        logger.error(
          LogCategory.PARENT,
          'WebSocket error occurred',
          error as any
        );
        setConnectionError('WebSocket connection error');
      };

      ws.onclose = (event) => {
        logger.info(LogCategory.PARENT, 'WebSocket closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });

        setIsConnected(false);

        // Clear heartbeat interval
        if ((ws as any).heartbeatInterval) {
          clearInterval((ws as any).heartbeatInterval);
        }

        // Attempt to reconnect after 5 seconds (if not a clean close)
        if (!event.wasClean && enabled) {
          logger.info(
            LogCategory.PARENT,
            'Attempting to reconnect in 5 seconds...'
          );
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      logger.error(
        LogCategory.PARENT,
        'Failed to create WebSocket connection',
        error as Error
      );
      setConnectionError('Failed to create WebSocket connection');
    }
  }, [parentId, enabled, onAlert, onEmergency]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      logger.info(LogCategory.PARENT, 'Disconnecting WebSocket');

      // Clear heartbeat interval
      if ((wsRef.current as any).heartbeatInterval) {
        clearInterval((wsRef.current as any).heartbeatInterval);
      }

      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionError,
    reconnect: connect,
    disconnect,
  };
};
