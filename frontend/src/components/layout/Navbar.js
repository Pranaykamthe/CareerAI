import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItemClass = (path) =>
    location.pathname === path
      ? 'nav-link px-2 text-nowrap fw-bold text-primary border-bottom border-2 border-primary active'
      : 'nav-link px-2 text-nowrap text-secondary';

  return (
    <nav
      className="navbar navbar-expand-xl bg-white sticky-top py-2 px-3 px-lg-4"
      style={{
        borderBottom: '2px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className="container-fluid px-0">
        {/* Brand Logo */}
        <Link
          className="navbar-brand d-flex align-items-center text-primary fw-bold fs-4 me-3 text-nowrap"
          to="/dashboard"
        >
          <i className="bi bi-layers-fill me-2"></i>CareerAI
        </Link>

        {/* Mobile / Responsive Toggler */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#careeraiNav"
          aria-controls="careeraiNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation Links */}
        <div className="collapse navbar-collapse" id="careeraiNav">
          <ul className="navbar-nav me-auto mb-2 mb-xl-0 gap-1 small">
            <li className="nav-item">
              <Link className={navItemClass('/dashboard')} to="/dashboard">
                <i className="bi bi-grid-1x2-fill me-1"></i> Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className={navItemClass('/resumes')} to="/resumes">
                <i className="bi bi-file-earmark-person me-1"></i> Resumes
              </Link>
            </li>
            <li className="nav-item">
              <Link className={navItemClass('/resume-analyzer')} to="/resume-analyzer">
                <i className="bi bi-speedometer2 me-1"></i> ATS Analyzer
              </Link>
            </li>
            <li className="nav-item">
              <Link className={navItemClass('/jobs')} to="/jobs">
                <i className="bi bi-briefcase me-1"></i> Jobs
              </Link>
            </li>
            <li className="nav-item">
              <Link className={navItemClass('/job-matching')} to="/job-matching">
                <i className="bi bi-bullseye me-1"></i> Job Matching
              </Link>
            </li>
            <li className="nav-item">
              <Link className={navItemClass('/applications')} to="/applications">
                <i className="bi bi-kanban me-1"></i> Applications
              </Link>
            </li>
            <li className="nav-item">
              <Link className={navItemClass('/question-bank')} to="/question-bank">
                <i className="bi bi-collection-play-fill me-1"></i> Question Bank
              </Link>
            </li>
            <li className="nav-item">
              <Link className={navItemClass('/interview-prep')} to="/interview-prep">
                <i className="bi bi-stars me-1"></i> Interview Prep
              </Link>
            </li>
            <li className="nav-item">
              <Link className={navItemClass('/mock-interview')} to="/mock-interview">
                <i className="bi bi-mic-fill me-1"></i> Mock Interview
              </Link>
            </li>
          </ul>

          {/* User Profile Navigation & Logout */}
          <div className="d-flex align-items-center gap-3 ms-xl-2 text-nowrap">
            <Link
              to="/profile"
              className="d-flex align-items-center gap-2 text-decoration-none link-dark"
              title="View & Edit Profile"
            >
              <div className="text-end d-none d-sm-block">
                <div className="small fw-bold text-dark lh-sm">{user?.username || 'Candidate'}</div>
                <div className="text-muted" style={{ fontSize: '11px' }}>
                  {user?.email}
                </div>
              </div>
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
                style={{
                  width: '36px',
                  height: '36px',
                  fontSize: '14px',
                  transition: 'transform 0.15s ease-in-out',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {(user?.username || 'C')[0].toUpperCase()}
              </div>
            </Link>

            <button
              className="btn btn-outline-danger btn-sm py-1 px-2"
              onClick={logout}
              title="Sign Out"
            >
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;