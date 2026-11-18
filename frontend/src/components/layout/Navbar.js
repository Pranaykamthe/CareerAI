import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [openMenu, setOpenMenu] = useState(null); // 'resume' | 'jobs' | 'interview' | 'profile' | null
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);

  // Close open dropdowns when clicking outside or changing route
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (menuName) => {
    setOpenMenu((prev) => (prev === menuName ? null : menuName));
  };

  const handleLogout = () => {
    setOpenMenu(null);
    logout();
    navigate('/login');
  };

  // Active route matchers
  const isDashboardActive = location.pathname === '/dashboard';
  const isResumeActive = ['/resumes', '/resume-analyzer', '/resume-builder'].includes(
    location.pathname
  );
  const isJobsActive = ['/jobs', '/job-descriptions', '/job-matching', '/matches'].includes(
    location.pathname
  );
  const isApplicationsActive = location.pathname === '/applications';
  const isInterviewActive =
    ['/interview-prep', '/mock-interview', '/question-bank', '/interview-history', '/interviews/history', '/history'].includes(
      location.pathname
    ) || location.pathname.startsWith('/interview-report');

  const getPillStyle = (active) => ({
    backgroundColor: active ? '#EEF2FF' : 'transparent',
    color: active ? '#4F46E5' : '#334155',
    borderRadius: '9999px',
    padding: '7px 14px',
    fontSize: '13.5px',
    fontWeight: active ? 600 : 500,
    transition: 'all 0.15s ease',
    border: 'none',
  });

  const getDropdownItemClass = (paths) => {
    const active = Array.isArray(paths)
      ? paths.includes(location.pathname)
      : location.pathname === paths;
    return `dropdown-item d-flex align-items-start gap-2 py-2 px-3 rounded-3 ${
      active ? 'fw-semibold' : ''
    }`;
  };

  const getDropdownItemStyle = (paths) => {
    const active = Array.isArray(paths)
      ? paths.includes(location.pathname)
      : location.pathname === paths;
    return {
      backgroundColor: active ? '#EEF2FF' : 'transparent',
      color: active ? '#4F46E5' : '#1E293B',
    };
  };

  const userInitial = (user?.username || user?.email || 'C')[0].toUpperCase();

  return (
    <header
      ref={navRef}
      className="sticky-top"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        zIndex: 1030,
      }}
    >
      <div className="container-fluid px-3 px-lg-4">
        <div
          className="d-flex align-items-center justify-content-between"
          style={{ height: '64px' }}
        >
          {/* Left: CareerAI Brand Logo */}
          <Link
            to="/dashboard"
            className="text-decoration-none d-inline-flex align-items-center gap-2 flex-shrink-0"
          >
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-3 shadow-sm"
              style={{
                width: '34px',
                height: '34px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                color: '#FFFFFF',
              }}
            >
              <i className="bi bi-layers-fill" style={{ fontSize: '16px' }}></i>
            </div>
            <span className="fw-bold fs-5" style={{ letterSpacing: '-0.02em', color: '#0F172A' }}>
              Career<span style={{ color: '#4F46E5' }}>AI</span>
            </span>
          </Link>

          {/* Center: Desktop 5-Hub Pill Navigation */}
          <nav className="d-none d-lg-flex align-items-center gap-1 mx-3">
            {/* 1. Dashboard */}
            <Link
              to="/dashboard"
              className="text-decoration-none d-inline-flex align-items-center gap-2 text-nowrap"
              style={getPillStyle(isDashboardActive)}
            >
              <i className="bi bi-grid-1x2-fill"></i>
              <span>Dashboard</span>
            </Link>

            {/* 2. Resume Studio Dropdown */}
            <div className="position-relative">
              <button
                type="button"
                className="d-inline-flex align-items-center gap-2 text-nowrap"
                style={getPillStyle(isResumeActive)}
                onClick={() => toggleMenu('resume')}
              >
                <i className="bi bi-file-earmark-text"></i>
                <span>Resume Studio</span>
                <i
                  className={`bi bi-chevron-down small transition ${
                    openMenu === 'resume' ? 'rotate-180' : ''
                  }`}
                  style={{ fontSize: '11px' }}
                ></i>
              </button>

              {openMenu === 'resume' && (
                <div
                  className="position-absolute start-0 mt-2 bg-white p-2 shadow-lg"
                  style={{
                    width: '275px',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    zIndex: 1050,
                  }}
                >
                  <Link
                    to="/resumes"
                    className={getDropdownItemClass('/resumes')}
                    style={getDropdownItemStyle('/resumes')}
                  >
                    <i className="bi bi-folder2-open mt-1" style={{ color: '#4F46E5' }}></i>
                    <div>
                      <div className="small fw-semibold">My Resumes</div>
                      <div className="text-muted" style={{ fontSize: '11.5px' }}>
                        Upload, manage & set primary CV
                      </div>
                    </div>
                  </Link>
                  <Link
                    to="/resume-analyzer"
                    className={getDropdownItemClass('/resume-analyzer')}
                    style={getDropdownItemStyle('/resume-analyzer')}
                  >
                    <i className="bi bi-speedometer2 mt-1" style={{ color: '#4F46E5' }}></i>
                    <div>
                      <div className="small fw-semibold">ATS Score Analyzer</div>
                      <div className="text-muted" style={{ fontSize: '11.5px' }}>
                        Keyword audit & formatting check
                      </div>
                    </div>
                  </Link>
                  <Link
                    to="/resume-builder"
                    className={getDropdownItemClass('/resume-builder')}
                    style={getDropdownItemStyle('/resume-builder')}
                  >
                    <i className="bi bi-magic mt-1" style={{ color: '#4F46E5' }}></i>
                    <div>
                      <div className="small fw-semibold d-flex align-items-center gap-1">
                        AI Resume Builder
                        <span
                          className="badge rounded-pill"
                          style={{
                            backgroundColor: '#EEF2FF',
                            color: '#4F46E5',
                            fontSize: '10px',
                          }}
                        >
                          AI
                        </span>
                      </div>
                      <div className="text-muted" style={{ fontSize: '11.5px' }}>
                        Live A4 editor with Groq rewrites
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* 3. Jobs & Match Dropdown */}
            <div className="position-relative">
              <button
                type="button"
                className="d-inline-flex align-items-center gap-2 text-nowrap"
                style={getPillStyle(isJobsActive)}
                onClick={() => toggleMenu('jobs')}
              >
                <i className="bi bi-briefcase"></i>
                <span>Jobs & Match</span>
                <i className="bi bi-chevron-down" style={{ fontSize: '11px' }}></i>
              </button>

              {openMenu === 'jobs' && (
                <div
                  className="position-absolute start-0 mt-2 bg-white p-2 shadow-lg"
                  style={{
                    width: '265px',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    zIndex: 1050,
                  }}
                >
                  <Link
                    to="/jobs"
                    className={getDropdownItemClass(['/jobs', '/job-descriptions'])}
                    style={getDropdownItemStyle(['/jobs', '/job-descriptions'])}
                  >
                    <i className="bi bi-search mt-1" style={{ color: '#4F46E5' }}></i>
                    <div>
                      <div className="small fw-semibold">Browse Job Catalog</div>
                      <div className="text-muted" style={{ fontSize: '11.5px' }}>
                        Explore open roles & descriptions
                      </div>
                    </div>
                  </Link>
                  <Link
                    to="/job-matching"
                    className={getDropdownItemClass(['/job-matching', '/matches'])}
                    style={getDropdownItemStyle(['/job-matching', '/matches'])}
                  >
                    <i className="bi bi-bullseye mt-1" style={{ color: '#4F46E5' }}></i>
                    <div>
                      <div className="small fw-semibold">Smart Job Matching</div>
                      <div className="text-muted" style={{ fontSize: '11.5px' }}>
                        AI compatibility scores & skill gaps
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* 4. Applications */}
            <Link
              to="/applications"
              className="text-decoration-none d-inline-flex align-items-center gap-2 text-nowrap"
              style={getPillStyle(isApplicationsActive)}
            >
              <i className="bi bi-kanban"></i>
              <span>Applications</span>
            </Link>

            {/* 5. Interview AI Dropdown */}
            <div className="position-relative">
              <button
                type="button"
                className="d-inline-flex align-items-center gap-2 text-nowrap"
                style={getPillStyle(isInterviewActive)}
                onClick={() => toggleMenu('interview')}
              >
                <i className="bi bi-mic"></i>
                <span>Interview AI</span>
                <i className="bi bi-chevron-down" style={{ fontSize: '11px' }}></i>
              </button>

              {openMenu === 'interview' && (
                <div
                  className="position-absolute start-0 mt-2 bg-white p-2 shadow-lg"
                  style={{
                    width: '275px',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    zIndex: 1050,
                  }}
                >
                  <Link
                    to="/interview-prep"
                    className={getDropdownItemClass('/interview-prep')}
                    style={getDropdownItemStyle('/interview-prep')}
                  >
                    <i className="bi bi-stars mt-1" style={{ color: '#4F46E5' }}></i>
                    <div>
                      <div className="small fw-semibold">Interview Prep Hub</div>
                      <div className="text-muted" style={{ fontSize: '11.5px' }}>
                        STAR framework & role tracks
                      </div>
                    </div>
                  </Link>
                  <Link
                    to="/mock-interview"
                    className={getDropdownItemClass('/mock-interview')}
                    style={getDropdownItemStyle('/mock-interview')}
                  >
                    <i className="bi bi-camera-video mt-1" style={{ color: '#4F46E5' }}></i>
                    <div>
                      <div className="small fw-semibold">Live AI Mock Interview</div>
                      <div className="text-muted" style={{ fontSize: '11.5px' }}>
                        Real-time Q&A with instant grading
                      </div>
                    </div>
                  </Link>
                  <Link
                    to="/question-bank"
                    className={getDropdownItemClass('/question-bank')}
                    style={getDropdownItemStyle('/question-bank')}
                  >
                    <i className="bi bi-collection-play mt-1" style={{ color: '#4F46E5' }}></i>
                    <div>
                      <div className="small fw-semibold">Question Bank</div>
                      <div className="text-muted" style={{ fontSize: '11.5px' }}>
                        Curated HR, Behavioral & Tech bank
                      </div>
                    </div>
                  </Link>
                  <Link
                    to="/interview-history"
                    className={getDropdownItemClass([
                      '/interview-history',
                      '/interviews/history',
                      '/history',
                    ])}
                    style={getDropdownItemStyle([
                      '/interview-history',
                      '/interviews/history',
                      '/history',
                    ])}
                  >
                    <i className="bi bi-clock-history mt-1" style={{ color: '#4F46E5' }}></i>
                    <div>
                      <div className="small fw-semibold">Session History & Reports</div>
                      <div className="text-muted" style={{ fontSize: '11.5px' }}>
                        Past transcripts & readiness trends
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Right: Quick Upload CTA + Profile Pill + Mobile Hamburger */}
          <div className="d-flex align-items-center gap-2 gap-md-3 flex-shrink-0">
            {/* Quick Upload Resume Button */}
            <Link
              to="/resumes"
              className="btn btn-sm d-none d-sm-inline-flex align-items-center gap-1 fw-semibold text-white text-nowrap shadow-sm"
              style={{
                backgroundColor: '#4F46E5',
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '13px',
              }}
            >
              <i className="bi bi-cloud-arrow-up"></i>
              <span>Quick Upload</span>
            </Link>

            {/* User Profile Pill & Dropdown */}
            <div className="position-relative">
              <button
                type="button"
                onClick={() => toggleMenu('profile')}
                className="d-inline-flex align-items-center gap-2 bg-white text-dark"
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '9999px',
                  padding: '4px 10px 4px 5px',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div
                  className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold"
                  style={{
                    width: '30px',
                    height: '30px',
                    fontSize: '13px',
                    backgroundColor: '#4F46E5',
                  }}
                >
                  {userInitial}
                </div>
                <span
                  className="small fw-semibold text-dark d-none d-md-inline text-truncate"
                  style={{ maxWidth: '110px' }}
                >
                  {user?.username || 'Candidate'}
                </span>
                <i className="bi bi-chevron-down text-muted" style={{ fontSize: '11px' }}></i>
              </button>

              {openMenu === 'profile' && (
                <div
                  className="position-absolute end-0 mt-2 bg-white p-2 shadow-lg"
                  style={{
                    width: '240px',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    zIndex: 1050,
                  }}
                >
                  <div className="px-3 py-2 border-bottom mb-1">
                    <div className="small fw-bold text-dark text-truncate">
                      {user?.username || 'Candidate'}
                    </div>
                    <div className="text-muted text-truncate" style={{ fontSize: '11.5px' }}>
                      {user?.email || 'candidate@careerai.com'}
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded-3 small fw-medium text-dark"
                  >
                    <i className="bi bi-person-circle" style={{ color: '#4F46E5' }}></i>
                    My Profile & Skills
                  </Link>

                  <Link
                    to="/resume-builder"
                    className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded-3 small fw-medium text-dark"
                  >
                    <i className="bi bi-file-earmark-richtext" style={{ color: '#4F46E5' }}></i>
                    AI Resume Builder
                  </Link>

                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded-3 small fw-medium text-dark"
                    >
                      <i className="bi bi-shield-lock" style={{ color: '#4F46E5' }}></i>
                      Admin Control Panel
                    </Link>
                  )}

                  <div className="border-top my-1"></div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded-3 small fw-semibold text-danger"
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Drawer Toggle Button */}
            <button
              type="button"
              className="btn btn-sm d-lg-none border"
              style={{ borderRadius: '10px', borderColor: '#E2E8F0' }}
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              <i className={`bi ${mobileOpen ? 'bi-x-lg' : 'bi-list'} fs-5 text-dark`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Drawer */}
      {mobileOpen && (
        <div
          className="d-lg-none bg-white border-top px-3 py-3 shadow-sm"
          style={{ borderColor: '#E2E8F0' }}
        >
          <div className="d-flex flex-column gap-1">
            <Link
              to="/dashboard"
              className="text-decoration-none px-3 py-2 rounded-3 small fw-semibold"
              style={getPillStyle(isDashboardActive)}
            >
              <i className="bi bi-grid-1x2-fill me-2"></i> Dashboard
            </Link>

            <div className="px-3 pt-2 pb-1 text-uppercase text-muted fw-bold" style={{ fontSize: '10px' }}>
              Resume Studio
            </div>
            <Link to="/resumes" className="text-decoration-none px-3 py-2 rounded-3 small text-dark">
              <i className="bi bi-folder2-open me-2 text-primary"></i> My Resumes
            </Link>
            <Link to="/resume-analyzer" className="text-decoration-none px-3 py-2 rounded-3 small text-dark">
              <i className="bi bi-speedometer2 me-2 text-primary"></i> ATS Score Analyzer
            </Link>
            <Link to="/resume-builder" className="text-decoration-none px-3 py-2 rounded-3 small text-dark">
              <i className="bi bi-magic me-2 text-primary"></i> AI Resume Builder
            </Link>

            <div className="px-3 pt-2 pb-1 text-uppercase text-muted fw-bold" style={{ fontSize: '10px' }}>
              Jobs & Tracking
            </div>
            <Link to="/jobs" className="text-decoration-none px-3 py-2 rounded-3 small text-dark">
              <i className="bi bi-briefcase me-2 text-primary"></i> Browse Jobs
            </Link>
            <Link to="/job-matching" className="text-decoration-none px-3 py-2 rounded-3 small text-dark">
              <i className="bi bi-bullseye me-2 text-primary"></i> Smart Job Matching
            </Link>
            <Link to="/applications" className="text-decoration-none px-3 py-2 rounded-3 small text-dark">
              <i className="bi bi-kanban me-2 text-primary"></i> Applications Tracker
            </Link>

            <div className="px-3 pt-2 pb-1 text-uppercase text-muted fw-bold" style={{ fontSize: '10px' }}>
              Interview AI
            </div>
            <Link to="/interview-prep" className="text-decoration-none px-3 py-2 rounded-3 small text-dark">
              <i className="bi bi-stars me-2 text-primary"></i> Interview Prep Hub
            </Link>
            <Link to="/mock-interview" className="text-decoration-none px-3 py-2 rounded-3 small text-dark">
              <i className="bi bi-camera-video me-2 text-primary"></i> AI Mock Interview
            </Link>
            <Link to="/question-bank" className="text-decoration-none px-3 py-2 rounded-3 small text-dark">
              <i className="bi bi-collection-play me-2 text-primary"></i> Question Bank
            </Link>
            <Link to="/interview-history" className="text-decoration-none px-3 py-2 rounded-3 small text-dark">
              <i className="bi bi-clock-history me-2 text-primary"></i> Session History
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;