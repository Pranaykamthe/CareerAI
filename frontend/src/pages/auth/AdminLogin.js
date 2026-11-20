import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      if (user?.role !== 'admin') {
        localStorage.removeItem('careerai_access_token');
        localStorage.removeItem('careerai_refresh_token');
        localStorage.removeItem('careerai_user');
        setError('Access denied. Administrator privileges are required for this portal.');
        setLoading(false);
        return;
      }
      navigate('/admin');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Invalid administrator credentials. Please try again.'
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
        {/* Left Side: Dark Hero Brand Panel */}
        <div
          className="col-lg-5 d-none d-lg-flex flex-column justify-content-between p-5 text-white"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #1E1B4B 0%, #0B0F19 100%)',
            borderRight: '1px solid #1E293B',
          }}
        >
          {/* Brand Logo */}
          <div>
            <Link
              to="/"
              className="text-decoration-none fs-3 fw-bold text-white d-inline-flex align-items-center"
            >
              <i className="bi bi-layers-fill me-2" style={{ color: '#6366F1' }}></i>
              CareerAI
              <span
                className="badge ms-2 fw-semibold"
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  color: '#A5B4FC',
                  fontSize: '11px',
                }}
              >
                ADMIN
              </span>
            </Link>
          </div>

          {/* Center Hero Copy */}
          <div className="my-auto py-5">
            <h1 className="display-6 fw-bold mb-3 text-white">
              System <span style={{ color: '#6366F1' }}>Administration</span>
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
            <h5 className="fw-semibold text-white mb-2">Platform Governance & Telemetry</h5>
            <p className="text-secondary lead fs-6 mb-5" style={{ maxWidth: '420px' }}>
              Monitor system health, manage platform user accounts, curate active job listings, and maintain the AI interview question bank.
            </p>

            {/* Admin Highlights Footer Row */}
            <div className="d-flex flex-wrap gap-4 text-secondary small pt-3 border-top border-secondary border-opacity-25">
              <div>
                <i className="bi bi-shield-lock me-1" style={{ color: '#6366F1' }}></i> Role-Guarded Access
              </div>
              <div>
                <i className="bi bi-people me-1" style={{ color: '#6366F1' }}></i> User & Job Control
              </div>
              <div>
                <i className="bi bi-activity me-1" style={{ color: '#6366F1' }}></i> System Telemetry
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-secondary small">
            © {new Date().getFullYear()} CareerAI Administration. Restricted Portal.
          </div>
        </div>

        {/* Right Side: Centered Admin Login Card */}
        <div className="col-lg-7 d-flex flex-column align-items-center justify-content-center p-4">
          {/* Top Navigation Bar: Back to Homepage */}
          <div
            className="d-flex justify-content-between align-items-center mb-3"
            style={{ maxWidth: '450px', width: '100%' }}
          >
            <Link
              to="/"
              className="btn btn-sm btn-light border text-dark d-inline-flex align-items-center gap-2 px-3 py-2 fw-medium shadow-sm"
              style={{ borderRadius: '10px', borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}
            >
              <i className="bi bi-arrow-left" style={{ color: '#4F46E5' }}></i> Back to Homepage
            </Link>
            <Link
              to="/"
              className="d-lg-none text-decoration-none fw-bold text-dark d-inline-flex align-items-center"
            >
              <i className="bi bi-layers-fill me-1" style={{ color: '#4F46E5' }}></i>
              CareerAI
            </Link>
          </div>

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
                <i className="bi bi-shield-lock-fill fs-3"></i>
              </div>
              <h3 className="fw-bold text-dark mb-1">Admin Portal</h3>
              <p className="text-muted small mb-0">Sign in with your administrator credentials</p>
            </div>

            {error && (
              <div className="alert alert-danger py-2 small d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleAdminLogin}>
              {/* Admin Email Input */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Administrator Email</label>
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
              <div className="mb-4">
                <label className="form-label small fw-semibold text-dark">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <i className="bi bi-key"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control border-start-0 border-end-0 ps-0"
                    placeholder="Enter admin password"
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
                    Verifying Privileges...
                  </>
                ) : (
                  <>
                    <i className="bi bi-shield-check"></i> Access Admin Console
                  </>
                )}
              </button>

              {/* Back to Candidate Login Button */}
              <div className="border-top pt-3 mt-3">
                <Link
                  to="/login"
                  className="btn btn-outline-secondary w-100 py-2 small fw-semibold d-flex align-items-center justify-content-center gap-2"
                  style={{ borderRadius: '8px' }}
                >
                  <i className="bi bi-person-badge"></i> Back to Candidate Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;