// ============================================================================
// Settings - Parent configuration panel
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { ParentSettings } from '../../types';
import api from '../../services/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { useTheme } from '../../contexts/ThemeContext';

interface SettingsProps {
  parentId: string;
}

export const Settings: React.FC<SettingsProps> = ({ parentId }) => {
  const { parentTheme, setParentTheme, savePreferences } = useTheme();
  const [settings, setSettings] = useState<ParentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Theme-aware classes (defined early so they can be used in all render states)
  const isLight = parentTheme === 'light';
  const cardClass = isLight ? 'bg-white' : 'glass-dark';
  const textPrimaryClass = isLight ? 'text-gray-800' : 'text-white';
  const textSecondaryClass = isLight ? 'text-gray-600' : 'text-gray-400';
  const borderClass = isLight ? 'border-gray-200' : 'border-white/10';
  const inputClass = isLight
    ? 'bg-white border-gray-300 text-gray-900'
    : 'bg-white/5 border-white/20 text-white';

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.settings.get(parentId);

      // Handle both old flat structure and new nested structure from backend
      // Old: { allowed_activities, camera_enabled, ... }
      // New: { safety_settings: { allowed_activities, enable_camera, ... }, ... }
      const normalizedData: ParentSettings = (data as any).safety_settings
        ? data // Already in new format
        : {
            // Convert old flat format to new nested format
            parent_id: (data as any).parent_id || parentId,
            child_name: (data as any).child_name || '',
            child_age: (data as any).child_age || 8,
            safety_settings: {
              allowed_activities: (data as any).allowed_activities || [],
              quiet_hours_start: undefined,
              quiet_hours_end: undefined,
              emergency_contact: (data as any).emergency_contact || '',
              enable_camera: (data as any).camera_enabled ?? true,
              enable_microphone: (data as any).microphone_enabled ?? true,
              session_timeout_minutes: (data as any).session_timeout_minutes || 120,
              content_filter_level: (data as any).content_filter_level || 'moderate',
            },
            notification_preferences: {
              email: true,
              push: true,
              alert_threshold: 'medium' as any,
            },
          };

      setSettings(normalizedData);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    fetchSettings();
  }, [parentId, fetchSettings]);

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      await api.settings.update(parentId, settings);

      // Save theme preferences
      try {
        await savePreferences();
      } catch (themeErr) {
        console.warn('Theme preferences saved locally but not to backend:', themeErr);
      }

      setSuccessMessage('Settings saved successfully!');

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`${cardClass} rounded-lg shadow-lg p-6`}>
        <LoadingSpinner message="Loading settings..." />
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="bg-red-100 border-2 border-red-400 rounded-lg p-6">
        <p className="text-red-700 font-semibold">{error}</p>
      </div>
    );
  }

  if (!settings) return null;

  // Background class to match dashboard
  const bgClass = isLight ? 'bg-gray-50' : 'bg-dark';

  return (
    <div className={`flex flex-col h-full max-h-[80vh] overflow-hidden ${bgClass} rounded-lg p-4`}>
      {/* Fixed Header */}
      <div className={`flex-shrink-0 pb-4 border-b ${borderClass} mb-4`}>
        <h2 className={`text-2xl font-bold ${textPrimaryClass}`}>Settings</h2>
        <p className={`text-sm ${textSecondaryClass} mt-1`}>Configure activities, safety, and permissions</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 space-y-4 scroll-smooth"
           style={{ scrollbarWidth: 'thin', scrollbarColor: isLight ? '#cbd5e0 #f7fafc' : 'rgba(255,255,255,0.2) transparent' }}>
        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4">
            <p className="text-green-700 font-semibold">✓ {successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {/* Theme Settings */}
        <div className={`${cardClass} rounded-lg shadow-lg p-4`}>
          <h3 className={`text-lg font-bold mb-3 ${textPrimaryClass}`}>Dashboard Theme</h3>
          <p className={`text-xs ${textSecondaryClass} mb-3`}>
            Choose how the parent dashboard appears
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Dark Theme Option */}
            <button
              onClick={() => setParentTheme('dark')}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${
                  parentTheme === 'dark'
                    ? 'border-blue-500 bg-blue-50'
                    : isLight
                    ? 'border-gray-300 hover:border-gray-400'
                    : 'border-white/20 hover:border-white/30'
                }
              `}
            >
              <div className="flex flex-col items-center gap-2">
                {/* Dark Theme Preview */}
                <div className="w-full h-16 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow relative overflow-hidden">
                  <div className="absolute top-1 left-1 right-1 h-2 bg-white/10 rounded" />
                  <div className="absolute top-5 left-1 right-1 h-6 bg-gradient-to-r from-cyan-400 to-purple-500 rounded" />
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <svg className={`w-4 h-4 ${textPrimaryClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    <span className={`font-bold text-sm ${textPrimaryClass}`}>Dark</span>
                  </div>
                </div>

                {parentTheme === 'dark' && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>

            {/* Light Theme Option */}
            <button
              onClick={() => setParentTheme('light')}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${
                  parentTheme === 'light'
                    ? 'border-blue-500 bg-blue-50'
                    : isLight
                    ? 'border-gray-300 hover:border-gray-400'
                    : 'border-white/20 hover:border-white/30'
                }
              `}
            >
              <div className="flex flex-col items-center gap-2">
                {/* Light Theme Preview */}
                <div className="w-full h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow relative overflow-hidden border border-gray-200">
                  <div className="absolute top-1 left-1 right-1 h-2 bg-gray-300 rounded" />
                  <div className="absolute top-5 left-1 right-1 h-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded" />
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <svg className={`w-4 h-4 ${textPrimaryClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className={`font-bold text-sm ${textPrimaryClass}`}>Light</span>
                  </div>
                </div>

                {parentTheme === 'light' && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Session & Safety Settings */}
        <div className={`${cardClass} rounded-lg shadow-lg p-4`}>
          <h3 className={`text-lg font-bold mb-3 ${textPrimaryClass}`}>Session & Safety</h3>

          <div className="space-y-3">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${textPrimaryClass}`}>
                Session Timeout (minutes)
              </label>
              <p className={`text-xs ${textSecondaryClass} mb-2`}>Sessions will automatically end after this duration</p>
              <input
                type="number"
                min="5"
                max="240"
                value={settings.safety_settings.session_timeout_minutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    safety_settings: {
                      ...settings.safety_settings,
                      session_timeout_minutes: parseInt(e.target.value),
                    },
                  })
                }
                className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:border-blue-500 focus:outline-none ${inputClass}`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${textPrimaryClass}`}>
                Content Filter Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['strict', 'moderate', 'relaxed'] as const).map((level) => {
                  const isSelected = settings.safety_settings.content_filter_level === level;
                  return (
                    <button
                      key={level}
                      onClick={() =>
                        setSettings({
                          ...settings,
                          safety_settings: {
                            ...settings.safety_settings,
                            content_filter_level: level,
                          },
                        })
                      }
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-colors capitalize ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : isLight
                          ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          : `border-white/20 ${textPrimaryClass} hover:bg-white/5`
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Device Permissions */}
        <div className={`${cardClass} rounded-lg shadow-lg p-4`}>
          <h3 className={`text-lg font-bold mb-3 ${textPrimaryClass}`}>Device Permissions</h3>

          <div className="space-y-2.5">
            <label className={`flex items-center gap-3 p-3 border-2 ${borderClass} rounded-lg cursor-pointer transition-colors ${isLight ? 'hover:bg-gray-50' : 'hover:bg-white/5'}`}>
              <input
                type="checkbox"
                checked={settings.safety_settings.enable_camera}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    safety_settings: {
                      ...settings.safety_settings,
                      enable_camera: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-lg">📸</span>
              <span className={`text-sm font-semibold ${textPrimaryClass}`}>Enable Camera</span>
            </label>

            <label className={`flex items-center gap-3 p-3 border-2 ${borderClass} rounded-lg cursor-pointer transition-colors ${isLight ? 'hover:bg-gray-50' : 'hover:bg-white/5'}`}>
              <input
                type="checkbox"
                checked={settings.safety_settings.enable_microphone}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    safety_settings: {
                      ...settings.safety_settings,
                      enable_microphone: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-lg">🎤</span>
              <span className={`text-sm font-semibold ${textPrimaryClass}`}>Enable Microphone</span>
            </label>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className={`${cardClass} rounded-lg shadow-lg p-4`}>
          <h3 className={`text-lg font-bold mb-3 ${textPrimaryClass}`}>Quiet Hours (Optional)</h3>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${textPrimaryClass}`}>Start Time</label>
              <input
                type="time"
                value={settings.safety_settings.quiet_hours_start || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    safety_settings: {
                      ...settings.safety_settings,
                      quiet_hours_start: e.target.value || undefined,
                    },
                  })
                }
                className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:border-blue-500 focus:outline-none ${inputClass}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${textPrimaryClass}`}>End Time</label>
              <input
                type="time"
                value={settings.safety_settings.quiet_hours_end || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    safety_settings: {
                      ...settings.safety_settings,
                      quiet_hours_end: e.target.value || undefined,
                    },
                  })
                }
                className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:border-blue-500 focus:outline-none ${inputClass}`}
              />
            </div>
          </div>
          <p className={`text-xs ${textSecondaryClass}`}>No notifications during quiet hours</p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg shadow-lg transform transition-all hover:scale-105 active:scale-95"
        >
          {saving ? 'Saving...' : '💾 Save Settings'}
        </button>
      </div>
    </div>
  );
};
