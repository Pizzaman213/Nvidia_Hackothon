// ============================================================================
// Dashboard - Modern Dark Theme Parent Dashboard with Glassmorphism
// ============================================================================

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParent } from '../../contexts/ParentContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';

// Lazy load tab components for better performance
const AlertPanel = lazy(() => import('./AlertPanel').then(module => ({ default: module.AlertPanel })));
const ActivityLog = lazy(() => import('./ActivityLog').then(module => ({ default: module.ActivityLog })));
const Settings = lazy(() => import('./Settings').then(module => ({ default: module.Settings })));
const ParentAssistant = lazy(() => import('./ParentAssistant').then(module => ({ default: module.ParentAssistant })));
const ChildrenManager = lazy(() => import('./ChildrenManager').then(module => ({ default: module.ChildrenManager })));
const CitationsPanel = lazy(() => import('./CitationsPanel'));

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { parentId, selectedChild, selectChild, activeSession } = useParent();
  const { parentTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'children' | 'alerts' | 'activities' | 'assistant' | 'citations' | 'settings'>('children');

  // Determine theme classes based on parentTheme
  const isLight = parentTheme === 'light';
  const bgClass = isLight ? 'bg-gray-50' : 'bg-dark';
  const gridClass = isLight ? 'grid-bg-light' : 'grid-bg';
  const glassClass = isLight ? 'glass-light' : 'glass-dark';
  const textSecondaryClass = isLight ? 'text-gray-600' : 'text-gray-400';
  const borderClass = isLight ? 'border-gray-200' : 'border-white/10';

  // Auto-switch to children tab if no child is selected
  useEffect(() => {
    if (!selectedChild && activeTab !== 'children' && activeTab !== 'settings') {
      setActiveTab('children');
    }
  }, [selectedChild, activeTab]);

  // If no parent ID, redirect to login
  useEffect(() => {
    if (!parentId) {
      navigate('/');
    }
  }, [parentId, navigate]);

  // Don't render if no parent ID (while redirecting)
  if (!parentId) {
    return null;
  }

  const tabs = [
    {
      id: 'children' as const,
      label: 'Children',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'alerts' as const,
      label: 'Alerts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      id: 'activities' as const,
      label: 'Activities',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      id: 'assistant' as const,
      label: 'AI Assistant',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      id: 'citations' as const,
      label: 'Sources',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      id: 'settings' as const,
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className={`min-h-screen ${bgClass} ${gridClass}`}>
      {/* Modern Header with Glassmorphism */}
      <div className={`${glassClass} border-b ${borderClass} sticky top-0 z-50 backdrop-blur-xl`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Child Info */}
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-16 w-auto object-contain cursor-pointer transition-transform hover:scale-105"
                onClick={() => navigate('/')}
                title="Return to Home"
              />
              {selectedChild && (
                <div className="flex items-center gap-2">
                  {selectedChild.profile_picture_url ? (
                    <img
                      src={selectedChild.profile_picture_url}
                      alt={`${selectedChild.name}'s profile`}
                      className="w-6 h-6 rounded-full object-cover border border-gray-300"
                    />
                  ) : (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: selectedChild.avatar_color }}
                    >
                      {selectedChild.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <p className={`text-sm ${textSecondaryClass} font-mono`}>
                    {selectedChild.name} • {selectedChild.age} years old
                  </p>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                // Clear parent data and redirect to login
                localStorage.removeItem('parent_id');
                localStorage.removeItem('parent_selected_child_id');
                navigate('/');
              }}
              className={`px-4 py-2 rounded-lg ${isLight ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-white/10 hover:bg-white/20 text-white'} transition-all flex items-center gap-2`}
              title="Logout and return to login screen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modern Tab Navigation with Floating Effect - Only show if child is selected */}
      {selectedChild && (
        <div className="container mx-auto px-6 pt-6">
          <div className={`${glassClass} rounded-2xl p-2 inline-flex gap-2 animate-fade-in`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 font-geometric
                  ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white shadow-lg hover-glow-cyan'
                      : isLight
                      ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <span className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : ''}`}>
                  {tab.icon}
                </span>
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Area with Smooth Animation */}
      <div className="container mx-auto px-6 py-8">
        <div className="animate-fade-in">
          <Suspense fallback={
            <div className={`${glassClass} rounded-2xl p-12 flex items-center justify-center min-h-[400px]`}>
              <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="large" />
                <p className={`${textSecondaryClass} text-sm font-mono`}>Loading...</p>
              </div>
            </div>
          }>
            {activeTab === 'children' && (
              <ChildrenManager
                parentId={parentId}
                onSelectChild={selectChild}
                selectedChild={selectedChild}
              />
            )}
            {activeTab === 'alerts' && selectedChild && (
              <AlertPanel
                sessionId={activeSession?.session_id}
                childName={selectedChild.name}
                parentId={parentId}
              />
            )}
            {activeTab === 'activities' && selectedChild && (
              <ActivityLog
                sessionId={activeSession?.session_id}
                childName={selectedChild.name}
                parentId={parentId}
              />
            )}
            {activeTab === 'assistant' && selectedChild && (
              <ParentAssistant
                sessionId={activeSession?.session_id || ''}
                childName={selectedChild.name}
                childAge={selectedChild.age}
              />
            )}
            {activeTab === 'citations' && selectedChild && (
              <CitationsPanel
                childId={selectedChild.id.toString()}
                sessionId={activeSession?.session_id}
              />
            )}
            {activeTab === 'settings' && <Settings parentId={parentId} />}
          </Suspense>
        </div>
      </div>
    </div>
  );
};
