import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// App Pages
import Dashboard from './pages/Dashboard';
import Bridges from './pages/Bridges';
import Devices from './pages/Devices';
import HistoricalData from './pages/HistoricalData';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Protected route wrapper with role enforcement
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  roles?: ('admin' | 'engineer' | 'viewer')[];
}> = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
            Authenticating Session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // If roles are specified and user's role is not in the list, redirect to dashboard
  if (roles && !roles.includes(user.role)) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl">
            <svg className="w-12 h-12 text-rose-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Access Denied</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your role <span className="font-mono font-bold text-cyan-500">{user.role}</span> does not have permission to view this page.
          </p>
          <Navigate to="/" replace />
        </div>
      </Layout>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes — only accessible when NOT logged in */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />
      {/* /register is admin-only inside the app (see protected routes below) */}
      <Route path="/register" element={user ? <Navigate to="/register" replace /> : <Navigate to="/login" replace />} />

      {/* Protected App Routes */}
      {/* All roles: Dashboard, Bridges, Devices, Logs, Alerts */}
      <Route path="/" element={<ProtectedRoute roles={['admin','engineer','viewer']}><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/bridges" element={<ProtectedRoute roles={['admin','engineer','viewer']}><Layout><Bridges /></Layout></ProtectedRoute>} />
      <Route path="/devices" element={<ProtectedRoute roles={['admin','engineer','viewer']}><Layout><Devices /></Layout></ProtectedRoute>} />
      <Route path="/logs" element={<ProtectedRoute roles={['admin','engineer','viewer']}><Layout><HistoricalData /></Layout></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute roles={['admin','engineer','viewer']}><Layout><Alerts /></Layout></ProtectedRoute>} />
      {/* Engineer + Admin: Reports generation */}
      <Route path="/reports" element={<ProtectedRoute roles={['admin','engineer']}><Layout><Reports /></Layout></ProtectedRoute>} />
      {/* Admin only: Settings & Register */}
      <Route path="/settings" element={<ProtectedRoute roles={['admin']}><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="/register" element={<ProtectedRoute roles={['admin']}><Layout><Register /></Layout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
