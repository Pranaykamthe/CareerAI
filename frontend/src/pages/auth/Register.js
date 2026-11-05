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
      <div className="container min-vh-100 d-flex align-items-center justify-content-center">
        <div className="card shadow-sm border-0 p-5 text-center" style={{ maxWidth: '480px', borderRadius: '16px' }}>
          <div className="mx-auto mb-4 d-flex align-items-center justify-content-center rounded-circle" style={{ width: '72px', height: '72px', backgroundColor: '#ECFDF5', color: '#10B981' }}>
            <i className="bi bi-check-lg fs-1"></i>
          </div>
          <h3 className="fw-bold mb-2">Account Created!</h3>
          <p className="text-muted mb-4">Welcome to CareerAI. Your account has been created successfully.</p>
          <button className="btn btn-primary-custom w-100 py-2" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid min-vh-100 d-flex p-0">
      <div className="row g-0 flex-grow-1">
        {/* Left Hero Banner */}
        <div className="col-lg-5 d-none d-lg-flex flex-column justify-content-between p-5" style={{ backgroundColor: '#F8FAFC', borderRight: '1px solid #E2E8F0' }}>
          <div className="d-flex align-items-center">
            <span className="fs-3 fw-bold text-primary">
              <i className="bi bi-layers-fill me-2"></i>CareerAI
            </span>
          </div>

          <div className="my-auto py-5">
            <h1 className="display-6 fw-bold text-dark mb-3">
              Join CareerAI and <br />
              <span className="text-primary">Accelerate Your Career</span>
            </h1>
            <p className="text-muted mb-4 lead fs-6">
              Create your account and unlock the power of AI to land your dream job.
            </p>

            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-start gap-3">
                <div className="rounded p-2" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                  <i className="bi bi-file-earmark-person fs-5"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-semibold">AI Resume Analysis</h6>
                  <small className="text-muted">Get in-depth insights and improve your resume with AI.</small>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="rounded p-2" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                  <i className="bi bi-briefcase fs-5"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-semibold">Job Matching</h6>
                  <small className="text-muted">Find the best job opportunities that match your skills.</small>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="rounded p-2" style={{ backgroundColor: '#FAF5FF', color: '#7C3AED' }}>
                  <i className="bi bi-chat-quote fs-5"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-semibold">AI Interview Preparation</h6>
                  <small className="text-muted">Practice with AI-powered mock interviews and feedback.</small>
                </div>
              </div>
            </div>
          </div>

          <div className="text-muted small">
            © 2026 CareerAI. All rights reserved.
          </div>
        </div>

        {/* Right Form Container */}
        <div className="col-lg-7 d-flex align-items-center justify-content-center p-4 p-md-5">
          <div style={{ maxWidth: '480px', width: '100%' }}>
            <div className="text-center text-lg-start mb-4">
              <h2 className="fw-bold mb-1">Create your account</h2>
              <p className="text-muted small">Fill in the details below to get started</p>
            </div>

            {errors.general && (
              <div className="alert alert-danger py-2 small">{errors.general}</div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Full Name */}
              <div className="mb-3">
                <label className="form-label small fw-medium">Full Name</label>
                <input
                  type="text"
                  name="username"
                  className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                  placeholder="e.g. John Doe"
                  value={formData.username}
                  onChange={handleChange}
                />
                {errors.username && <div className="invalid-feedback">{errors.username}</div>}
              </div>

              {/* Email Address */}
              <div className="mb-3">
                <label className="form-label small fw-medium">Email address</label>
                <input
                  type="email"
                  name="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              {/* Password */}
              <div className="mb-2">
                <label className="form-label small fw-medium">Password</label>
                <div className="input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="Enter strong password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                  {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
                </div>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small text-muted">Password strength:</span>
                    <span className="small fw-semibold" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                  <div className="progress" style={{ height: '5px' }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: strength.width, backgroundColor: strength.color }}
                    ></div>
                  </div>
                  <div className="row g-1 mt-2 text-muted" style={{ fontSize: '11px' }}>
                    <div className={`col-6 ${hasMinLength ? 'text-success fw-medium' : ''}`}>
                      <i className={`bi ${hasMinLength ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i> Min 8 characters
                    </div>
                    <div className={`col-6 ${hasUppercase ? 'text-success fw-medium' : ''}`}>
                      <i className={`bi ${hasUppercase ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i> One uppercase
                    </div>
                    <div className={`col-6 ${hasNumber ? 'text-success fw-medium' : ''}`}>
                      <i className={`bi ${hasNumber ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i> One number
                    </div>
                    <div className={`col-6 ${hasSpecial ? 'text-success fw-medium' : ''}`}>
                      <i className={`bi ${hasSpecial ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}></i> One special symbol
                    </div>
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              <div className="mb-3">
                <label className="form-label small fw-medium">Confirm Password</label>
                <div className="input-group">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_password"
                    className={`form-control ${errors.confirm_password ? 'is-invalid' : ''}`}
                    placeholder="Repeat password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                  {errors.confirm_password && <div className="invalid-feedback d-block">{errors.confirm_password}</div>}
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  className={`form-check-input ${errors.agreeTerms ? 'is-invalid' : ''}`}
                  id="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                />
                <label className="form-check-label small" htmlFor="agreeTerms">
                  I agree to the <span className="text-primary">Terms of Service</span> and <span className="text-primary">Privacy Policy</span>
                </label>
                {errors.agreeTerms && <div className="invalid-feedback">{errors.agreeTerms}</div>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary-custom w-100 py-2 mb-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>

              <div className="text-center small text-muted">
                Already have an account? <Link to="/login" className="text-primary fw-semibold text-decoration-none">Log in</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;