import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Public & Auth Pages
import Home from './pages/public/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import AdminLogin from './pages/auth/AdminLogin';

// Candidate Pages
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import Profile from './pages/candidate/Profile';
import ResumeManagement from './pages/candidate/ResumeManagement';
import ResumeBuilder from './pages/candidate/ResumeBuilder';
import ResumeAnalyzer from './pages/candidate/ResumeAnalyzer';
import JobDescriptions from './pages/candidate/JobDescriptions';
import JobMatching from './pages/candidate/JobMatching';
import Applications from './pages/candidate/Applications';
import QuestionBank from './pages/candidate/QuestionBank';
import InterviewPrep from './pages/candidate/InterviewPrep';
import MockInterview from './pages/candidate/MockInterview';
import InterviewReport from './pages/candidate/InterviewReport';
import InterviewHistory from './pages/candidate/InterviewHistory';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProfile from './pages/admin/AdminProfile';

// Candidate Layout: Renders persistent Navbar, active route in Outlet, and pinned Footer
const CandidateLayout = () => {
  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#F8FAFC' }}>
      <Navbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Landing & Authentication Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Protected Candidate Routes (Wrapped in CandidateLayout) */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['candidate']}>
                <CandidateLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<CandidateDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/resumes" element={<ResumeManagement />} />
            <Route path="/resume-builder" element={<ResumeBuilder />} />
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
            <Route path="/history" element={<InterviewHistory />} />
          </Route>

          {/* Standalone Protected Admin Portal Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminProfile />
              </ProtectedRoute>
            }
          />

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;