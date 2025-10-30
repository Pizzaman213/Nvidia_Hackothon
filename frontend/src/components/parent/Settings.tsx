// ============================================================================
// Settings - Parent configuration panel
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { ParentSettings, ActivityType } from '../../types';
import api from '../../services/api';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface SettingsProps {
  parentId: string;
}

export const Settings: React.FC<SettingsProps> = ({ parentId }) => {
  const [settings, setSettings] = useState<ParentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const toggleActivity = (activity: ActivityType) => {
    if (!settings) return;

    const allowed = settings.safety_settings.allowed_activities;
    const newAllowed = allowed.includes(activity)
      ? allowed.filter((a) => a !== activity)
      : [...allowed, activity];

    setSettings({
      ...settings,
      safety_settings: {
        ...settings.safety_settings,
        allowed_activities: newAllowed,
      },
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Settings</h2>

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

      {/* Child Information */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Child Information</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Child Name</label>
            <input
              type="text"
              value={settings.child_name}
              onChange={(e) => setSettings({ ...settings, child_name: e.target.value })}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Child Age</label>
            <input
              type="number"
              min="3"
              max="18"
              value={settings.child_age}
              onChange={(e) =>
                setSettings({ ...settings, child_age: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Allowed Activities */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Allowed Activities</h3>

        <div className="grid grid-cols-2 gap-3">
          {Object.values(ActivityType).map((activity) => (
            <label
              key={activity}
              className="flex items-center gap-3 p-3 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={settings.safety_settings.allowed_activities.includes(activity)}
                onChange={() => toggleActivity(activity)}
                className="w-5 h-5"
              />
              <span className="capitalize font-semibold">
                {activity.replace('_', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Safety Settings */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Safety Settings</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Session Timeout (minutes)
            </label>
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
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Content Filter Level
            </label>
            <select
              value={settings.safety_settings.content_filter_level}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  safety_settings: {
                    ...settings.safety_settings,
                    content_filter_level: e.target.value as 'strict' | 'moderate' | 'relaxed',
                  },
                })
              }
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="strict">Strict</option>
              <option value="moderate">Moderate</option>
              <option value="relaxed">Relaxed</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
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
                className="w-5 h-5"
              />
              <span className="font-semibold">Enable Camera</span>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
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
                className="w-5 h-5"
              />
              <span className="font-semibold">Enable Microphone</span>
            </label>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Emergency Contact</h3>

        <div>
          <label className="block text-sm font-semibold mb-2">Phone Number</label>
          <input
            type="tel"
            value={settings.safety_settings.emergency_contact}
            onChange={(e) =>
              setSettings({
                ...settings,
                safety_settings: {
                  ...settings.safety_settings,
                  emergency_contact: e.target.value,
                },
              })
            }
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            placeholder="+1 (555) 123-4567"
          />
        </div>
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
  );
};
