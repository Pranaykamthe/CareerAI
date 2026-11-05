import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="card shadow-sm border-0 p-4 p-md-5" style={{ maxWidth: '440px', width: '100%', borderRadius: '16px' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex p-3 rounded-circle bg-light text-primary mb-2">
            <i className="bi bi-person-fill fs-2"></i>
          </div>
          <h3 className="fw-bold mb-1">Welcome back</h3>
          <p className="text-muted small">Enter your credentials to access your CareerAI account</p>
        </div>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-medium">Email address</label>
            <input
              type="email"
              className="form-control"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <label className="form-label small fw-medium">Password</label>
              <Link to="/forgot-password" className="small text-primary text-decoration-none">
                Forgot password?
              </Link>
            </div>
            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary-custom w-100 py-2 mb-3" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="text-center small text-muted">
            Don't have an account? <Link to="/register" className="text-primary fw-semibold text-decoration-none">Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;