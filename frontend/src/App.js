import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import AdminLogin from './pages/auth/AdminLogin';

// Candidate Pages
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import Profile from './pages/candidate/Profile';
import ResumeManagement from './pages/candidate/ResumeManagement';
import ResumeAnalyzer from './pages/candidate/ResumeAnalyzer';
import JobDescriptions from './pages/candidate/JobDescriptions';
import JobMatching from './pages/candidate/JobMatching';
import Applications from './pages/candidate/Applications';
import QuestionBank from './pages/candidate/QuestionBank';
import InterviewPrep from './pages/candidate/InterviewPrep';
import MockInterview from './pages/candidate/MockInterview';
import InterviewReport from './pages/candidate/InterviewReport';
import InterviewHistory from './pages/candidate/InterviewHistory';

// Global Sticky Footer
const Footer = () => {
  return (
    <footer className="bg-white border-top py-3 mt-auto shadow-sm">
      <div className="container-fluid px-4 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
        <div className="small text-muted">
          &copy; {new Date().getFullYear()} <strong className="text-primary">CareerAI</strong>. All rights reserved.
        </div>
        <div className="d-flex gap-3 small">
          <Link to="/dashboard" className="text-decoration-none text-muted">
            Dashboard
          </Link>
          <Link to="/jobs" className="text-decoration-none text-muted">
            Jobs
          </Link>
          <Link to="/applications" className="text-decoration-none text-muted">
            Applications
          </Link>
          <Link to="/interview-history" className="text-decoration-none text-muted">
            History
          </Link>
          <Link to="/profile" className="text-decoration-none text-muted">
            Profile
          </Link>
        </div>
      </div>
    </footer>
  );
};

// Global Layout: Renders persistent Navbar, child route in Outlet, and pinned Footer
const CandidateLayout = () => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// Admin Dashboard Hub
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

          {/* Protected Candidate Routes wrapped in CandidateLayout */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['candidate', 'admin']}>
                <CandidateLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<CandidateDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/resumes" element={<ResumeManagement />} />
            <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
            <Route path="/jobs" element={<JobDescriptions />} />
            <Route path="/job-descriptions" element={<JobDescriptions />} />
            <Route path="/job-matching" element={<JobMatching />} />
            <Route path="/matches" element={<JobMatching />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/question-bank" element={<QuestionBank />} />
            <Route path="/interview-prep" element={<InterviewPrep />} />
            <Route path="/mock-interview" element={<MockInterview />} />
            <Route path="/interview-report/:sessionId" element={<InterviewReport />} />
            <Route path="/interview-history" element={<InterviewHistory />} />
            <Route path="/interviews/history" element={<InterviewHistory />} />
          </Route>

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