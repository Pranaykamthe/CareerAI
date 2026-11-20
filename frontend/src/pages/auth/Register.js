import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Live password strength criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const strengthScore = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;

  const getStrengthMeta = () => {
    if (!password) return { label: '', color: '#E2E8F0', width: '0%' };
    if (strengthScore <= 1) return { label: 'Weak', color: '#EF4444', width: '25%' };
    if (strengthScore === 2) return { label: 'Fair', color: '#F59E0B', width: '50%' };
    if (strengthScore === 3) return { label: 'Good', color: '#3B82F6', width: '75%' };
    return { label: 'Strong', color: '#10B981', width: '100%' };
  };

  const strengthMeta = getStrengthMeta();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim() || !email.trim()) {
      setError('Please enter your username and email address.');
      return;
    }
    if (!hasMinLength || !hasUppercase || !hasNumber) {
      setError('Password must be at least 8 characters and include an uppercase letter and a number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreeTerms) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        password_confirm: confirmPassword,
      });
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1400);
    } catch (err) {
      const apiErrors = err.response?.data;
      if (apiErrors && typeof apiErrors === 'object') {
        const firstKey = Object.keys(apiErrors)[0];
        const firstMsg = Array.isArray(apiErrors[firstKey])
          ? apiErrors[firstKey][0]
          : apiErrors[firstKey];
        setError(String(firstMsg || 'Registration failed. Please verify your details.'));
      } else {
        setError('Registration failed. Please try again.');
      }
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
            </Link>
          </div>

          {/* Center Hero Copy */}
          <div className="my-auto py-5">
            <h1 className="display-6 fw-bold mb-3 text-white">
              Launch Your Career with <span style={{ color: '#6366F1' }}>CareerAI</span>
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
            <h5 className="fw-semibold text-white mb-2">Built for Modern Job Seekers</h5>
            <p className="text-secondary lead fs-6 mb-5" style={{ maxWidth: '420px' }}>
              Create your free candidate workspace to benchmark your resume against ATS filters, uncover skill gaps, and practice with real-time AI interviewers.
            </p>

            {/* Feature Highlights */}
            <div className="d-flex flex-column gap-3 text-secondary small pt-3 border-top border-secondary border-opacity-25">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill" style={{ color: '#6366F1' }}></i>
                <span>Instant ATS Resume Scoring & AI Builder</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill" style={{ color: '#6366F1' }}></i>
                <span>Semantic Job Matching & Application CRM</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill" style={{ color: '#6366F1' }}></i>
                <span>Role-Specific AI Mock Interviews & Reports</span>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-secondary small">
            © {new Date().getFullYear()} CareerAI. All rights reserved.
          </div>
        </div>

        {/* Right Side: Centered Candidate Registration Card */}
        <div className="col-lg-7 d-flex flex-column align-items-center justify-content-center p-4">
          {/* Top Navigation Bar: Back to Homepage */}
          <div
            className="d-flex justify-content-between align-items-center mb-3"
            style={{ maxWidth: '480px', width: '100%' }}
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
              maxWidth: '480px',
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
                <i className="bi bi-person-plus-fill fs-3"></i>
              </div>
              <h3 className="fw-bold text-dark mb-1">Create Candidate Account</h3>
              <p className="text-muted small mb-0">Start optimizing your career readiness today</p>
            </div>

            {error && (
              <div className="alert alert-danger py-2 small d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-circle-fill me-2"></i>
                <div>{error}</div>
              </div>
            )}

            {success && (
              <div className="alert alert-success py-2 small d-flex align-items-center" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i>
                <div>{success}</div>
              </div>
            )}

            <form onSubmit={handleRegister}>
              {/* Username Input */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Full Name / Username</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <i className="bi bi-person"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

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
              <div className="mb-2">
                <label className="form-label small fw-semibold text-dark">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control border-start-0 border-end-0 ps-0"
                    placeholder="Create a strong password"
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

              {/* Live Password Strength Meter & Rules */}
              {password && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted" style={{ fontSize: '11.5px' }}>
                      Password Strength
                    </span>
                    <span
                      className="fw-semibold"
                      style={{ fontSize: '11.5px', color: strengthMeta.color }}
                    >
                      {strengthMeta.label}
                    </span>
                  </div>
                  <div className="progress mb-2" style={{ height: '5px', backgroundColor: '#E2E8F0' }}>
                    <div
                      className="progress-bar"
                      style={{
                        width: strengthMeta.width,
                        backgroundColor: strengthMeta.color,
                        transition: 'width 0.2s ease',
                      }}
                    ></div>
                  </div>
                  <div
                    className="row g-1 p-2 rounded-3 text-muted"
                    style={{ fontSize: '11.5px', backgroundColor: '#F8FAFC' }}
                  >
                    <div className={`col-6 ${hasMinLength ? 'text-success fw-medium' : ''}`}>
                      <i className={`bi ${hasMinLength ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i>
                      Min 8 characters
                    </div>
                    <div className={`col-6 ${hasUppercase ? 'text-success fw-medium' : ''}`}>
                      <i className={`bi ${hasUppercase ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i>
                      One uppercase
                    </div>
                    <div className={`col-6 ${hasNumber ? 'text-success fw-medium' : ''}`}>
                      <i className={`bi ${hasNumber ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i>
                      One number
                    </div>
                    <div className={`col-6 ${hasSpecial ? 'text-success fw-medium' : ''}`}>
                      <i className={`bi ${hasSpecial ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i>
                      One symbol
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Password Input */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Confirm Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <i className="bi bi-shield-check"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control border-start-0 ps-0"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="form-check mb-4">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{ accentColor: '#4F46E5' }}
                />
                <label className="form-check-label text-muted small" htmlFor="agreeTerms">
                  I agree to the CareerAI Terms of Service and Privacy Policy
                </label>
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-check"></i> Create Account
                  </>
                )}
              </button>

              {/* Login Link */}
              <div className="text-center border-top pt-3 mt-3">
                <p className="text-muted small mb-0">
                  Already have an account?{' '}
                  <Link to="/login" className="fw-semibold text-decoration-none" style={{ color: '#4F46E5' }}>
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;