import React, { useState, useEffect, useCallback } from 'react';
import { Child, ChildCreate, ChildSummary } from '../../types';
import { api } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import ChildSettingsModal from './ChildSettingsModal';

interface ChildrenManagerProps {
  parentId: string;
  onSelectChild?: (child: Child | null) => void;
  selectedChild?: Child | null;
}

const AVATAR_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export const ChildrenManager: React.FC<ChildrenManagerProps> = ({ parentId, onSelectChild, selectedChild }) => {
  const { parentTheme } = useTheme();
  const [children, setChildren] = useState<Child[]>([]);
  const [childSummaries, setChildSummaries] = useState<Map<string, ChildSummary>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [settingsChild, setSettingsChild] = useState<Child | null>(null);
  const [formData, setFormData] = useState<ChildCreate>({
    name: '',
    age: 5,
    gender: null,
    avatar_color: AVATAR_COLORS[0],
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Theme variables
  const isLight = parentTheme === 'light';
  const glassClass = isLight ? 'glass-light' : 'glass-dark';
  const textPrimaryClass = isLight ? 'text-gray-800' : 'text-white';
  const textSecondaryClass = isLight ? 'text-gray-600' : 'text-gray-400';
  const borderClass = isLight ? 'border-gray-200' : 'border-white/10';
  const cardBgClass = isLight ? 'bg-white border border-gray-200' : 'glass-dark border border-white/10';
  const formBgClass = isLight ? 'bg-white border-2 border-blue-200' : 'glass-dark border border-neon-cyan/30';
  const inputBgClass = isLight ? 'bg-white border-gray-300' : 'bg-white/5 border-white/20 text-white';
  const labelClass = isLight ? 'text-gray-700' : 'text-gray-300';

  const loadChildren = useCallback(async () => {
    try {
      setLoading(true);

      // First, try to auto-discover children from existing sessions
      try {
        await api.children.autoDiscover(parentId);
      } catch (error) {
        console.log('Auto-discovery failed or no new children found:', error);
      }

      // Then load all children
      const childrenData = await api.children.getAll(parentId);
      setChildren(childrenData);

      // Load summaries for each child
      const summaries = new Map<string, ChildSummary>();
      await Promise.all(
        childrenData.map(async (child) => {
          try {
            const summary = await api.children.getSummary(child.child_id);
            summaries.set(child.child_id, summary);
          } catch (error) {
            console.error(`Failed to load summary for ${child.name}:`, error);
          }
        })
      );
      setChildSummaries(summaries);
    } catch (error) {
      console.error('Failed to load children:', error);
    } finally {
      setLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    loadChildren();

    // Auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      loadChildren();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [loadChildren]);

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

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formData.name.trim()) {
      alert('Please enter a name for the child');
      return;
    }

    try {
      const newChild = await api.children.create(parentId, formData);

      // Upload profile picture if selected
      if (profilePicture && newChild.child_id) {
        setUploadingPicture(true);
        try {
          await api.children.uploadProfilePicture(newChild.child_id, profilePicture);
        } catch (error) {
          console.error('Failed to upload profile picture:', error);
          alert('Child profile created, but failed to upload profile picture. You can try uploading it again by editing the profile.');
          // Continue anyway, child is created
        } finally {
          setUploadingPicture(false);
        }
      }

      setShowAddForm(false);
      setFormData({
        name: '',
        age: 5,
        gender: null,
        avatar_color: AVATAR_COLORS[0],
      });
      setProfilePicture(null);
      setProfilePicturePreview(null);
      loadChildren();
    } catch (error: any) {
      console.error('Failed to add child:', error);

      // Show more detailed error message
      let errorMessage = 'Failed to add child profile';
      if (error.response?.data?.detail) {
        errorMessage += ': ' + error.response.data.detail;
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }

      alert(errorMessage);
    }
  };

  const handleUpdateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChild) return;

    // Validate form
    if (!formData.name.trim()) {
      alert('Please enter a name for the child');
      return;
    }

    try {
      await api.children.update(editingChild.child_id, formData);

      // Upload profile picture if selected
      if (profilePicture) {
        setUploadingPicture(true);
        try {
          await api.children.uploadProfilePicture(editingChild.child_id, profilePicture);
        } catch (error) {
          console.error('Failed to upload profile picture:', error);
          alert('Child profile updated, but failed to upload profile picture. Please try again.');
          // Continue anyway, child is updated
        } finally {
          setUploadingPicture(false);
        }
      }

      setEditingChild(null);
      setFormData({
        name: '',
        age: 5,
        gender: null,
        avatar_color: AVATAR_COLORS[0],
      });
      setProfilePicture(null);
      setProfilePicturePreview(null);
      loadChildren();
    } catch (error: any) {
      console.error('Failed to update child:', error);

      // Show more detailed error message
      let errorMessage = 'Failed to update child profile';
      if (error.response?.data?.detail) {
        errorMessage += ': ' + error.response.data.detail;
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      }

      alert(errorMessage);
    }
  };


  const cancelEdit = () => {
    setEditingChild(null);
    setShowAddForm(false);
    setFormData({
      name: '',
      age: 5,
      gender: null,
      avatar_color: AVATAR_COLORS[0],
    });
    setProfilePicture(null);
    setProfilePicturePreview(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${textPrimaryClass} font-geometric`}>My Children</h2>
        {!showAddForm && !editingChild && (
          <button
            onClick={() => setShowAddForm(true)}
            className={`${glassClass} ${
              isLight
                ? 'border border-blue-300 text-blue-600 hover:bg-blue-50'
                : 'border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10 hover-glow-cyan'
            } px-6 py-2 rounded-xl transition-all duration-300 font-mono`}
          >
            + Add Child
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingChild) && (
        <div className={`${formBgClass} p-6 rounded-2xl shadow-lg animate-fade-in`}>
          <h3 className={`text-xl font-semibold ${textPrimaryClass} mb-4 font-geometric`}>
            {editingChild ? 'Edit Child Profile' : 'Add New Child'}
          </h3>
          <form onSubmit={editingChild ? handleUpdateChild : handleAddChild} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${labelClass} mb-1 font-mono`}>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border ${inputBgClass} rounded-md focus:ring-2 ${
                  isLight ? 'focus:ring-blue-500' : 'focus:ring-neon-cyan'
                } focus:border-transparent transition-all`}
                required
              />
            </div>

            {/* Profile Picture Upload */}
            <div>
              <label className={`block text-sm font-medium ${labelClass} mb-2 font-mono`}>Profile Picture</label>
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
                      style={{ backgroundColor: formData.avatar_color }}
                    >
                      {formData.name ? formData.name[0].toUpperCase() : '?'}
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-300 rounded-md text-blue-700 hover:bg-blue-100 transition-colors">
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
                    <p className="text-xs text-gray-600 mt-1">
                      {profilePicture.name}
                    </p>
                  )}
                  {profilePicturePreview && !profilePicture && editingChild && (
                    <p className="text-xs text-gray-600 mt-1">
                      Current profile picture
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${labelClass} mb-1 font-mono`}>Age</label>
              <input
                type="number"
                min="1"
                max="18"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                className={`w-full px-3 py-2 border ${inputBgClass} rounded-md focus:ring-2 ${
                  isLight ? 'focus:ring-blue-500' : 'focus:ring-neon-cyan'
                } focus:border-transparent transition-all`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${labelClass} mb-1 font-mono`}>
                Emergency Contact Phone Number
              </label>
              <input
                type="tel"
                value={formData.emergency_contact || ''}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className={`w-full px-3 py-2 border ${inputBgClass} rounded-md focus:ring-2 ${
                  isLight ? 'focus:ring-blue-500' : 'focus:ring-neon-cyan'
                } focus:border-transparent transition-all`}
              />
              <p className={`text-xs ${textSecondaryClass} mt-1 font-mono`}>
                📞 This number will be called if child presses the emergency button
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium ${labelClass} mb-2 font-mono`}>Theme Preference</label>
              <div className="grid grid-cols-3 gap-3">
                {/* Rainbow Theme */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: null })}
                  className={`relative overflow-hidden rounded-lg transition-all ${
                    formData.gender === null
                      ? 'ring-2 ring-pink-500 shadow-md'
                      : 'ring-1 ring-gray-300 hover:ring-gray-400'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-purple-200 to-yellow-200 opacity-70"></div>
                  <div className="absolute top-1 right-1 flex gap-0.5">
                    <div className="w-2 h-2 rounded-full bg-pink-400"></div>
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  </div>
                  <div className="relative p-3 bg-white/40 backdrop-blur-sm">
                    <div className="text-xs font-bold text-gray-800 mt-1">Rainbow</div>
                    <div className="text-[10px] text-gray-600">Fun & Colorful</div>
                  </div>
                </button>

                {/* Blue Theme */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'boy' })}
                  className={`relative overflow-hidden rounded-lg transition-all ${
                    formData.gender === 'boy'
                      ? 'ring-2 ring-blue-500 shadow-md'
                      : 'ring-1 ring-gray-300 hover:ring-gray-400'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-sky-200 to-indigo-200 opacity-70"></div>
                  <div className="absolute top-1 right-1 flex gap-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div className="w-2 h-2 rounded-full bg-sky-400"></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                  </div>
                  <div className="relative p-3 bg-white/40 backdrop-blur-sm">
                    <div className="text-xs font-bold text-gray-800 mt-1">Blue</div>
                    <div className="text-[10px] text-gray-600">Cool & Calm</div>
                  </div>
                </button>

                {/* Pink Theme */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'girl' })}
                  className={`relative overflow-hidden rounded-lg transition-all ${
                    formData.gender === 'girl'
                      ? 'ring-2 ring-pink-500 shadow-md'
                      : 'ring-1 ring-gray-300 hover:ring-gray-400'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 opacity-70"></div>
                  <div className="absolute top-1 right-1 flex gap-0.5">
                    <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                    <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  </div>
                  <div className="relative p-3 bg-white/40 backdrop-blur-sm">
                    <div className="text-xs font-bold text-gray-800 mt-1">Pink</div>
                    <div className="text-[10px] text-gray-600">Sweet & Bright</div>
                  </div>
                </button>
              </div>
              {formData.age >= 10 && (
                <p className="mt-2 text-xs text-blue-600">
                  Teen Mode will be automatically enabled for ages 10+
                </p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium ${labelClass} mb-2 font-mono`}>Avatar Color</label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar_color: color })}
                    className={`w-10 h-10 rounded-full border-4 transition-all ${
                      formData.avatar_color === color ? 'border-gray-800 scale-110' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploadingPicture}
                className={`flex-1 py-2 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  isLight
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gradient-to-r from-neon-cyan to-neon-purple text-white hover-glow-cyan'
                }`}
              >
                {uploadingPicture ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  editingChild ? 'Update' : 'Add Child'
                )}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={uploadingPicture}
                className={`flex-1 py-2 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLight
                    ? 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Children List */}
      {children.length === 0 ? (
        <div className={`${glassClass} rounded-2xl p-12 text-center ${borderClass} border animate-fade-in`}>
          <div className={`w-20 h-20 ${
            isLight ? 'bg-blue-100 border-blue-300' : 'bg-neon-cyan/20 border-neon-cyan/30'
          } rounded-full flex items-center justify-center mx-auto mb-6 border`}>
            <svg className={`w-10 h-10 ${isLight ? 'text-blue-500' : 'text-neon-cyan'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className={`${textSecondaryClass} mb-2 font-mono`}>No children profiles found</p>
          <p className={`${isLight ? 'text-gray-500' : 'text-gray-500'} text-sm mb-6 font-mono`}>Children will be automatically added from sessions</p>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className={`${glassClass} ${
                isLight
                  ? 'border border-blue-300 text-blue-600 hover:bg-blue-50'
                  : 'border border-terminal-green/30 text-terminal-green hover:bg-terminal-green/10 hover-glow-cyan'
              } px-8 py-3 rounded-xl transition-all duration-300 font-mono font-semibold`}
            >
              + Add Child Manually
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child) => {
            const summary = childSummaries.get(child.child_id);
            return (
              <div
                key={child.child_id}
                className={`${cardBgClass} rounded-2xl shadow-md p-6 hover:shadow-lg transition-all duration-300 animate-fade-in`}
              >
                {/* Avatar and Name */}
                <div className="flex items-center gap-4 mb-4">
                  {child.profile_picture_url ? (
                    <img
                      src={child.profile_picture_url}
                      alt={`${child.name}'s profile`}
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                      style={{ backgroundColor: child.avatar_color }}
                    >
                      {child.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold ${textPrimaryClass} font-geometric`}>{child.name}</h3>
                    <p className={textSecondaryClass}>Age {child.age}</p>
                    {/* Theme Badge */}
                    <div className="flex items-center gap-1 mt-1">
                      {child.age >= 10 ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold">
                          Teen Mode
                        </span>
                      ) : child.gender === 'boy' ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 text-white font-semibold">
                          Blue Theme
                        </span>
                      ) : child.gender === 'girl' ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 text-white font-semibold">
                          Pink Theme
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-yellow-400 text-white font-semibold">
                          Rainbow Theme
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                {summary && (
                  <div className="space-y-3 mb-4">
                    {/* Active Now Status - Prominent */}
                    {summary.stats.active_sessions > 0 ? (
                      <div className={`${
                        isLight
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400'
                          : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50'
                      } p-3 rounded-lg animate-pulse`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute"></div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className={`${isLight ? 'text-green-800' : 'text-green-300'} font-bold text-sm`}>
                              Active Now
                            </span>
                          </div>
                          <span className={`${isLight ? 'text-green-700' : 'text-green-400'} text-xs font-mono bg-green-100/50 px-2 py-1 rounded`}>
                            {summary.stats.active_sessions} session{summary.stats.active_sessions !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className={`${
                        isLight
                          ? 'bg-gray-50 border border-gray-200'
                          : 'bg-white/5 border border-white/10'
                      } p-3 rounded-lg`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 ${isLight ? 'bg-gray-400' : 'bg-gray-600'} rounded-full`}></div>
                          <span className={`${isLight ? 'text-gray-600' : 'text-gray-400'} font-semibold text-sm`}>
                            Not Active • Offline
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Other Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className={`${isLight ? 'bg-blue-50' : 'bg-blue-500/10'} p-2 rounded-lg border ${isLight ? 'border-blue-200' : 'border-blue-500/30'} text-center`}>
                        <div className={`${isLight ? 'text-blue-600' : 'text-blue-400'} font-bold font-mono text-lg`}>
                          {summary.stats.total_sessions || 0}
                        </div>
                        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-xs`}>Sessions</div>
                      </div>
                      <div className={`${isLight ? 'bg-green-50' : 'bg-green-500/10'} p-2 rounded-lg border ${isLight ? 'border-green-200' : 'border-green-500/30'} text-center`}>
                        <div className={`${isLight ? 'text-green-600' : 'text-green-400'} font-bold font-mono text-lg`}>
                          {summary.stats.total_activities || 0}
                        </div>
                        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-xs`}>Activities</div>
                      </div>
                      <div className={`p-2 rounded-lg border text-center ${
                        summary.stats.unresolved_alerts > 0
                          ? isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/30'
                          : isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/5 border-white/10'
                      }`}>
                        <div className={`font-bold font-mono text-lg ${
                          summary.stats.unresolved_alerts > 0
                            ? isLight ? 'text-red-600' : 'text-red-400'
                            : isLight ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          {summary.stats.unresolved_alerts || 0}
                        </div>
                        <div className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-xs`}>Alerts</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {onSelectChild && (
                    <button
                      onClick={() => onSelectChild(child)}
                      className={`flex-1 py-2 px-3 rounded-lg transition-all text-sm font-semibold font-mono ${
                        selectedChild?.child_id === child.child_id
                          ? isLight
                            ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                            : 'bg-gradient-to-r from-terminal-green to-neon-cyan text-white hover-glow-cyan'
                          : isLight
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {selectedChild?.child_id === child.child_id ? '✓ Selected' : 'Select'}
                    </button>
                  )}
                  <button
                    onClick={() => setSettingsChild(child)}
                    className={`flex-1 py-2 px-3 rounded-lg transition-all text-sm font-semibold ${
                      isLight
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30'
                    }`}
                  >
                    ⚙️ Settings
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Child Settings Modal */}
      {settingsChild && (
        <ChildSettingsModal
          child={settingsChild}
          isOpen={settingsChild !== null}
          onClose={() => setSettingsChild(null)}
          onSave={() => {
            // Reload children to get updated data
            loadChildren();
          }}
          onDelete={() => {
            // Reload children after deletion
            setSettingsChild(null);
            loadChildren();
          }}
        />
      )}
    </div>
  );
};
