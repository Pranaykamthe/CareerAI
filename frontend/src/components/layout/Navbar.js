import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold text-primary d-flex align-items-center" to="/dashboard">
          <i className="bi bi-layers-fill me-2 fs-4"></i>CareerAI
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#candidateNavbar"
          aria-controls="candidateNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="candidateNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
            <li className="nav-item">
              <Link
                className={`nav-link fw-medium ${isActive('/dashboard') ? 'text-primary active' : 'text-dark'}`}
                to="/dashboard"
              >
                <i className="bi bi-speedometer2 me-1"></i> Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link fw-medium ${isActive('/resumes') ? 'text-primary active' : 'text-dark'}`}
                to="/resumes"
              >
                <i className="bi bi-file-earmark-person me-1"></i> Resumes
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link fw-medium ${isActive('/profile') ? 'text-primary active' : 'text-dark'}`}
                to="/profile"
              >
                <i className="bi bi-person-circle me-1"></i> Profile
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            <span className="text-muted small d-none d-md-inline">
              <i className="bi bi-person-badge me-1"></i>
              {user?.username} ({user?.role})
            </span>
            <button className="btn btn-outline-danger btn-sm" onClick={logout}>
              <i className="bi bi-box-arrow-right me-1"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};