import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer
      className="bg-white mt-auto"
      style={{
        borderTop: '1px solid #E2E8F0',
        color: '#475569',
      }}
    >
      <div className="container-fluid px-3 px-lg-5 pt-5 pb-4">
        <div className="row g-4 justify-content-between">
          {/* Left Column: CareerAI Brand, Tagline & Social Links */}
          <div className="col-12 col-lg-4">
            <Link
              to="/dashboard"
              className="text-decoration-none d-inline-flex align-items-center gap-2 mb-3"
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
              <span
                className="fw-bold fs-5"
                style={{ letterSpacing: '-0.02em', color: '#0F172A' }}
              >
                Career<span style={{ color: '#4F46E5' }}>AI</span>
              </span>
            </Link>

            <p
              className="small mb-4"
              style={{ color: '#64748B', maxWidth: '330px', lineHeight: '1.6' }}
            >
              AI-powered career intelligence for resume optimization, smart job matching, and mock interviews.
            </p>

            {/* Rounded Social Icon Buttons */}
            <div className="d-flex align-items-center gap-2">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="btn btn-sm d-inline-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: '#F1F5F9',
                  color: '#334155',
                  border: '1px solid #E2E8F0',
                }}
              >
                <i className="bi bi-linkedin"></i>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X"
                className="btn btn-sm d-inline-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: '#F1F5F9',
                  color: '#334155',
                  border: '1px solid #E2E8F0',
                }}
              >
                <i className="bi bi-twitter-x"></i>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="btn btn-sm d-inline-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: '#F1F5F9',
                  color: '#334155',
                  border: '1px solid #E2E8F0',
                }}
              >
                <i className="bi bi-github"></i>
              </a>
            </div>
          </div>

          {/* Right Side: 3 Structured Workspace Columns */}
          <div className="col-12 col-lg-7">
            <div className="row g-4">
              {/* Column 1: Resume & Jobs */}
              <div className="col-6 col-sm-4">
                <h6
                  className="fw-bold mb-3"
                  style={{ fontSize: '13.5px', color: '#0F172A' }}
                >
                  Workspace
                </h6>
                <ul className="list-unstyled d-flex flex-column gap-2 mb-0 small">
                  <li>
                    <Link
                      to="/dashboard"
                      className="text-decoration-none"
                      style={{ color: '#64748B' }}
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/resume-analyzer"
                      className="text-decoration-none"
                      style={{ color: '#64748B' }}
                    >
                      ATS Score Analyzer
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/resume-builder"
                      className="text-decoration-none"
                      style={{ color: '#64748B' }}
                    >
                      AI Resume Builder
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/job-matching"
                      className="text-decoration-none"
                      style={{ color: '#64748B' }}
                    >
                      Smart Job Matching
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 2: Interview AI */}
              <div className="col-6 col-sm-4">
                <h6
                  className="fw-bold mb-3"
                  style={{ fontSize: '13.5px', color: '#0F172A' }}
                >
                  Interview AI
                </h6>
                <ul className="list-unstyled d-flex flex-column gap-2 mb-0 small">
                  <li>
                    <Link
                      to="/interview-prep"
                      className="text-decoration-none"
                      style={{ color: '#64748B' }}
                    >
                      Interview Prep Hub
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/mock-interview"
                      className="text-decoration-none"
                      style={{ color: '#64748B' }}
                    >
                      Live Mock Interview
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/question-bank"
                      className="text-decoration-none"
                      style={{ color: '#64748B' }}
                    >
                      Question Bank
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/interview-history"
                      className="text-decoration-none"
                      style={{ color: '#64748B' }}
                    >
                      Session History
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 3: Account */}
              <div className="col-6 col-sm-4">
                <h6
                  className="fw-bold mb-3"
                  style={{ fontSize: '13.5px', color: '#0F172A' }}
                >
                  Account
                </h6>
                <ul className="list-unstyled d-flex flex-column gap-2 mb-0 small">
                  <li>
                    <Link
                      to="/applications"
                      className="text-decoration-none"
                      style={{ color: '#64748B' }}
                    >
                      Application Tracker
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/profile"
                      className="text-decoration-none"
                      style={{ color: '#64748B' }}
                    >
                      My Profile &amp; Photo
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/"
                      className="text-decoration-none"
                      style={{ color: '#64748B' }}
                    >
                      Homepage
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Divider & Live Status Pill */}
        <div
          className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 pt-4 mt-4"
          style={{ borderTop: '1px solid #E2E8F0' }}
        >
          <div className="small" style={{ color: '#64748B' }}>
            &copy; {new Date().getFullYear()} CareerAI. All rights reserved.
          </div>

          <div
            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill small fw-medium"
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#334155',
              fontSize: '12.5px',
            }}
          >
            <span
              className="rounded-circle d-inline-block"
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#10B981',
                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.18)',
              }}
            ></span>
            All Systems Operational
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;