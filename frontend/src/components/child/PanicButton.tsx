// ============================================================================
// PanicButton - Emergency button to call parent
// ============================================================================

import React, { useState } from 'react';
import { useSession } from '../../contexts/SessionContext';
import api from '../../services/api';

interface PanicButtonProps {
  size?: 'small' | 'medium' | 'large';
  position?: 'fixed' | 'relative';
}

export const PanicButton: React.FC<PanicButtonProps> = ({
  size = 'medium',
  position = 'fixed',
}) => {
  const { session } = useSession();
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const sizeClasses = {
    small: 'w-12 h-12 text-sm',
    medium: 'w-16 h-16 text-base',
    large: 'w-20 h-20 text-lg',
  };

  const handlePanic = async () => {
    if (!session || isTriggering) return;

    setIsTriggering(true);

    try {
      await api.emergency.trigger(session.session_id);
      setTriggered(true);

      // Show success message briefly
      setTimeout(() => {
        setTriggered(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to trigger panic:', error);
      alert('Could not call parent. Please try again.');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <button
      onClick={handlePanic}
      disabled={isTriggering || triggered}
      className={`
        ${sizeClasses[size]}
        ${position === 'fixed' ? 'fixed top-4 right-4 z-50' : ''}
        bg-red-500 hover:bg-red-600 active:bg-red-700
        text-white font-bold rounded-full
        shadow-lg hover:shadow-xl
        transform transition-all duration-200
        ${!triggered && !isTriggering ? 'hover:scale-110' : ''}
        ${triggered ? 'bg-green-500' : ''}
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center justify-center
        border-4 border-white
      `}
      aria-label="Call Parent"
    >
      {triggered ? (
        <span className="text-2xl">✓</span>
      ) : (
        <span className="text-2xl">SOS</span>
      )}
    </button>
  );
};
