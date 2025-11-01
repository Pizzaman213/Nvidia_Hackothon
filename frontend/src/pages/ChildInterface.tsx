// ============================================================================
// ChildInterface - Main interface for children
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '../contexts/SessionContext';
import { ActivityType, Child, ChildCreate, Alert, AlertLevel } from '../types';
import { ActivitySelector } from '../components/child/ActivitySelector';
import { PanicButton } from '../components/child/PanicButton';
import { StoryTime } from '../components/child/StoryTime';
import { ISpyGame } from '../components/child/ISpyGame';
import { HomeworkHelper } from '../components/child/HomeworkHelper';
import { FreeChat } from '../components/child/FreeChat';
import { ChildSelector } from '../components/child/ChildSelector';
import { ModeSelector } from '../components/child/ModeSelector';
import { AlertContainer, AlertNotification } from '../components/child/AlertNotification';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getThemeFromGender, getColorScheme } from '../utils/theme';

export const ChildInterface: React.FC = () => {
  const { session, startSession, endSession } = useSession();
  const navigate = useNavigate();

  // Determine theme based on session gender and age
  const theme = useMemo(() => getThemeFromGender(session?.child_gender, session?.child_age), [session?.child_gender, session?.child_age]);
  const colors = useMemo(() => getColorScheme(theme), [theme]);
  const isTeen = useMemo(() => (session?.child_age ?? 0) >= 10, [session?.child_age]);

  const [showChildSelector, setShowChildSelector] = useState(true);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [currentActivity, setCurrentActivity] = useState<ActivityType>(ActivityType.FREE_CHAT);
  const [emergencyContact, setEmergencyContact] = useState<string | undefined>(undefined);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const PARENT_ID = 'parent_parent'; // Must match the parent dashboard login (parent_<username>)

  // Load child's emergency contact when child is selected
  useEffect(() => {
    if (selectedChild) {
      setEmergencyContact(selectedChild.emergency_contact);
    }
  }, [selectedChild]);

  useEffect(() => {
    // If session already exists, skip child selector and mode selector
    if (session) {
      setShowChildSelector(false);
      setShowModeSelector(false);
    }
  }, [session]);

  // Poll for alerts - fetch for current session OR for selected child's latest session
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        if (session) {
          // If there's an active session, fetch alerts for it
          const unresolvedAlerts = await api.alerts.getUnresolved(session.session_id);
          setAlerts(unresolvedAlerts);
        } else if (selectedChild) {
          // If no active session but child is selected, fetch from their most recent session
          try {
            const sessions = await api.session.getByParentId(PARENT_ID);
            const childSessions = sessions.filter((s: { child_name: string }) => s.child_name === selectedChild.name);
            if (childSessions.length > 0) {
              // Get the most recent session
              const latestSession = childSessions.sort((a: { start_time: string }, b: { start_time: string }) =>
                new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
              )[0];
              const unresolvedAlerts = await api.alerts.getUnresolved(latestSession.session_id);
              setAlerts(unresolvedAlerts);
            }
          } catch (error) {
            console.error('Failed to fetch child sessions for alerts:', error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      }
    };

    // Initial fetch
    fetchAlerts();

    // Poll every 5 seconds for new alerts
    const interval = setInterval(fetchAlerts, 5000);

    return () => clearInterval(interval);
  }, [session, selectedChild]);

  const dismissAlert = (alertId: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleSelectChild = async (child: Child) => {
    setSelectedChild(child);
    setShowChildSelector(false);

    try {
      // Start session using the child's profile data
      // The backend will use child_id internally but we pass all the data
      await startSession(child.name, child.age, PARENT_ID, child.gender || null);

      // Show mode selector after session is created
      setShowModeSelector(true);
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Could not start session. Please try again.');
      setShowChildSelector(true);
    }
  };

  const handleSelectMode = async (mode: ActivityType) => {
    setCurrentActivity(mode);
    setShowModeSelector(false);

    // Log the selected activity
    if (session) {
      const descriptions: Record<ActivityType, string> = {
        [ActivityType.STORY_TIME]: `${session.child_name} listening to story time`,
        [ActivityType.I_SPY]: `Playing I Spy with ${session.child_name}`,
        [ActivityType.HOMEWORK_HELPER]: `Helping ${session.child_name} with homework`,
        [ActivityType.FREE_CHAT]: `Chatting with ${session.child_name}`,
      };

      try {
        console.log('Creating activity:', mode, 'for session:', session.session_id);
        const activity = await api.activities.create(
          session.session_id,
          mode,
          descriptions[mode] || `Started ${mode.replace('_', ' ')}`
        );
        console.log('Activity created successfully:', activity);
      } catch (err) {
        console.error('Failed to log activity:', err);
      }
    } else {
      console.error('Cannot create activity: no active session');
    }
  };

  const handleCreateChild = async (childData: ChildCreate) => {
    try {
      // Create child profile
      const newChild = await api.children.create(PARENT_ID, childData);

      // Automatically select and start session for new child
      await handleSelectChild(newChild);
    } catch (error) {
      console.error('Failed to create child:', error);
      throw error; // Re-throw to let ChildSelector handle the error
    }
  };

  const handleActivityChange = async (activity: ActivityType) => {
    setCurrentActivity(activity);

    // Log activity change with meaningful descriptions
    if (session) {
      const descriptions: Record<ActivityType, string> = {
        [ActivityType.STORY_TIME]: `${session.child_name} listening to story time`,
        [ActivityType.I_SPY]: `Playing I Spy with ${session.child_name}`,
        [ActivityType.HOMEWORK_HELPER]: `Helping ${session.child_name} with homework`,
        [ActivityType.FREE_CHAT]: `Chatting with ${session.child_name}`,
      };

      try {
        console.log('Switching to activity:', activity, 'for session:', session.session_id);
        const activityRecord = await api.activities.create(
          session.session_id,
          activity,
          descriptions[activity] || `Started ${activity.replace('_', ' ')}`
        );
        console.log('Activity logged successfully:', activityRecord);
      } catch (err) {
        console.error('Failed to log activity change:', err);
        // Don't block the UI if activity logging fails
      }
    } else {
      console.error('Cannot log activity change: no active session');
    }
  };

  // Child selection screen
  if (showChildSelector) {
    return (
      <ChildSelector
        parentId={PARENT_ID}
        onSelectChild={handleSelectChild}
        onCreateChild={handleCreateChild}
        onBack={() => navigate('/')}
      />
    );
  }

  // Mode selection screen (after child profile is selected)
  if (showModeSelector) {
    return <ModeSelector onSelectMode={handleSelectMode} />;
  }

  // Main interface - Teen theme (10+) vs Child theme
  if (isTeen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark via-dark-50 to-dark-100 flex flex-col relative overflow-hidden">
        {/* Alert Notifications */}
        {alerts.length > 0 && (
          <AlertContainer>
            {alerts.slice(0, 3).map((alert) => (
              <AlertNotification
                key={alert.id}
                message={alert.message}
                type={alert.alert_level === AlertLevel.EMERGENCY ? 'error' : alert.alert_level === AlertLevel.URGENT ? 'error' : alert.alert_level === AlertLevel.WARNING ? 'warning' : 'info'}
                duration={0}
                onDismiss={() => dismissAlert(alert.id)}
              />
            ))}
          </AlertContainer>
        )}

        {/* Ambient Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.2) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(255, 255, 255, 0.2) 2%, transparent 0%)',
            backgroundSize: '100px 100px'
          }}></div>
        </div>

        {/* Glassmorphic Header with Blur */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-glass">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-2xl shadow-lg shadow-neon-cyan/30 animate-glow">
                  🤖
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-geometric text-white tracking-tight">
                    Hey {session?.child_name}
                  </h1>
                  <p className="text-sm text-gray-400 font-geometric">AI Assistant Ready</p>
                </div>
              </div>

              <button
                onClick={async () => {
                  if (window.confirm('End session?')) {
                    await endSession();
                    navigate('/');
                  }
                }}
                className="px-4 py-2 rounded-lg backdrop-blur-lg bg-white/10 hover:bg-white/20 border border-white/10 text-white font-geometric text-sm font-medium transition-all hover:shadow-lg hover:shadow-neon-cyan/20"
              >
                Exit
              </button>
            </div>
          </div>
        </div>

        {/* Modern Activity Tabs */}
        <div className="backdrop-blur-lg bg-white/5 border-b border-white/10">
          <div className="container mx-auto px-6">
            <ActivitySelector
              onSelectActivity={handleActivityChange}
              currentActivity={currentActivity}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {currentActivity === ActivityType.STORY_TIME && <StoryTime />}
          {currentActivity === ActivityType.I_SPY && <ISpyGame />}
          {currentActivity === ActivityType.HOMEWORK_HELPER && <HomeworkHelper />}
          {currentActivity === ActivityType.FREE_CHAT && <FreeChat />}
        </div>

        {/* Panic Button - Sleek version */}
        <PanicButton
          size="large"
          position="fixed"
          emergencyContact={emergencyContact}
          childName={selectedChild?.name || session?.child_name}
          childId={selectedChild?.child_id}
          parentId={PARENT_ID}
        />
      </div>
    );
  }

  // Original child-friendly interface (under 10)
  return (
    <div className={`min-h-screen ${colors.background} flex flex-col`}>
      {/* Alert Notifications */}
      {alerts.length > 0 && (
        <AlertContainer>
          {alerts.slice(0, 3).map((alert) => (
            <AlertNotification
              key={alert.id}
              message={alert.message}
              type={alert.alert_level === AlertLevel.EMERGENCY ? 'error' : alert.alert_level === AlertLevel.URGENT ? 'error' : alert.alert_level === AlertLevel.WARNING ? 'warning' : 'info'}
              duration={0}
              onDismiss={() => dismissAlert(alert.id)}
            />
          ))}
        </AlertContainer>
      )}

      {/* Header */}
      <div className={`${colors.primary} text-white shadow-lg`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-child">
                Hi {session?.child_name}! 👋
              </h1>
              <p className="text-sm opacity-90">Your AI friend is here to help</p>
            </div>

            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to go back?')) {
                  await endSession();
                  navigate('/');
                }
              }}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg font-bold transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Activity Selector */}
      <div className="bg-white shadow-md">
        <ActivitySelector
          onSelectActivity={handleActivityChange}
          currentActivity={currentActivity}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentActivity === ActivityType.STORY_TIME && <StoryTime />}
        {currentActivity === ActivityType.I_SPY && <ISpyGame />}
        {currentActivity === ActivityType.HOMEWORK_HELPER && <HomeworkHelper />}
        {currentActivity === ActivityType.FREE_CHAT && <FreeChat />}
      </div>

      {/* Panic Button */}
      <PanicButton
        size="large"
        position="fixed"
        emergencyContact={emergencyContact}
        childName={selectedChild?.name || session?.child_name}
        childId={selectedChild?.child_id}
        parentId={PARENT_ID}
      />
    </div>
  );
};
