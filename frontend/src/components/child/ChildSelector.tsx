import React, { useState, useEffect, useCallback } from 'react';
import { Child, ChildCreate } from '../../types';
import { api } from '../../services/api';

interface ChildSelectorProps {
  parentId: string;
  onSelectChild: (child: Child) => void;
  onCreateChild: (childData: ChildCreate) => Promise<void>;
  onBack?: () => void;
}

export const ChildSelector: React.FC<ChildSelectorProps> = ({
  parentId,
  onSelectChild,
  onCreateChild,
  onBack,
}) => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChildForm, setShowNewChildForm] = useState(false);
  const [newChildData, setNewChildData] = useState<ChildCreate>({
    name: '',
    age: 5,
    gender: null,
  });

  const loadChildren = useCallback(async () => {
    try {
      setLoading(true);
      const childrenData = await api.children.getAll(parentId);
      setChildren(childrenData);

      // If no children exist, show the new child form automatically
      if (childrenData.length === 0) {
        setShowNewChildForm(true);
      }
    } catch (error) {
      console.error('Failed to load children:', error);
    } finally {
      setLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  const handleSelectChild = (child: Child) => {
    onSelectChild(child);
  };

  const handleCreateNewChild = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newChildData.name.trim()) {
      alert('Please enter a name');
      return;
    }

    try {
      await onCreateChild(newChildData);
      loadChildren();
      setShowNewChildForm(false);
      setNewChildData({ name: '', age: 5, gender: null });
    } catch (error) {
      console.error('Failed to create child:', error);
      alert('Could not create child profile. Please try again.');
    }
  };

  const handleDeleteChild = async (child: Child, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the child when clicking delete

    const confirmed = window.confirm(
      `Are you sure you want to delete ${child.name}'s profile? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.children.delete(child.child_id);
      loadChildren();
    } catch (error) {
      console.error('Failed to delete child:', error);
      alert('Could not delete child profile. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-child-bg via-pink-100 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-child-primary mx-auto"></div>
          <p className="text-center mt-4 text-gray-600 font-child text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  if (showNewChildForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-child-bg via-pink-100 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-child-primary font-child mb-2">
              Hi there!
            </h1>
            <p className="text-xl text-gray-600 font-child">
              Let's get to know each other
            </p>
          </div>

          <form onSubmit={handleCreateNewChild} className="space-y-6">
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2 font-child">
                What's your name?
              </label>
              <input
                type="text"
                value={newChildData.name}
                onChange={(e) => setNewChildData({ ...newChildData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl font-child text-xl focus:border-child-primary focus:outline-none"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-700 mb-2 font-child">
                How old are you?
              </label>
              <input
                type="number"
                min="1"
                max="18"
                value={newChildData.age}
                onChange={(e) => setNewChildData({ ...newChildData, age: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl font-child text-xl focus:border-child-primary focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-700 mb-3 font-child">
                Pick a theme (optional)
              </label>
              <div className="grid grid-cols-3 gap-4">
                {/* Black & White Theme */}
                <button
                  type="button"
                  onClick={() => setNewChildData({ ...newChildData, gender: null })}
                  className={`relative overflow-hidden rounded-2xl transition-all transform hover:scale-105 ${
                    newChildData.gender === null
                      ? 'ring-4 ring-gray-800 shadow-xl'
                      : 'ring-2 ring-gray-300 hover:ring-gray-400'
                  }`}
                >
                  {/* Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 opacity-80"></div>

                  {/* Color Dots Preview */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-black"></div>
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <div className="w-3 h-3 rounded-full bg-white border border-gray-400"></div>
                  </div>

                  {/* Content */}
                  <div className="relative p-5 bg-white/40 backdrop-blur-sm">
                    <div className="text-base font-bold font-child text-gray-800 mt-2">Black & White</div>
                    <div className="text-xs text-gray-600 mt-1 font-child">Classic & Clean</div>
                  </div>
                </button>

                {/* Blue Theme */}
                <button
                  type="button"
                  onClick={() => setNewChildData({ ...newChildData, gender: 'boy' })}
                  className={`relative overflow-hidden rounded-2xl transition-all transform hover:scale-105 ${
                    newChildData.gender === 'boy'
                      ? 'ring-4 ring-blue-500 shadow-xl'
                      : 'ring-2 ring-gray-300 hover:ring-gray-400'
                  }`}
                >
                  {/* Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-sky-200 to-indigo-200 opacity-80"></div>

                  {/* Color Dots Preview */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div className="w-3 h-3 rounded-full bg-sky-400"></div>
                    <div className="w-3 h-3 rounded-full bg-indigo-400"></div>
                  </div>

                  {/* Content */}
                  <div className="relative p-5 bg-white/40 backdrop-blur-sm">
                    <div className="text-base font-bold font-child text-gray-800 mt-2">Blue</div>
                    <div className="text-xs text-gray-600 mt-1 font-child">Cool & Calm</div>
                  </div>
                </button>

                {/* Pink Theme */}
                <button
                  type="button"
                  onClick={() => setNewChildData({ ...newChildData, gender: 'girl' })}
                  className={`relative overflow-hidden rounded-2xl transition-all transform hover:scale-105 ${
                    newChildData.gender === 'girl'
                      ? 'ring-4 ring-pink-500 shadow-xl'
                      : 'ring-2 ring-gray-300 hover:ring-gray-400'
                  }`}
                >
                  {/* Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 opacity-80"></div>

                  {/* Color Dots Preview */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                    <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                    <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                  </div>

                  {/* Content */}
                  <div className="relative p-5 bg-white/40 backdrop-blur-sm">
                    <div className="text-base font-bold font-child text-gray-800 mt-2">Pink</div>
                    <div className="text-xs text-gray-600 mt-1 font-child">Sweet & Bright</div>
                  </div>
                </button>
              </div>

              {/* Teen Theme Info (if age >= 10) */}
              {newChildData.age >= 10 && (
                <div className="mt-3 p-3 bg-gradient-to-r from-cyan-50 to-purple-50 rounded-lg border border-cyan-200">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-child text-gray-700">
                      <strong>Teen Mode</strong> will be used automatically with a modern, sleek design!
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-child-primary hover:bg-pink-500 text-white font-bold py-4 px-6 rounded-xl font-child text-xl transform transition-all hover:scale-105 active:scale-95 shadow-lg"
              >
                Let's Go!
              </button>

              {children.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewChildForm(false)}
                  className="px-6 py-4 border-2 border-gray-300 rounded-xl font-child text-gray-600 hover:bg-gray-50"
                >
                  Back
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-child-bg via-pink-100 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Back Button */}
        {onBack && (
          <div className="mb-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 rounded-xl shadow-lg font-child text-lg text-gray-700 hover:text-child-primary transition-all transform hover:scale-105"
            >
              <span className="text-2xl">←</span>
              <span>Back</span>
            </button>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-child-primary font-child mb-2">
            Welcome Back!
          </h1>
          <p className="text-2xl text-gray-600 font-child">
            Who wants to play today?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {children.map((child) => (
            <div
              key={child.child_id}
              className="relative bg-white rounded-3xl shadow-xl p-8 transform transition-all hover:scale-105 hover:shadow-2xl group"
            >
              {/* Delete Button - appears on hover */}
              <button
                onClick={(e) => handleDeleteChild(child, e)}
                className="absolute top-3 right-3 w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                title={`Delete ${child.name}'s profile`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Child Card - clickable to select */}
              <button
                onClick={() => handleSelectChild(child)}
                className="w-full"
              >
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white text-5xl font-bold mx-auto mb-4"
                  style={{ backgroundColor: child.avatar_color }}
                >
                  {child.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-3xl font-bold text-gray-800 font-child mb-2">
                  {child.name}
                </h2>
                <p className="text-xl text-gray-600 font-child">
                  Age {child.age}
                </p>
              </button>
            </div>
          ))}

          {/* Add New Child Button */}
          <button
            onClick={() => setShowNewChildForm(true)}
            className="bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-dashed border-gray-400 rounded-3xl p-8 transform transition-all hover:scale-105 hover:border-child-primary hover:from-pink-50 hover:to-purple-50"
          >
            <div className="text-6xl mb-4 font-bold text-gray-500">+</div>
            <h2 className="text-2xl font-bold text-gray-600 font-child">
              Add New Child
            </h2>
          </button>
        </div>
      </div>
    </div>
  );
};
