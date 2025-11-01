/**
 * Child Settings Modal Component
 *
 * Allows parents to configure per-child settings including:
 * - Allowed activities
 * - Session timeout
 * - Content filter level
 * - Camera/microphone permissions
 * - Quiet hours
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Child, ChildSettings, ChildSettingsUpdate, ActivityType } from '../../types';
import api from '../../services/api';
import { logger, LogCategory } from '../../utils/logger';
import { useTheme } from '../../contexts/ThemeContext';

interface ChildSettingsModalProps {
  child: Child;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (settings: ChildSettings) => void;
  onDelete?: (childId: string) => void;
}

const ACTIVITY_OPTIONS = [
  { value: 'story_time' as ActivityType, label: 'Story Time', icon: '📚' },
  { value: 'i_spy' as ActivityType, label: 'I Spy', icon: '🔍' },
  { value: 'homework_helper' as ActivityType, label: 'Homework Helper', icon: '✏️' },
  { value: 'free_chat' as ActivityType, label: 'Free Chat', icon: '💬' },
];

const ChildSettingsModal: React.FC<ChildSettingsModalProps> = ({ child, isOpen, onClose, onSave, onDelete }) => {
  const { parentTheme } = useTheme();
  const [settings, setSettings] = useState<ChildSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Profile editing state
  const [childName, setChildName] = useState(child.name);
  const [childAge, setChildAge] = useState(child.age);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(child.profile_picture_url || null);

  // Theme-aware classes
  const isLight = parentTheme === 'light';
  const bgClass = isLight ? 'bg-white' : 'bg-dark-100';
  const textPrimaryClass = isLight ? 'text-gray-900' : 'text-white';
  const textSecondaryClass = isLight ? 'text-gray-600' : 'text-gray-400';
  const borderClass = isLight ? 'border-gray-200' : 'border-white/10';
  const inputClass = isLight
    ? 'bg-white border-gray-300 text-gray-900'
    : 'bg-white/5 border-white/20 text-white';
  const cardClass = isLight ? 'bg-white' : 'glass-dark';

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      logger.debug(LogCategory.UI, `Loading settings for child: ${child.name}`);
      const childSettings = await api.childSettings.get(child.child_id);
      setSettings(childSettings);
      logger.debug(LogCategory.UI, 'Child settings loaded', childSettings);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load settings';
      setError(errorMsg);
      logger.error(LogCategory.UI, 'Failed to load child settings', err as Error);
    } finally {
      setLoading(false);
    }
  }, [child]);

  // Load settings when modal opens
  useEffect(() => {
    if (isOpen && child) {
      loadSettings();
    }
  }, [isOpen, child, loadSettings]);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setError(null);

    try {
      logger.info(LogCategory.UI, `Saving settings for child: ${child.name}`, settings);

      // Update child profile if name or age changed
      if (childName !== child.name || childAge !== child.age) {
        await api.children.update(child.child_id, {
          name: childName,
          age: childAge,
          gender: child.gender,
          avatar_color: child.avatar_color,
        });
      }

      // Upload profile picture if changed
      if (profilePicture) {
        await api.children.uploadProfilePicture(child.child_id, profilePicture);
      }

      // Update settings
      const update: ChildSettingsUpdate = {
        allowed_activities: settings.allowed_activities,
        session_timeout_minutes: settings.session_timeout_minutes,
        content_filter_level: settings.content_filter_level,
        enable_camera: settings.enable_camera,
        enable_microphone: settings.enable_microphone,
        quiet_hours_start: settings.quiet_hours_start,
        quiet_hours_end: settings.quiet_hours_end,
      };

      const updatedSettings = await api.childSettings.update(child.child_id, update);
      setSettings(updatedSettings);

      logger.info(LogCategory.UI, 'Child settings saved successfully');

      if (onSave) {
        onSave(updatedSettings);
      }

      // Show success message briefly then close
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMsg);
      logger.error(LogCategory.UI, 'Failed to save child settings', err as Error);
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleActivity = (activity: ActivityType) => {
    if (!settings) return;

    const newActivities = settings.allowed_activities.includes(activity)
      ? settings.allowed_activities.filter(a => a !== activity)
      : [...settings.allowed_activities, activity];

    setSettings({
      ...settings,
      allowed_activities: newActivities,
    });
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    try {
      logger.info(LogCategory.UI, `Deleting child: ${child.name}`);
      await api.children.delete(child.child_id);
      onDelete(child.child_id);
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete child profile';
      setError(errorMsg);
      logger.error(LogCategory.UI, 'Failed to delete child', err as Error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${bgClass} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`sticky top-0 ${bgClass} border-b ${borderClass} px-6 py-4 flex items-center justify-between`}>
          <div>
            <h2 className={`text-2xl font-bold ${textPrimaryClass}`}>Settings for {child.name}</h2>
            <p className={`text-sm ${textSecondaryClass} mt-1`}>Configure activities, safety, and permissions</p>
          </div>
          <button
            onClick={onClose}
            className={`${textSecondaryClass} hover:${textPrimaryClass} text-2xl leading-none`}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className={`ml-3 ${textSecondaryClass}`}>Loading settings...</span>
            </div>
          ) : error && !settings ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-semibold">Error loading settings</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={loadSettings}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : settings ? (
            <div className="space-y-6">
              {/* Error display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                  <p className="font-semibold">Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              )}

              {/* Profile Information */}
              <div className={`${isLight ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200' : 'glass-dark border-2 border-white/10'} rounded-lg p-4`}>
                <h3 className={`text-lg font-bold ${textPrimaryClass} mb-4`}>Profile Information</h3>

                {/* Profile Picture */}
                <div className="mb-4">
                  <label className={`block text-sm font-semibold ${textPrimaryClass} mb-2`}>Profile Picture</label>
                  <div className="flex items-center gap-4">
                    {/* Preview */}
                    <div className="flex-shrink-0">
                      {profilePicturePreview ? (
                        <img
                          src={profilePicturePreview}
                          alt="Profile preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                        />
                      ) : (
                        <div
                          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl text-white font-bold"
                          style={{ backgroundColor: child.avatar_color }}
                        >
                          {childName ? childName[0].toUpperCase() : '?'}
                        </div>
                      )}
                    </div>

                    {/* Upload Button */}
                    <div className="flex-1">
                      <label className={`cursor-pointer inline-flex items-center px-4 py-2 ${isLight ? 'bg-blue-100 border border-blue-300 text-blue-700 hover:bg-blue-200' : 'bg-blue-500/20 border border-blue-400/30 text-blue-300 hover:bg-blue-500/30'} rounded-lg transition-colors`}>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {profilePicture ? 'Change Photo' : 'Upload Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                        />
                      </label>
                      {profilePicture && (
                        <p className={`text-xs ${textSecondaryClass} mt-1`}>
                          {profilePicture.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name and Age */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold ${textPrimaryClass} mb-2`}>Name</label>
                    <input
                      type="text"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold ${textPrimaryClass} mb-2`}>Age</label>
                    <input
                      type="number"
                      min="1"
                      max="18"
                      value={childAge}
                      onChange={(e) => setChildAge(parseInt(e.target.value) || 5)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClass}`}
                    />
                  </div>
                </div>
              </div>

              {/* Allowed Activities */}
              <div>
                <label className={`block text-sm font-semibold ${textPrimaryClass} mb-3`}>
                  Allowed Activities
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {ACTIVITY_OPTIONS.map((activity) => {
                    const isAllowed = settings.allowed_activities.includes(activity.value);
                    return (
                      <button
                        key={activity.value}
                        onClick={() => toggleActivity(activity.value)}
                        className={`
                          flex items-center p-4 rounded-lg border-2 transition-all
                          ${isAllowed
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : isLight
                            ? 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            : `border-white/20 ${cardClass} ${textPrimaryClass} hover:border-white/30`
                          }
                        `}
                      >
                        <span className="text-2xl mr-3">{activity.icon}</span>
                        <span className="font-medium">{activity.label}</span>
                        {isAllowed && (
                          <span className="ml-auto text-blue-600">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Session Timeout */}
              <div>
                <label className={`block text-sm font-semibold ${textPrimaryClass} mb-2`}>
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={settings.session_timeout_minutes}
                  onChange={(e) => setSettings({
                    ...settings,
                    session_timeout_minutes: parseInt(e.target.value) || 120
                  })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClass}`}
                />
                <p className={`text-xs ${textSecondaryClass} mt-1`}>
                  Sessions will automatically end after this duration
                </p>
              </div>

              {/* Content Filter Level */}
              <div>
                <label className={`block text-sm font-semibold ${textPrimaryClass} mb-2`}>
                  Content Filter Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['strict', 'moderate', 'relaxed'] as const).map((level) => {
                    const isSelected = settings.content_filter_level === level;
                    return (
                      <button
                        key={level}
                        onClick={() => setSettings({ ...settings, content_filter_level: level })}
                        className={`
                          p-3 rounded-lg border-2 font-medium transition-all capitalize
                          ${isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : isLight
                            ? 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            : `border-white/20 ${cardClass} ${textPrimaryClass} hover:border-white/30`
                          }
                        `}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Device Permissions */}
              <div>
                <label className={`block text-sm font-semibold ${textPrimaryClass} mb-3`}>
                  Device Permissions
                </label>
                <div className="space-y-3">
                  <label className={`flex items-center p-4 rounded-lg cursor-pointer ${isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white/5 hover:bg-white/10'}`}>
                    <input
                      type="checkbox"
                      checked={settings.enable_camera}
                      onChange={(e) => setSettings({ ...settings, enable_camera: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className={`ml-3 ${textPrimaryClass} font-medium`}>📸 Enable Camera</span>
                  </label>

                  <label className={`flex items-center p-4 rounded-lg cursor-pointer ${isLight ? 'bg-gray-50 hover:bg-gray-100' : 'bg-white/5 hover:bg-white/10'}`}>
                    <input
                      type="checkbox"
                      checked={settings.enable_microphone}
                      onChange={(e) => setSettings({ ...settings, enable_microphone: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className={`ml-3 ${textPrimaryClass} font-medium`}>🎤 Enable Microphone</span>
                  </label>
                </div>
              </div>

              {/* Quiet Hours (Optional) */}
              <div>
                <label className={`block text-sm font-semibold ${textPrimaryClass} mb-2`}>
                  Quiet Hours (Optional)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs ${textSecondaryClass} mb-1`}>Start Time</label>
                    <input
                      type="time"
                      value={settings.quiet_hours_start || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        quiet_hours_start: e.target.value || null
                      })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs ${textSecondaryClass} mb-1`}>End Time</label>
                    <input
                      type="time"
                      value={settings.quiet_hours_end || ''}
                      onChange={(e) => setSettings({
                        ...settings,
                        quiet_hours_end: e.target.value || null
                      })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClass}`}
                    />
                  </div>
                </div>
                <p className={`text-xs ${textSecondaryClass} mt-1`}>
                  No notifications during quiet hours
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!loading && settings && (
          <div className={`sticky bottom-0 ${isLight ? 'bg-gray-50' : 'bg-dark-50'} border-t ${borderClass} px-6 py-4`}>
            {/* Delete Confirmation */}
            {showDeleteConfirm ? (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
                <p className="text-red-800 font-semibold mb-3">
                  ⚠️ Are you sure you want to delete {child.name}'s profile?
                </p>
                <p className="text-red-700 text-sm mb-4">
                  This will permanently delete all sessions, activities, and settings. This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                  >
                    Yes, Delete Profile
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving}
                className="px-6 py-2 border-2 border-red-300 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                🗑️ Delete Profile
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className={`px-6 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${isLight ? 'border-gray-300 text-gray-700 hover:bg-gray-100' : 'border-white/20 text-white hover:bg-white/10'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildSettingsModal;
