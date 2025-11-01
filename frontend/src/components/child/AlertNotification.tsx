// ============================================================================
// AlertNotification - Child-friendly alert/notification display
// ============================================================================

import React, { useEffect, useState } from 'react';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AlertNotificationProps {
  message: string;
  type?: NotificationType;
  duration?: number; // Auto-dismiss after duration (ms), 0 = don't auto-dismiss
  onDismiss?: () => void;
  visible?: boolean;
}

export const AlertNotification: React.FC<AlertNotificationProps> = ({
  message,
  type = 'info',
  duration = 5000,
  onDismiss,
  visible = true,
}) => {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (duration > 0 && isVisible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) {
    return null;
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-100 border-green-400',
          text: 'text-green-800',
          icon: '✓',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-100 border-yellow-400',
          text: 'text-yellow-800',
          icon: '⚠️',
        };
      case 'error':
        return {
          bg: 'bg-red-100 border-red-400',
          text: 'text-red-800',
          icon: '❌',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-100 border-blue-400',
          text: 'text-blue-800',
          icon: 'ℹ️',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={`${styles.bg} border-l-4 ${styles.text} p-4 rounded-lg shadow-lg animate-slide-down flex items-center justify-between gap-3`}
      role="alert"
    >
      <div className="flex items-center gap-3 flex-1">
        <span className="text-2xl">{styles.icon}</span>
        <p className="font-semibold text-lg">{message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="text-2xl hover:opacity-70 transition-opacity"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
};

// Alert Container for stacking multiple alerts
interface AlertContainerProps {
  children: React.ReactNode;
}

export const AlertContainer: React.FC<AlertContainerProps> = ({ children }) => {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4 space-y-3">
      {children}
    </div>
  );
};