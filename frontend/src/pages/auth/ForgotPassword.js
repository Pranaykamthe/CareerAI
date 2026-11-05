import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendLink = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password/', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'This email address is not registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    // Simulation step completion
    setStep(4);
  };

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="card shadow-sm border-0 p-4 p-md-5" style={{ maxWidth: '460px', width: '100%', borderRadius: '16px' }}>
        {/* Step 1: Request Reset */}
        {step === 1 && (
          <div className="text-center">
            <div className="d-inline-flex p-3 rounded-circle bg-light text-primary mb-3">
              <i className="bi bi-envelope-lock fs-2"></i>
            </div>
            <h3 className="fw-bold mb-2">Forgot your password?</h3>
            <p className="text-muted small mb-4">No worries! Enter your email address and we'll send you a link to reset your password.</p>

            {error && <div className="alert alert-danger py-2 small text-start">{error}</div>}

            <form onSubmit={handleSendLink} className="text-start">
              <div className="mb-3">
                <label className="form-label small fw-medium">Email address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="john.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary-custom w-100 py-2 mb-3" disabled={loading}>
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>

              <div className="text-center">
                <Link to="/login" className="btn btn-link text-decoration-none text-muted small">
                  <i className="bi bi-arrow-left me-1"></i> Return to Login
                </Link>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Confirmation Screen */}
        {step === 2 && (
          <div className="text-center">
            <div className="d-inline-flex p-3 rounded-circle text-primary mb-3" style={{ backgroundColor: '#EFF6FF' }}>
              <i className="bi bi-send-check fs-2"></i>
            </div>
            <h3 className="fw-bold mb-2">Check your email!</h3>
            <p className="text-muted small mb-2">We've sent a password reset link to</p>
            <div className="fw-semibold text-dark mb-3">{email}</div>
            <p className="text-muted small mb-4">The link will expire in 15 minutes.</p>

            <div className="alert alert-light border small text-muted text-start mb-4">
              <i className="bi bi-info-circle me-1"></i> Didn't receive the email? Check spam or{' '}
              <button className="btn btn-link p-0 small text-decoration-none" onClick={() => setStep(3)}>
                Simulate Direct Reset
              </button>
            </div>

            <Link to="/login" className="btn btn-outline-secondary w-100 py-2">
              <i className="bi bi-arrow-left me-1"></i> Return to Login
            </Link>
          </div>
        )}

        {/* Step 3: Create New Password */}
        {step === 3 && (
          <div>
            <div className="text-center mb-4">
              <div className="d-inline-flex p-3 rounded-circle bg-light text-primary mb-2">
                <i className="bi bi-shield-lock fs-2"></i>
              </div>
              <h3 className="fw-bold mb-1">Create a new password</h3>
              <p className="text-muted small">Enter and confirm your new password for your account.</p>
            </div>

            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <form onSubmit={handleResetPassword}>
              <div className="mb-3">
                <label className="form-label small fw-medium">New password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label small fw-medium">Confirm new password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary-custom w-100 py-2 mb-3">
                Reset Password
              </button>

              <div className="text-center">
                <Link to="/login" className="text-muted small text-decoration-none">
                  <i className="bi bi-arrow-left me-1"></i> Return to Login
                </Link>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Password Successfully Changed */}
        {step === 4 && (
          <div className="text-center">
            <div className="d-inline-flex p-3 rounded-circle text-success mb-3" style={{ backgroundColor: '#ECFDF5' }}>
              <i className="bi bi-check-circle-fill fs-2"></i>
            </div>
            <h3 className="fw-bold mb-2">Password changed successfully!</h3>
            <p className="text-muted small mb-4">Your password has been updated and your account is secure.</p>

            <Link to="/login" className="btn btn-primary-custom w-100 py-2">
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;