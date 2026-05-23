import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { ThemeProvider } from './store/ThemeContext';
import { ToastProvider } from './store/ToastContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Import View Components
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { Tasks } from './components/tasks/Tasks';
import { Tracker } from './components/tracker/Tracker';
import { Planner } from './components/planner/Planner';
import { Ideas } from './components/ideas/Ideas';
import { Achievements } from './components/achievements/Achievements';
import { Settings } from './components/settings/Settings';

// Protect private view panels from anonymous surfers
const PrivateRoute = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-brand-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Syncing user status...</span>
        </div>
      </div>
    );
  }

  return token ? children : <Navigate to="/login" />;
};

// Global container layout wrapper appending sidebar panel
const CoreLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-brand-950 transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 lg:pl-72 pt-20 lg:pt-8 max-w-7xl mx-auto w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};

export const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <ThemeProvider>
              <Routes>
                {/* Public Entry Portals */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Authenticated Dashboard Systems */}
                <Route path="/" element={<PrivateRoute><CoreLayout><Dashboard /></CoreLayout></PrivateRoute>} />
                <Route path="/tasks" element={<PrivateRoute><CoreLayout><Tasks /></CoreLayout></PrivateRoute>} />
                <Route path="/tracker" element={<PrivateRoute><CoreLayout><Tracker /></CoreLayout></PrivateRoute>} />
                <Route path="/planner" element={<PrivateRoute><CoreLayout><Planner /></CoreLayout></PrivateRoute>} />
                <Route path="/ideas" element={<PrivateRoute><CoreLayout><Ideas /></CoreLayout></PrivateRoute>} />
                <Route path="/achievements" element={<PrivateRoute><CoreLayout><Achievements /></CoreLayout></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><CoreLayout><Settings /></CoreLayout></PrivateRoute>} />

                {/* Default Catch-All */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ThemeProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
