import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      if (user?.role === 'admin' || user?.is_superuser) {
        navigate('/admin');
      } else {
        if (logout) {
          logout();
        }
        setError('Access denied. This portal is restricted to authorized platform administrators.');
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Invalid administrator credentials. Please verify your email and password.'
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
        {/* Left Side: Deep Midnight-Indigo Admin Brand Panel */}
        <div
          className="col-lg-5 d-none d-lg-flex flex-column justify-content-between p-5 text-white position-relative overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 25% 25%, #1E1B4B 0%, #050A18 100%)',
            borderRight: '1px solid #1E293B',
          }}
        >
          {/* Brand Logo */}
          <div>
            <Link
              to="/"
              className="text-decoration-none fs-3 fw-bold text-white d-inline-flex align-items-center"
            >
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-3 me-2"
                style={{ width: '38px', height: '38px', backgroundColor: '#4F46E5' }}
              >
                <i className="bi bi-layers-fill text-white fs-5"></i>
              </span>
              CareerAI
            </Link>
          </div>

          {/* Center Hero Copy */}
          <div className="my-auto py-5">
            <h1 className="display-6 fw-bold mb-3 text-white">
              CareerAI <span style={{ color: '#6366F1' }}>Admin</span>
            </h1>
            <div
              className="mb-4"
              style={{
                width: '48px',
                height: '3px',
                backgroundColor: '#4F46E5',
                borderRadius: '2px',
              }}
            ></div>
            <h5 className="fw-semibold text-white mb-2">Secure Admin Portal</h5>
            <p className="text-secondary lead fs-6 mb-5" style={{ maxWidth: '420px' }}>
              Manage users, job catalogs, interview question banks, and platform health with complete control and transparency.
            </p>

            {/* Watermark Shield Emblem */}
            <div className="my-4">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-4"
                style={{
                  width: '96px',
                  height: '96px',
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <i className="bi bi-shield-lock" style={{ fontSize: '2.75rem', color: '#4F46E5' }}></i>
              </div>
            </div>

            {/* Security Highlights Footer Row */}
            <div className="d-flex flex-wrap gap-4 text-secondary small pt-4 border-top border-secondary border-opacity-25">
              <div>
                <i className="bi bi-shield-check me-1" style={{ color: '#6366F1' }}></i> Secure Access
              </div>
              <div>
                <i className="bi bi-activity me-1" style={{ color: '#6366F1' }}></i> System Monitoring
              </div>
              <div>
                <i className="bi bi-people me-1" style={{ color: '#6366F1' }}></i> User Management
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-secondary small">
            © {new Date().getFullYear()} CareerAI. All rights reserved.
          </div>
        </div>

        {/* Right Side: Centered Admin Login Card */}
        <div className="col-lg-7 d-flex flex-column align-items-center justify-content-center p-4">
          <div
            className="card bg-white p-4 p-md-5"
            style={{
              maxWidth: '450px',
              width: '100%',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
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
                <i className="bi bi-person-badge-fill fs-3"></i>
              </div>
              <h3 className="fw-bold text-dark mb-1">Admin Login</h3>
              <p className="text-muted small mb-0">Access the CareerAI Admin Dashboard</p>
            </div>

            {error && (
              <div className="alert alert-danger py-2 small d-flex align-items-center rounded-3" role="alert">
                <i className="bi bi-exclamation-circle-fill me-2"></i>
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleAdminLogin}>
              {/* Admin Email Input */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Admin Email</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control border-start-0 ps-0"
                    placeholder="admin@careerai.com"
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
                    id="rememberAdmin"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#4F46E5' }}
                  />
                  <label className="form-check-label text-muted small" htmlFor="rememberAdmin">
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
                style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-shield-check"></i> Login to Admin Panel
                  </>
                )}
              </button>

              {/* Security Notice */}
              <div className="text-center border-top pt-3 mt-3">
                <div className="text-uppercase fw-semibold text-muted mb-1" style={{ fontSize: '10px', letterSpacing: '0.06em' }}>
                  Secure Access
                </div>
                <p className="text-muted mb-0" style={{ fontSize: '11.5px' }}>
                  <i className="bi bi-lock-fill me-1"></i>
                  This is a secure admin area. All administrative actions are role-verified and protected.
                </p>
              </div>
            </form>
          </div>

          {/* Candidate Login Redirect */}
          <div className="text-center text-muted small mt-4">
            Looking for the candidate workspace?{' '}
            <Link to="/login" className="text-decoration-none fw-semibold" style={{ color: '#4F46E5' }}>
              Back to Candidate Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;