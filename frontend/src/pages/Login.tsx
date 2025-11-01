// ============================================================================
// Login - Simple authentication page
// ============================================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: (role: 'child' | 'parent' | 'babysitter') => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();

  const handleChildLogin = () => {
    onLogin('child');
    navigate('/child');
  };

  const handleParentLogin = () => {
    // Navigate to dedicated parent login page
    navigate('/parent-login');
  };

  const handleBabysitterLogin = () => {
    // Navigate to dedicated babysitter login page
    navigate('/babysitter-login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-child-bg via-pink-100 to-purple-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <img
            src="/logo-cropped.png"
            alt="Safe Haven Sitters Logo"
            className="w-96 h-auto mx-auto mb-6"
          />
          <h1 className="text-5xl font-bold text-gray-800 mb-2 font-child">
            Safe Haven Sitters
          </h1>
          <p className="text-xl text-gray-600">Choose who you are</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
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
          <button
            onClick={handleParentLogin}
            className="bg-white rounded-3xl shadow-2xl p-8 transform transition-all hover:scale-105 hover:shadow-3xl active:scale-95"
          >
            <div className="text-center">
              <div className="text-8xl mb-4">👨</div>
              <h2 className="text-3xl font-bold text-parent-primary mb-3">
                I'm a Parent
              </h2>
              <p className="text-gray-600">
                Monitor your child's activities and safety
              </p>
            </div>
          </button>

          {/* Babysitter Login */}
          <button
            onClick={handleBabysitterLogin}
            className="bg-white rounded-3xl shadow-2xl p-8 transform transition-all hover:scale-105 hover:shadow-3xl active:scale-95"
          >
            <div className="text-center">
              <div className="text-8xl mb-4">👩‍🍼</div>
              <h2 className="text-3xl font-bold text-parent-primary mb-3">
                I'm a Babysitter
              </h2>
              <p className="text-gray-600">
                Monitor your child's activities and safety
              </p>
            </div>
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>This is a demo application for the AI Babysitter Assistant</p>
        </div>
      </div>
    </div>
  );
};
