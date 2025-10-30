// ============================================================================
// Login - Simple authentication page
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: (role: 'child' | 'parent') => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'child' | 'parent' | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleChildLogin = () => {
    setSelectedRole('child');
    onLogin('child');
    navigate('/child');
  };

  const handleParentLogin = () => {
    setSelectedRole('parent');
    // For demo purposes, we'll use a simple PIN
    // In production, use proper authentication
    if (pin === '1234' || pin === '') {
      onLogin('parent');
      navigate('/parent');
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-child-bg via-pink-100 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2 font-child">
            AI Babysitter Assistant
          </h1>
          <p className="text-xl text-gray-600">Choose who you are</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Child Login */}
          <button
            onClick={handleChildLogin}
            className="bg-white rounded-3xl shadow-2xl p-8 transform transition-all hover:scale-105 hover:shadow-3xl active:scale-95"
          >
            <div className="text-center">
              <div className="text-8xl mb-4">👧</div>
              <h2 className="text-3xl font-bold text-child-primary mb-3 font-child">
                I'm a Kid!
              </h2>
              <p className="text-gray-600 font-child text-lg">
                Talk to your AI friend, play games, and get help with homework
              </p>
            </div>
          </button>

          {/* Parent Login */}
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center">
              <div className="text-8xl mb-4">👨</div>
              <h2 className="text-3xl font-bold text-parent-primary mb-3">
                I'm a Parent
              </h2>
              <p className="text-gray-600 mb-4">
                Monitor your child's activities and safety
              </p>

              {selectedRole === 'parent' ? (
                <div className="mt-6">
                  <label className="block text-sm font-semibold mb-2 text-left">
                    Enter PIN (demo: 1234 or leave empty)
                  </label>
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleParentLogin();
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-parent-primary focus:outline-none text-center text-2xl tracking-widest"
                    placeholder="••••"
                    maxLength={4}
                    autoFocus
                  />

                  {error && (
                    <p className="text-red-500 text-sm mt-2">{error}</p>
                  )}

                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={handleParentLogin}
                      className="flex-1 bg-parent-primary hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transform transition-all hover:scale-105"
                    >
                      ✓ Login
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRole(null);
                        setPin('');
                        setError(null);
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-3 px-6 rounded-lg transform transition-all hover:scale-105"
                    >
                      ✕ Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedRole('parent')}
                  className="mt-4 w-full bg-parent-primary hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transform transition-all hover:scale-105"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>This is a demo application for the AI Babysitter Assistant</p>
          <p className="mt-1">Parent PIN: 1234 (or leave empty for demo)</p>
        </div>
      </div>
    </div>
  );
};
