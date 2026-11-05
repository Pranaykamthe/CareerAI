import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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
      if (user.role !== 'admin') {
        setError('Access denied. Administrator privileges required.');
        return;
      }
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex p-0" style={{ backgroundColor: '#0B0F19', color: '#F8FAFC' }}>
      <div className="row g-0 flex-grow-1">
        {/* Left Side: Dark Hero Brand */}
        <div className="col-lg-5 d-none d-lg-flex flex-column justify-content-between p-5" style={{ borderRight: '1px solid #1E293B', background: 'radial-gradient(circle at 30% 30%, #1E1B4B 0%, #0B0F19 100%)' }}>
          <div>
            <span className="fs-3 fw-bold text-white">
              <i className="bi bi-shield-lock-fill text-primary me-2"></i>CareerAI <span className="badge bg-primary fs-6">Admin</span>
            </span>
          </div>

          <div className="my-auto py-5">
            <h1 className="display-6 fw-bold mb-3 text-white">Secure Admin Portal</h1>
            <p className="text-secondary lead fs-6 mb-4">
              Manage users, job matching algorithms, and platform settings with complete control and transparency.
            </p>

            <div className="d-flex gap-4 text-secondary small">
              <div><i className="bi bi-lock-fill me-1 text-primary"></i> Secure Access</div>
              <div><i className="bi bi-activity me-1 text-primary"></i> System Monitoring</div>
              <div><i className="bi bi-people-fill me-1 text-primary"></i> User Management</div>
            </div>
          </div>

          <div className="text-secondary small">
            © 2026 CareerAI. All rights reserved.
          </div>
        </div>

        {/* Right Side: Admin Form Card */}
        <div className="col-lg-7 d-flex align-items-center justify-content-center p-4">
          <div className="card border-0 p-4 p-md-5" style={{ maxWidth: '440px', width: '100%', backgroundColor: '#111827', borderRadius: '16px', border: '1px solid #1F2937' }}>
            <div className="text-center mb-4">
              <div className="d-inline-flex p-3 rounded-circle mb-2" style={{ backgroundColor: '#1E1B4B', color: '#6366F1' }}>
                <i className="bi bi-shield-check fs-2"></i>
              </div>
              <h3 className="fw-bold text-white mb-1">Admin Login</h3>
              <p className="text-secondary small">Access the CareerAI Admin Dashboard</p>
            </div>

            {error && <div className="alert alert-danger py-2 small">{error}</div>}

            <form onSubmit={handleAdminLogin}>
              <div className="mb-3">
                <label className="form-label small text-secondary">Admin Email</label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary text-secondary">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="admin@careerai.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small text-secondary">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary text-secondary">
                    <i className="bi bi-key"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input bg-dark border-secondary"
                    id="rememberAdmin"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label className="form-check-label text-secondary small" htmlFor="rememberAdmin">
                    Remember me
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="btn w-100 py-2 mb-3 fw-medium text-white"
                style={{ backgroundColor: '#4F46E5' }}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Login to Admin Panel'}
              </button>

              <div className="text-center text-secondary small">
                <i className="bi bi-shield-shaded me-1"></i> All admin activity is logged for audit security.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;