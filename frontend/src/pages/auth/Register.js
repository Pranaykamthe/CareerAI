import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Password Validation Rules
  const hasMinLength = formData.password.length >= 8;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

  const calculateStrength = () => {
    let score = 0;
    if (hasMinLength) score += 1;
    if (hasUppercase) score += 1;
    if (hasNumber) score += 1;
    if (hasSpecial) score += 1;

    if (score === 0) return { label: 'Empty', color: '#E2E8F0', width: '0%' };
    if (score <= 2) return { label: 'Weak', color: '#EF4444', width: '35%' };
    if (score === 3) return { label: 'Medium', color: '#F59E0B', width: '70%' };
    return { label: 'Strong', color: '#10B981', width: '100%' };
  };

  const strength = calculateStrength();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const err = {};
    if (!formData.username.trim()) err.username = 'Full name is required';
    if (!formData.email.trim()) {
      err.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      err.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      err.password = 'Password is required';
    } else if (strength.label === 'Weak') {
      err.password = 'Use a stronger password';
    }
    if (!formData.confirm_password) {
      err.confirm_password = 'Please confirm your password';
    } else if (formData.password !== formData.confirm_password) {
      err.confirm_password = 'Passwords do not match';
    }
    if (!formData.agreeTerms) {
      err.agreeTerms = 'You must agree to the Terms of Service';
    }
    return err;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirm_password: formData.confirm_password,
        role: 'candidate',
      });
      setIsSuccess(true);
    } catch (err) {
      const serverErrors = err.response?.data;
      if (typeof serverErrors === 'object') {
        const parsed = {};
        for (const [k, v] of Object.entries(serverErrors)) {
          parsed[k] = Array.isArray(v) ? v[0] : v;
        }
        setErrors(parsed);
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div
        className="container-fluid min-vh-100 d-flex align-items-center justify-content-center p-4"
        style={{ backgroundColor: '#F8FAFC' }}
      >
        <div
          className="card bg-white shadow-sm p-5 text-center"
          style={{
            maxWidth: '460px',
            width: '100%',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
          }}
        >
          <div
            className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: '72px',
              height: '72px',
              backgroundColor: '#ECFDF5',
              color: '#10B981',
            }}
          >
            <i className="bi bi-check-lg fs-1"></i>
          </div>
          <h3 className="fw-bold text-dark mb-2">Account Created!</h3>
          <p className="text-muted small mb-4">
            Welcome to CareerAI. Your candidate profile is ready—sign in to upload your resume and start practicing.
          </p>
          <button
            className="btn w-100 py-2 fw-semibold text-white d-flex align-items-center justify-content-center gap-2"
            style={{ backgroundColor: '#4F46E5', borderRadius: '8px' }}
            onClick={() => navigate('/login')}
          >
            <i className="bi bi-box-arrow-in-right"></i> Go to Candidate Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container-fluid min-vh-100 d-flex p-0"
      style={{ backgroundColor: '#F8FAFC' }}
    >
      <div className="row g-0 flex-grow-1">
        {/* Left Side: Dark Hero Brand Panel (Matches Login & Admin Portal) */}
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
              Accelerate Your Career with{' '}
              <span style={{ color: '#6366F1' }}>CareerAI</span>
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
            <h5 className="fw-semibold text-white mb-2">
              Your Intelligent Job & Interview Copilot
            </h5>
            <p
              className="text-secondary lead fs-6 mb-5"
              style={{ maxWidth: '420px' }}
            >
              Create your free candidate account to benchmark your resume against ATS filters, uncover high-fit roles, and practice interviews with instant AI feedback.
            </p>

            {/* Stacked Feature Highlights */}
            <div className="d-flex flex-column gap-3 pt-3 border-top border-secondary border-opacity-25">
              <div className="d-flex align-items-start gap-3">
                <div
                  className="rounded-3 d-inline-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '38px',
                    height: '38px',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    color: '#818CF8',
                  }}
                >
                  <i className="bi bi-file-earmark-check fs-5"></i>
                </div>
                <div>
                  <div className="fw-semibold text-white small">ATS Resume Scoring</div>
                  <small className="text-secondary">
                    Instant keyword gap detection and bullet-point optimization.
                  </small>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div
                  className="rounded-3 d-inline-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '38px',
                    height: '38px',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    color: '#818CF8',
                  }}
                >
                  <i className="bi bi-bullseye fs-5"></i>
                </div>
                <div>
                  <div className="fw-semibold text-white small">Smart Job Matching</div>
                  <small className="text-secondary">
                    Ranked job opportunities aligned to your skills and experience.
                  </small>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div
                  className="rounded-3 d-inline-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: '38px',
                    height: '38px',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    color: '#818CF8',
                  }}
                >
                  <i className="bi bi-mic fs-5"></i>
                </div>
                <div>
                  <div className="fw-semibold text-white small">AI Mock Interviews</div>
                  <small className="text-secondary">
                    Role-specific technical and behavioral coaching sessions.
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-secondary small">
            © {new Date().getFullYear()} CareerAI. All rights reserved.
          </div>
        </div>

        {/* Right Side: Centered Registration Card */}
        <div className="col-lg-7 d-flex flex-column align-items-center justify-content-center p-4 py-5">
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
                <i className="bi bi-person-plus fs-3"></i>
              </div>
              <h3 className="fw-bold text-dark mb-1">Create Your Account</h3>
              <p className="text-muted small mb-0">
                Start your CareerAI candidate workspace in seconds
              </p>
            </div>

            {errors.general && (
              <div
                className="alert alert-danger py-2 small d-flex align-items-center"
                role="alert"
              >
                <i className="bi bi-exclamation-circle-fill me-2"></i>
                <div>{errors.general}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Full Name */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">
                  Full Name
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <i className="bi bi-person"></i>
                  </span>
                  <input
                    type="text"
                    name="username"
                    className={`form-control border-start-0 ps-0 ${
                      errors.username ? 'is-invalid' : ''
                    }`}
                    placeholder="John Doe"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
                {errors.username && (
                  <div className="text-danger small mt-1">{errors.username}</div>
                )}
              </div>

              {/* Email Address */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">
                  Email Address
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    name="email"
                    className={`form-control border-start-0 ps-0 ${
                      errors.email ? 'is-invalid' : ''
                    }`}
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                {errors.email && (
                  <div className="text-danger small mt-1">{errors.email}</div>
                )}
              </div>

              {/* Password */}
              <div className="mb-2">
                <label className="form-label small fw-semibold text-dark">
                  Password
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-control border-start-0 border-end-0 ps-0 ${
                      errors.password ? 'is-invalid' : ''
                    }`}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
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
                {errors.password && (
                  <div className="text-danger small mt-1">{errors.password}</div>
                )}
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div
                  className="p-2.5 rounded-3 mb-3 p-2"
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small text-muted">Password strength:</span>
                    <span
                      className="small fw-semibold"
                      style={{ color: strength.color }}
                    >
                      {strength.label}
                    </span>
                  </div>
                  <div className="progress" style={{ height: '5px' }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{
                        width: strength.width,
                        backgroundColor: strength.color,
                      }}
                    ></div>
                  </div>
                  <div
                    className="row g-1 mt-2 text-muted"
                    style={{ fontSize: '11px' }}
                  >
                    <div
                      className={`col-6 ${
                        hasMinLength ? 'text-success fw-medium' : ''
                      }`}
                    >
                      <i
                        className={`bi ${
                          hasMinLength ? 'bi-check-circle-fill' : 'bi-circle'
                        } me-1`}
                      ></i>
                      Min 8 characters
                    </div>
                    <div
                      className={`col-6 ${
                        hasUppercase ? 'text-success fw-medium' : ''
                      }`}
                    >
                      <i
                        className={`bi ${
                          hasUppercase ? 'bi-check-circle-fill' : 'bi-circle'
                        } me-1`}
                      ></i>
                      One uppercase
                    </div>
                    <div
                      className={`col-6 ${
                        hasNumber ? 'text-success fw-medium' : ''
                      }`}
                    >
                      <i
                        className={`bi ${
                          hasNumber ? 'bi-check-circle-fill' : 'bi-circle'
                        } me-1`}
                      ></i>
                      One number
                    </div>
                    <div
                      className={`col-6 ${
                        hasSpecial ? 'text-success fw-medium' : ''
                      }`}
                    >
                      <i
                        className={`bi ${
                          hasSpecial ? 'bi-check-circle-fill' : 'bi-circle'
                        } me-1`}
                      ></i>
                      One special symbol
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">
                  Confirm Password
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 text-muted">
                    <i className="bi bi-shield-check"></i>
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_password"
                    className={`form-control border-start-0 border-end-0 ps-0 ${
                      errors.confirm_password ? 'is-invalid' : ''
                    }`}
                    placeholder="Repeat your password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="input-group-text bg-white border-start-0 text-muted"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                    aria-label={
                      showConfirmPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    <i
                      className={`bi ${
                        showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'
                      }`}
                    ></i>
                  </button>
                </div>
                {errors.confirm_password && (
                  <div className="text-danger small mt-1">
                    {errors.confirm_password}
                  </div>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="mb-4 form-check">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  className={`form-check-input ${
                    errors.agreeTerms ? 'is-invalid' : ''
                  }`}
                  id="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  style={{ accentColor: '#4F46E5' }}
                />
                <label className="form-check-label small text-muted" htmlFor="agreeTerms">
                  I agree to the{' '}
                  <span className="fw-medium" style={{ color: '#4F46E5' }}>
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="fw-medium" style={{ color: '#4F46E5' }}>
                    Privacy Policy
                  </span>
                </label>
                {errors.agreeTerms && (
                  <div className="invalid-feedback">{errors.agreeTerms}</div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn w-100 py-2 mb-3 fw-semibold text-white d-flex align-items-center justify-content-center gap-2"
                style={{ backgroundColor: '#4F46E5', borderRadius: '8px' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Creating account...
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
                  <Link
                    to="/login"
                    className="fw-semibold text-decoration-none"
                    style={{ color: '#4F46E5' }}
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* Subtle Footer Admin Link */}
          <div className="text-center text-muted small mt-4">
            Are you a platform administrator?{' '}
            <Link
              to="/admin-login"
              className="text-decoration-none fw-medium"
              style={{ color: '#4F46E5' }}
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;