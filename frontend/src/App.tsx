// ============================================================================
// App - Main application component with routing
// ============================================================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './contexts/SessionContext';
import { VoiceProvider } from './contexts/VoiceContext';
import { Login } from './pages/Login';
import { ChildInterface } from './pages/ChildInterface';
import { ParentDashboard } from './pages/ParentDashboard';

function App() {
  const handleLogin = (role: 'child' | 'parent') => {
    console.log('User logged in as:', role);
  };

  return (
    <Router>
      <SessionProvider>
        <VoiceProvider>
          <Routes>
            {/* Login Page */}
            <Route path="/" element={<Login onLogin={handleLogin} />} />

            {/* Child Interface */}
            <Route path="/child" element={<ChildInterface />} />

            {/* Parent Dashboard */}
            <Route path="/parent" element={<ParentDashboard />} />

            {/* Redirect unknown routes to login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </VoiceProvider>
      </SessionProvider>
    </Router>
  );
}

export default App;
