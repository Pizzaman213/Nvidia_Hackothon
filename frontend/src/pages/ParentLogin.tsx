// ============================================================================
// ParentLogin - Dedicated parent authentication page
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParent } from '../contexts/ParentContext';
import { logger, LogCategory } from '../utils/logger';

interface ParentLoginProps {
  onLogin: (role: 'parent') => void;
}

export const ParentLogin: React.FC<ParentLoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { setParentId } = useParent();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    // Validate credentials
    const validUsername = process.env.REACT_APP_PARENT_USERNAME || 'parent';
    const validPassword = process.env.REACT_APP_PARENT_PASSWORD || 'safehaven123';

    if (username !== validUsername || password !== validPassword) {
      setLoginError('Invalid username or password');
      logger.warn(LogCategory.UI, 'Parent login failed: invalid credentials');
      return;
    }

    // Clear any error
    setLoginError('');
    setIsLoading(true);

    try {
      // Set parent ID from username
      const parentUserId = 'parent_' + username;
      logger.info(LogCategory.UI, `Parent login successful: ${parentUserId}`);

      setParentId(parentUserId);
      onLogin('parent');

      // Navigate to parent dashboard
      navigate('/parent');
    } catch (error) {
      logger.error(LogCategory.UI, 'Error during parent login', error as Error);
      setLoginError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo-cropped.png"
            alt="Safe Haven Sitters Logo"
            className="w-64 h-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Parent Dashboard
          </h1>
          <p className="text-gray-600">Monitor your child's activities and safety</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-4">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
            <h2 className="text-2xl font-semibold text-gray-800">Parent Login</h2>
          </div>

          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={!username.trim() || !password.trim() || isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Login to Dashboard'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-2 font-medium">Default Credentials:</p>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-medium">Username:</span>{' '}
                  <code className="bg-white px-2 py-1 rounded border border-gray-200">parent</code>
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Password:</span>{' '}
                  <code className="bg-white px-2 py-1 rounded border border-gray-200">safehaven123</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={handleBack}
          className="w-full bg-white text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-md flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Secure parent access to monitor your children</p>
        </div>
      </div>
    </div>
  );
};
