// ============================================================================
// Dashboard - Parent overview page
// ============================================================================

import React, { useState } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { AlertPanel } from './AlertPanel';
import { ActivityLog } from './ActivityLog';
import { Settings } from './Settings';
import { ParentAssistant } from './ParentAssistant';

export const Dashboard: React.FC = () => {
  const { session } = useSession();
  const [activeTab, setActiveTab] = useState<'alerts' | 'activities' | 'assistant' | 'settings'>('alerts');

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-xl text-gray-700">No active session</p>
          <p className="text-sm text-gray-500 mt-2">
            Start a session from the child interface first
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-parent-primary text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Parent Dashboard</h1>
          <p className="text-sm opacity-90 mt-1">
            Monitoring session for {session.child_name}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`
                py-4 px-6 font-semibold transition-colors border-b-4
                ${
                  activeTab === 'alerts'
                    ? 'border-parent-primary text-parent-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              🚨 Alerts
            </button>

            <button
              onClick={() => setActiveTab('activities')}
              className={`
                py-4 px-6 font-semibold transition-colors border-b-4
                ${
                  activeTab === 'activities'
                    ? 'border-parent-primary text-parent-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              📋 Activity Log
            </button>

            <button
              onClick={() => setActiveTab('assistant')}
              className={`
                py-4 px-6 font-semibold transition-colors border-b-4
                ${
                  activeTab === 'assistant'
                    ? 'border-parent-primary text-parent-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              🤖 AI Assistant
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`
                py-4 px-6 font-semibold transition-colors border-b-4
                ${
                  activeTab === 'settings'
                    ? 'border-parent-primary text-parent-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              ⚙️ Settings
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {activeTab === 'alerts' && <AlertPanel sessionId={session.session_id} />}
        {activeTab === 'activities' && <ActivityLog sessionId={session.session_id} />}
        {activeTab === 'assistant' && (
          <ParentAssistant
            sessionId={session.session_id}
            childName={session.child_name}
            childAge={session.child_age}
          />
        )}
        {activeTab === 'settings' && <Settings parentId={session.parent_id} />}
      </div>
    </div>
  );
};
