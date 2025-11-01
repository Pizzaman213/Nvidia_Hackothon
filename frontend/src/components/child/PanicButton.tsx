// ============================================================================
// PanicButton - Emergency button to call parent
// ============================================================================

import React, { useState } from 'react';
import { useSession } from '../../contexts/SessionContext';
import api from '../../services/api';
import EmergencyCallModal from './EmergencyCallModal';

interface PanicButtonProps {
  size?: 'small' | 'medium' | 'large';
  position?: 'fixed' | 'relative';
  emergencyContact?: string; // Emergency contact phone number
  childName?: string; // Child's name
  childId?: string; // Child ID for session-less emergency alerts
  parentId?: string; // Parent ID for session-less emergency alerts
}

export const PanicButton: React.FC<PanicButtonProps> = ({
  size = 'medium',
  position = 'fixed',
  emergencyContact,
  childName,
  childId,
  parentId,
}) => {
  const { session } = useSession();
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);

  const sizeClasses = {
    small: 'w-12 h-12 text-sm',
    medium: 'w-16 h-16 text-base',
    large: 'w-20 h-20 text-lg',
  };

  const handlePanic = async () => {
    console.log('Panic button clicked!');
    console.log('Session:', session);
    console.log('Child ID:', childId);
    console.log('Parent ID:', parentId);
    console.log('Emergency contact:', emergencyContact);

    if (isTriggering) {
      console.log('Already triggering, ignoring duplicate click');
      return;
    }

    setIsTriggering(true);

    try {
      // Try to send emergency alert with or without session
      if (session) {
        console.log('Sending emergency alert for session:', session.session_id);
        await api.emergency.trigger(session.session_id);
      } else if (childId && parentId) {
        console.log('Sending session-less emergency alert for child:', childId);
        await api.emergency.triggerWithoutSession(childId, parentId, childName || 'Unknown Child');
      } else {
        console.error('Cannot send emergency alert - no session and no child/parent IDs provided');
        alert('Cannot send emergency alert. Please ensure you are logged in.');
        setIsTriggering(false);
        return;
      }

      console.log('Emergency alert sent successfully');

      // If emergency contact is configured, show call modal for LOCAL calling
      if (emergencyContact) {
        console.log('Opening emergency call modal for:', emergencyContact);
        setShowCallModal(true);
      } else {
        console.log('No emergency contact configured - showing confirmation only');
        // No emergency contact - just show alert sent confirmation
        setTriggered(true);
        setTimeout(() => {
          setTriggered(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to trigger panic:', error);
      alert('Could not send alert. Please try again. Error: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <>
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
        aria-label="Emergency - Call Parent"
        title={emergencyContact ? `Call ${emergencyContact}` : 'Alert Parent'}
      >
        {triggered ? (
          <span className="text-2xl">✓</span>
        ) : (
          <span className="text-2xl">SOS</span>
        )}
      </button>

      {/* Emergency Call Modal */}
      {emergencyContact && (
        <EmergencyCallModal
          isOpen={showCallModal}
          onClose={() => {
            setShowCallModal(false);
            setTriggered(true);
            setTimeout(() => setTriggered(false), 3000);
          }}
          emergencyContact={emergencyContact}
          childName={childName || session?.child_name || 'Child'}
          sessionId={session?.session_id || 'no-session'}
          reason="Emergency button pressed"
        />
      )}
    </>
  );
};
