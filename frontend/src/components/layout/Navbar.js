import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => (location.pathname === path ? 'active fw-semibold text-primary' : 'text-dark');

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top py-2 px-3 px-md-4 shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center text-primary fw-bold fs-4" to="/dashboard">
          <i className="bi bi-layers-fill me-2"></i>CareerAI
        </Link>
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

        <div className="collapse navbar-collapse" id="careeraiNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3 gap-lg-1">
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/dashboard')}`} to="/dashboard">
                <i className="bi bi-grid-1x2-fill me-1"></i> Dashboard
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/resumes')}`} to="/resumes">
                <i className="bi bi-file-earmark-person me-1"></i> Resumes
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/resume-analyzer')}`} to="/resume-analyzer">
                <i className="bi bi-speedometer2 me-1"></i> ATS Analyzer
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/jobs')}`} to="/jobs">
                <i className="bi bi-briefcase me-1"></i> Jobs
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/job-matching')}`} to="/job-matching">
                <i className="bi bi-bullseye me-1"></i> Job Matching
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/applications')}`} to="/applications">
                <i className="bi bi-kanban me-1"></i> Applications
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/question-bank')}`} to="/question-bank">
                <i className="bi bi-collection-play-fill me-1"></i> Question Bank
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/mock-interview')}`} to="/mock-interview">
                <i className="bi bi-mic-fill me-1"></i> Mock Interview
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/profile')}`} to="/profile">
                <i className="bi bi-person-circle me-1"></i> Profile
              </Link>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            {/* Clickable Profile Navigation Section */}
            <Link
              to="/profile"
              className="d-flex align-items-center gap-2 text-decoration-none link-dark"
              title="View & Edit Profile"
              style={{ cursor: 'pointer' }}
            >
              <div className="text-end d-none d-sm-block">
                <div className="small fw-bold text-dark">{user?.username || 'Candidate'}</div>
                <div className="text-muted" style={{ fontSize: '11px' }}>{user?.email}</div>
              </div>
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
                style={{
                  width: '38px',
                  height: '38px',
                  fontSize: '14px',
                  transition: 'transform 0.15s ease-in-out',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {(user?.username || 'C')[0].toUpperCase()}
              </div>
            </Link>

            {/* Logout Action */}
            <button className="btn btn-outline-danger btn-sm" onClick={logout} title="Sign Out">
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};