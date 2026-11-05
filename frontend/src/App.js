import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import AdminLogin from './pages/auth/AdminLogin';

// Placeholder Authenticated Views for Phase 2 Verification
const CandidateDashboardPlaceholder = () => {
  const { user, logout } = useAuth();
  return (
    <div className="container py-5">
      <div className="card shadow-sm p-4 text-center">
        <h3 className="fw-bold text-primary mb-2">Candidate Dashboard (Phase 2 Verified)</h3>
        <p className="text-muted">Welcome, {user?.username} ({user?.email})</p>
        <div>
          <button className="btn btn-outline-danger btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminDashboardPlaceholder = () => {
  const { user, logout } = useAuth();
  return (
    <div className="container py-5">
      <div className="card shadow-sm p-4 text-center bg-dark text-white">
        <h3 className="fw-bold text-info mb-2">Administrator Panel (Phase 2 Verified)</h3>
        <p className="text-secondary">Logged in as Super Administrator: {user?.email}</p>
        <div>
          <button className="btn btn-outline-light btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Protected Candidate Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <CandidateDashboardPlaceholder />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPlaceholder />
              </ProtectedRoute>
            }
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;