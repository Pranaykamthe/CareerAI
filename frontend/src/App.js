import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import AdminLogin from './pages/auth/AdminLogin';

// Profile Page
import Profile from './pages/candidate/Profile';

// Candidate Dashboard View
const CandidateDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="min-vh-100 bg-light">
      <Navbar />
      <div className="container py-5">
        <div className="card shadow-sm border-0 p-4 rounded-3 text-center bg-white">
          <div className="d-inline-flex p-3 rounded-circle bg-primary bg-opacity-10 text-primary mx-auto mb-3">
            <i className="bi bi-speedometer2 fs-2"></i>
          </div>
          <h3 className="fw-bold text-dark mb-1">Welcome back, {user?.username}!</h3>
          <p className="text-muted small mb-4">Your candidate hub is active. Keep your profile and skills updated.</p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/profile" className="btn btn-primary-custom">
              <i className="bi bi-person-circle me-1"></i> Manage Candidate Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin Dashboard Placeholder
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  return (
    <div className="container py-5">
      <div className="card shadow-sm p-4 text-center bg-dark text-white rounded-3">
        <h3 className="fw-bold text-info mb-2">Administrator Panel</h3>
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
                <CandidateDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;