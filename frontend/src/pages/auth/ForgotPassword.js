import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Request | 2: Sent | 3: Reset | 4: Success
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const handleSendLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password/', { email: email.trim() });
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          'This email address is not registered.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    setError('');
    if (!hasMinLength || !hasUppercase || !hasNumber) {
      setError('Password must be at least 8 characters with an uppercase letter and number.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setStep(4);
  };

  return (
    <div
      className="container-fluid min-vh-100 d-flex p-0"
      style={{ backgroundColor: '#F8FAFC' }}
    >
      <div className="row g-0 flex-grow-1">
        {/* Left Side: Midnight Indigo Hero Panel */}
        <div
          className="col-lg-5 d-none d-lg-flex flex-column justify-content-between p-5 text-white"
          style={{
            background: 'radial-gradient(circle at 30% 30%, #1E1B4B 0%, #0B0F19 100%)',
            borderRight: '1px solid #1E293B',
          }}
        >
          <div>
            <Link
              to="/"
              className="text-decoration-none fs-3 fw-bold text-white d-inline-flex align-items-center"
            >
              <i className="bi bi-layers-fill me-2" style={{ color: '#6366F1' }}></i>
              CareerAI
            </Link>
          </div>

          <div className="my-auto py-5">
            <h1 className="display-6 fw-bold mb-3 text-white">
              Account <span style={{ color: '#6366F1' }}>Recovery</span>
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
              Fast & Secure Credential Reset
            </h5>
            <p className="text-secondary lead fs-6 mb-5" style={{ maxWidth: '400px' }}>
              Verify your registered email address and create a strong new password to regain instant access to your resumes, job matches, and interview reports.
            </p>

            {/* 4-Step Progress Tracker */}
            <div className="d-flex flex-column gap-3 pt-3 border-top border-secondary border-opacity-25 small">
              {[
                { num: 1, label: 'Verify Registered Email' },
                { num: 2, label: 'Receive Recovery Link' },
                { num: 3, label: 'Configure Strong Password' },
                { num: 4, label: 'Return to Workspace' },
              ].map((s) => (
                <div key={s.num} className="d-flex align-items-center gap-3">
                  <span
                    className="rounded-circle d-inline-flex align-items-center justify-content-center fw-bold"
                    style={{
                      width: '26px',
                      height: '26px',
                      fontSize: '12px',
                      backgroundColor: step >= s.num ? '#4F46E5' : 'rgba(255,255,255,0.08)',
                      color: step >= s.num ? '#FFFFFF' : '#94A3B8',
                    }}
                  >
                    {step > s.num ? <i className="bi bi-check-lg"></i> : s.num}
                  </span>
                  <span className={step >= s.num ? 'text-white fw-medium' : 'text-secondary'}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-secondary small">
            © {new Date().getFullYear()} CareerAI. All rights reserved.
          </div>
        </div>

        {/* Right Side: Centered Recovery Card */}
        <div className="col-lg-7 d-flex flex-column align-items-center justify-content-center p-4">
          <div
            className="card bg-white p-4 p-md-5 shadow-sm"
            style={{
              maxWidth: '460px',
              width: '100%',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Step 1: Request Reset */}
            {step === 1 && (
              <div>
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
                    <i className="bi bi-envelope-lock fs-3"></i>
                  </div>
                  <h3 className="fw-bold text-dark mb-1">Forgot your password?</h3>
                  <p className="text-muted small mb-0">
                    Enter your email address and we'll send you a recovery link.
                  </p>
                </div>

                {error && (
                  <div className="alert alert-danger py-2 small d-flex align-items-center">
                    <i className="bi bi-exclamation-circle-fill me-2"></i>
                    <div>{error}</div>
                  </div>
                )}

                <form onSubmit={handleSendLink}>
                  <div className="mb-4">
                    <label className="form-label small fw-semibold text-dark">
                      Email Address
                    </label>
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

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 mb-3"
                    disabled={loading}
                  >
                    {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
                  </button>

                  <Link
                    to="/login"
                    className="btn btn-outline-secondary w-100 py-2 small fw-semibold"
                    style={{ borderRadius: '10px' }}
                  >
                    <i className="bi bi-arrow-left me-1"></i> Return to Login
                  </Link>
                </form>
              </div>
            )}

            {/* Step 2: Confirmation Screen */}
            {step === 2 && (
              <div className="text-center">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: '#EEF2FF',
                    color: '#4F46E5',
                  }}
                >
                  <i className="bi bi-send-check fs-3"></i>
                </div>
                <h3 className="fw-bold text-dark mb-2">Check your email!</h3>
                <p className="text-muted small mb-1">We've sent a password reset link to</p>
                <div className="fw-semibold text-dark mb-3">{email}</div>
                <p className="text-muted small mb-4">The recovery link expires in 15 minutes.</p>

                <div
                  className="p-3 rounded-3 small text-muted text-start mb-4"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                  <i className="bi bi-info-circle me-1 text-primary"></i> Evaluating locally?{' '}
                  <button
                    type="button"
                    className="btn btn-link p-0 small fw-semibold text-decoration-none"
                    style={{ color: '#4F46E5' }}
                    onClick={() => setStep(3)}
                  >
                    Simulate Clicking Reset Link →
                  </button>
                </div>

                <Link
                  to="/login"
                  className="btn btn-outline-secondary w-100 py-2 small fw-semibold"
                  style={{ borderRadius: '10px' }}
                >
                  <i className="bi bi-arrow-left me-1"></i> Return to Login
                </Link>
              </div>
            )}

            {/* Step 3: Create New Password */}
            {step === 3 && (
              <div>
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
                    <i className="bi bi-shield-lock fs-3"></i>
                  </div>
                  <h3 className="fw-bold text-dark mb-1">Create a new password</h3>
                  <p className="text-muted small mb-0">
                    Choose a strong password for {email}
                  </p>
                </div>

                {error && (
                  <div className="alert alert-danger py-2 small">{error}</div>
                )}

                <form onSubmit={handleResetPassword}>
                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-dark">
                      New Password
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0 text-muted">
                        <i className="bi bi-lock"></i>
                      </span>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="form-control border-start-0 border-end-0 ps-0"
                        placeholder="Min 8 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="input-group-text bg-white border-start-0 text-muted"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        tabIndex="-1"
                      >
                        <i className={`bi ${showNewPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div
                    className="row g-1 mb-3 p-2 rounded-3 text-muted"
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

                  <div className="mb-4">
                    <label className="form-label small fw-semibold text-dark">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-100 py-2">
                    Reset Password
                  </button>
                </form>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <div className="text-center">
                <div
                  className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    width: '68px',
                    height: '68px',
                    backgroundColor: '#ECFDF5',
                    color: '#10B981',
                  }}
                >
                  <i className="bi bi-check-lg fs-1"></i>
                </div>
                <h3 className="fw-bold text-dark mb-2">Password changed!</h3>
                <p className="text-muted small mb-4">
                  Your password has been updated and your CareerAI account is ready.
                </p>
                <Link to="/login" className="btn btn-primary w-100 py-2">
                  Go to Candidate Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;