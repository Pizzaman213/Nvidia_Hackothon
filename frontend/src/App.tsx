// ============================================================================
// App - Main application component with routing
// ============================================================================

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SessionProvider } from './contexts/SessionContext';
import { ParentProvider } from './contexts/ParentContext';
import { VoiceProvider } from './contexts/VoiceContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Login } from './pages/Login';
import { ParentLogin } from './pages/ParentLogin';
import { BabysitterLogin } from './pages/BabysitterLogin';
import { ChildInterface } from './pages/ChildInterface';
import { ParentDashboard } from './pages/ParentDashboard';
import { BabysitterDashboard } from './pages/BabysitterDashboard';
import { CameraDebug } from './components/debug/CameraDebug';
import { logger, LogCategory } from './utils/logger';

// Component to log route changes
function RouteLogger() {
  const location = useLocation();

  useEffect(() => {
    logger.ui.navigation('previous', location.pathname);
  }, [location]);

  return null;
}

function App() {
  useEffect(() => {
    logger.info(LogCategory.GENERAL, 'AI Babysitter Application started', {
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const handleLogin = (role: 'child' | 'parent' | 'babysitter') => {
    logger.ui.action('App', `User logged in as ${role}`, { role });
  };

  return (
    <Router>
      <SessionProvider>
        <ParentProvider>
          <ThemeProvider>
            <VoiceProvider>
              <RouteLogger />
              <Routes>
                {/* Login Page */}
                <Route path="/" element={<Login onLogin={handleLogin} />} />

                {/* Parent Login Page */}
                <Route path="/parent-login" element={<ParentLogin onLogin={handleLogin} />} />

                {/* Babysitter Login Page */}
                <Route path="/babysitter-login" element={<BabysitterLogin onLogin={handleLogin} />} />

                {/* Child Interface */}
                <Route path="/child" element={<ChildInterface />} />

                {/* Parent Dashboard */}
                <Route path="/parent" element={<ParentDashboard />} />

                {/* Babysitter Dashboard */}
                <Route path="/babysitter" element={<BabysitterDashboard />} />

                {/* Camera Debug Page */}
                <Route path="/debug/camera" element={<CameraDebug />} />

                {/* Redirect unknown routes to login */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </VoiceProvider>
          </ThemeProvider>
        </ParentProvider>
      </SessionProvider>
    </Router>
  );
}

export default App;
