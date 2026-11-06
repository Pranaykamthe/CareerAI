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

// Candidate Pages
import Profile from './pages/candidate/Profile';
import ResumeManagement from './pages/candidate/ResumeManagement';
import ResumeAnalyzer from './pages/candidate/ResumeAnalyzer';
import JobDescriptions from './pages/candidate/JobDescriptions';
import JobMatching from './pages/candidate/JobMatching';
import Applications from './pages/candidate/Applications';
import QuestionBank from './pages/candidate/QuestionBank';

// Candidate Dashboard Overview
const CandidateDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="min-vh-100 bg-light">
      <Navbar />
      <div className="container py-5">
        <div className="card shadow-sm border-0 p-4 p-md-5 rounded-4 text-center bg-white mb-4">
          <div
            className="d-inline-flex p-3 rounded-circle bg-primary bg-opacity-10 text-primary mx-auto mb-3 align-items-center justify-content-center"
            style={{ width: '64px', height: '64px' }}
          >
            <i className="bi bi-speedometer2 fs-2"></i>
          </div>
          <h2 className="fw-bold text-dark mb-2">Welcome back, {user?.username || 'Candidate'}!</h2>
          <p className="text-muted small mb-4 mx-auto" style={{ maxWidth: '600px' }}>
            Manage your candidate profile, optimize your ATS resume score, explore matched job opportunities, and practice interview questions.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <Link to="/resumes" className="btn btn-primary d-inline-flex align-items-center gap-2">
              <i className="bi bi-cloud-arrow-up"></i> Upload & Manage Resumes
            </Link>
            <Link to="/resume-analyzer" className="btn btn-outline-primary d-inline-flex align-items-center gap-2">
              <i className="bi bi-bar-chart-line"></i> ATS Resume Analyzer
            </Link>
            <Link to="/jobs" className="btn btn-outline-primary d-inline-flex align-items-center gap-2">
              <i className="bi bi-briefcase"></i> Browse Jobs
            </Link>
            <Link to="/job-matching" className="btn btn-outline-primary d-inline-flex align-items-center gap-2">
              <i className="bi bi-bullseye"></i> Job Matches
            </Link>
            <Link to="/applications" className="btn btn-outline-primary d-inline-flex align-items-center gap-2">
              <i className="bi bi-kanban"></i> Applications
            </Link>
            <Link to="/question-bank" className="btn btn-outline-primary d-inline-flex align-items-center gap-2">
              <i className="bi bi-collection-play-fill"></i> Question Bank
            </Link>
            <Link to="/profile" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
              <i className="bi bi-person-circle"></i> Edit Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Admin Dashboard Overview
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-vh-100 bg-dark text-white py-5">
      <div className="container">
        <div className="card shadow-sm p-4 text-center bg-dark text-white border-secondary rounded-3">
          <h3 className="fw-bold text-info mb-2">Administrator Panel</h3>
          <p className="text-secondary">Logged in as Super Administrator: {user?.email}</p>
          <div>
            <button className="btn btn-outline-light btn-sm" onClick={logout}>
              <i className="bi bi-box-arrow-right me-1"></i> Logout
            </button>
          </div>
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
          <Route
            path="/resumes"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <ResumeManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resume-analyzer"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <ResumeAnalyzer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <JobDescriptions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-descriptions"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <JobDescriptions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-matching"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <JobMatching />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matches"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <JobMatching />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <Applications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/question-bank"
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <QuestionBank />
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

          {/* Default & Fallback Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;