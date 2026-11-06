import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-white border-top py-3 mt-auto">
      <div className="container-fluid px-4 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
        <div className="small text-muted">
          &copy; {new Date().getFullYear()} <strong className="text-primary">CareerAI</strong>. All rights reserved.
        </div>
        <div className="d-flex gap-3 small text-muted">
          <Link to="/dashboard" className="text-decoration-none text-muted hover-primary">
            Dashboard
          </Link>
          <Link to="/jobs" className="text-decoration-none text-muted hover-primary">
            Jobs
          </Link>
          <Link to="/applications" className="text-decoration-none text-muted hover-primary">
            Applications
          </Link>
          <Link to="/mock-interview" className="text-decoration-none text-muted hover-primary">
            Mock Interview
          </Link>
          <Link to="/profile" className="text-decoration-none text-muted hover-primary">
            Profile
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;