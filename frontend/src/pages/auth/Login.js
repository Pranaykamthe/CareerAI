import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleCandidateLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container-fluid min-vh-100 d-flex p-0"
      style={{ backgroundColor: '#F8FAFC' }}
    >
      <div className="row g-0 flex-grow-1">
        {/* Left Side: Dark Hero Brand Panel (Matches Admin Portal) */}
        <div
          className="col-lg-5 d-none d-lg-flex flex-column justify-content-between p-5 text-white"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #1E1B4B 0%, #0B0F19 100%)',
            borderRight: '1px solid #1E293B',
          }}
        >
          {/* Brand Logo */}
          <div>
            <Link to="/" className="text-decoration-none fs-3 fw-bold text-white d-inline-flex align-items-center">
              <i className="bi bi-layers-fill me-2" style={{ color: '#6366F1' }}></i>
              CareerAI
            </Link>
          </div>

          {/* Center Hero Copy */}
          <div className="my-auto py-5">
            <h1 className="display-6 fw-bold mb-3 text-white">
              Welcome to <span style={{ color: '#6366F1' }}>CareerAI</span>
            </h1>
            <div
              className="mb-4"
              style={{ width: '48px', height: '3px', backgroundColor: '#4F46E5', borderRadius: '2px' }}
            ></div>
            <h5 className="fw-semibold text-white mb-2">AI-Powered Career Intelligence</h5>
            <p className="text-secondary lead fs-6 mb-5" style={{ maxWidth: '420px' }}>
              Analyze your resume, discover high-match job opportunities, and master interviews with personalized AI coaching.
            </p>

            {/* Feature Highlights Footer Row */}
            <div className="d-flex flex-wrap gap-4 text-secondary small pt-3 border-top border-secondary border-opacity-25">
              <div>
                <i className="bi bi-file-earmark-check me-1" style={{ color: '#6366F1' }}></i> ATS Resume Analysis
              </div>
              <div>
                <i className="bi bi-bullseye me-1" style={{ color: '#6366F1' }}></i> Smart Job Matching
              </div>
              <div>
                <i className="bi bi-mic me-1" style={{ color: '#6366F1' }}></i> AI Mock Interviews
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-secondary small">
            © {new Date().getFullYear()} CareerAI. All rights reserved.
          </div>
        </div>

        {/* Right Side: Centered Candidate Login Card */}
        <div className="col-lg-7 d-flex flex-column align-items-center justify-content-center p-4">
          <div
            className="card bg-white p-4 p-md-5 shadow-sm"
            style={{
              maxWidth: '450px',
              width: '100%',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Card Header */}
            <div className="text-center mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: '#EEF2FF',
                  color: '#4F46E5',
                }}
              >
                <i className="bi bi-person-badge fs-3"></i>
              </div>
              <h3 className="fw-bold text-dark mb-1">Welcome Back</h3>
              <p className="text-muted small mb-0">Sign in to your CareerAI Candidate Dashboard</p>
            </div>

            {error && (
              <div className="alert alert-danger py-2 small d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-circle-fill me-2"></i>
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleCandidateLogin}>
              {/* Email Input */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control border-start-0 ps-0"
                    placeholder="john.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Input with Visibility Toggle */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control border-start-0 border-end-0 ps-0"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="input-group-text bg-white border-start-0 text-muted"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="rememberCandidate"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#4F46E5' }}
                  />
                  <label className="form-check-label text-muted small" htmlFor="rememberCandidate">
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="small fw-medium text-decoration-none"
                  style={{ color: '#4F46E5' }}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn w-100 py-2 mb-3 fw-semibold text-white d-flex align-items-center justify-content-center gap-2"
                style={{ backgroundColor: '#4F46E5', borderRadius: '8px' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right"></i> Login to Dashboard
                  </>
                )}
              </button>

              {/* Register Link */}
              <div className="text-center border-top pt-3 mt-3">
                <p className="text-muted small mb-0">
                  Don&apos;t have an account?{' '}
                  <Link to="/register" className="fw-semibold text-decoration-none" style={{ color: '#4F46E5' }}>
                    Create Account
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Subtle Footer Support / Admin Link */}
          <div className="text-center text-muted small mt-4">
            Are you a platform administrator?{' '}
            <Link to="/admin-login" className="text-decoration-none fw-medium" style={{ color: '#4F46E5' }}>
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;