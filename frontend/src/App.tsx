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
import { useWindowScale } from './hooks/useWindowScale';

// Component to log route changes
function RouteLogger() {
  const location = useLocation();

  useEffect(() => {
    logger.ui.navigation('previous', location.pathname);
  }, [location]);

  return null;
}

// Component to apply window-based scaling
function ScaleWrapper({ children }: { children: React.ReactNode }) {
  const { scale, width } = useWindowScale();

  useEffect(() => {
    // Log scale changes for debugging
    logger.info(LogCategory.GENERAL, 'Window scale changed', {
      scale,
      width,
      timestamp: new Date().toISOString(),
    });
  }, [scale, width]);

  // Only apply scaling on larger screens (not mobile)
  const shouldScale = width >= 768;

  const style: React.CSSProperties = shouldScale
    ? {
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${100 / scale}%`,
        minHeight: `${100 / scale}vh`,
      }
    : {};

  return <div style={style}>{children}</div>;
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
              <ScaleWrapper>
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
              </ScaleWrapper>
            </VoiceProvider>
          </ThemeProvider>
        </ParentProvider>
      </SessionProvider>
    </Router>
  );
}

export default App;
