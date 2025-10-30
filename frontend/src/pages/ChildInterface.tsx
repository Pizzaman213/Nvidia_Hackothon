// ============================================================================
// ChildInterface - Main interface for children
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import { ActivityType } from '../types';
import { VoiceChat } from '../components/child/VoiceChat';
import { CameraCapture } from '../components/child/CameraCapture';
import { ActivitySelector } from '../components/child/ActivitySelector';
import { PanicButton } from '../components/child/PanicButton';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export const ChildInterface: React.FC = () => {
  const { session, startSession } = useSession();
  const navigate = useNavigate();

  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState(8);
  const [currentActivity, setCurrentActivity] = useState<ActivityType>(ActivityType.FREE_CHAT);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraContext, setCameraContext] = useState('');

  useEffect(() => {
    // If session already exists, skip setup
    if (session) {
      setIsSetupComplete(true);
    }
  }, [session]);

  const handleStartSession = async () => {
    if (!childName.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      await startSession(childName, childAge, 'demo-parent-id');
      setIsSetupComplete(true);
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Could not start session. Please try again.');
    }
  };

  const handleActivityChange = (activity: ActivityType) => {
    setCurrentActivity(activity);
    setShowCamera(false);

    // Log activity change
    if (session) {
      api.activities.create(
        session.session_id,
        activity,
        `Started ${activity.replace('_', ' ')}`
      );
    }
  };

  const handleCameraRequired = () => {
    setShowCamera(true);
    setCameraContext(currentActivity);
  };

  const handlePhotoCapture = async (imageData: string) => {
    if (!session) return;

    try {
      const response = await api.image.analyze({
        image: imageData,
        context: cameraContext,
        session_id: session.session_id,
      });

      console.log('Image analysis:', response);
      alert(`AI says: ${response.analysis}`);

      if (response.safety_alert) {
        console.warn('Safety alert:', response.safety_alert);
      }

      setShowCamera(false);
    } catch (error) {
      console.error('Failed to analyze image:', error);
      alert('Could not analyze photo. Please try again.');
    }
  };

  // Setup screen
  if (!isSetupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-child-bg via-pink-100 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-7xl mb-4">👋</div>
            <h1 className="text-4xl font-bold text-child-primary font-child mb-2">
              Hi there!
            </h1>
            <p className="text-xl text-gray-600 font-child">
              Let's get to know each other
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2 font-child">
                What's your name?
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleStartSession();
                }}
                className="w-full px-4 py-3 border-4 border-child-primary rounded-xl text-xl font-child focus:outline-none focus:ring-4 focus:ring-child-accent"
                placeholder="Your name"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2 font-child">
                How old are you?
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="3"
                  max="18"
                  value={childAge}
                  onChange={(e) => setChildAge(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-3xl font-bold text-child-primary w-16 text-center">
                  {childAge}
                </span>
              </div>
            </div>

            <button
              onClick={handleStartSession}
              className="w-full bg-child-primary hover:bg-pink-500 text-white font-bold py-4 px-6 rounded-xl text-xl shadow-lg transform transition-all hover:scale-105 active:scale-95 font-child"
            >
              Let's Go! 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main interface
  return (
    <div className="min-h-screen bg-child-bg flex flex-col">
      {/* Header */}
      <div className="bg-child-primary text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-child">
                Hi {session?.child_name}! 👋
              </h1>
              <p className="text-sm opacity-90">Your AI friend is here to help</p>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to go back?')) {
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
        {showCamera ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <CameraCapture onPhotoCapture={handlePhotoCapture} context={cameraContext} />
              <button
                onClick={() => setShowCamera(false)}
                className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl font-child"
              >
                ← Back to Chat
              </button>
            </div>
          </div>
        ) : (
          <VoiceChat
            activityType={currentActivity}
            onCameraRequired={handleCameraRequired}
          />
        )}
      </div>

      {/* Panic Button */}
      <PanicButton size="large" position="fixed" />
    </div>
  );
};
