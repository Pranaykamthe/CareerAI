import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: '#1E1273',
        color: '#E0E7FF',
        paddingTop: '3.5rem',
        paddingBottom: '2.5rem',
      }}
      className="mt-auto position-relative"
    >
      <div className="container text-center">
        {/* Brand Header */}
        <div className="mb-3">
          <Link
            to="/dashboard"
            className="text-decoration-none fw-bold"
            style={{ fontSize: '1.75rem', letterSpacing: '0.5px' }}
          >
            <span style={{ color: '#4F75FF' }}>Career</span>
            <span style={{ color: '#FBBF24' }}>AI</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 gap-md-4 mb-4 small">
          <Link to="#" className="text-decoration-none text-light opacity-75 hover-opacity-100">
            For Institution
          </Link>
          <Link to="#" className="text-decoration-none text-light opacity-75 hover-opacity-100">
            About
          </Link>
          <Link to="#" className="text-decoration-none text-light opacity-75 hover-opacity-100">
            Blog
          </Link>
          <Link to="#" className="text-decoration-none text-light opacity-75 hover-opacity-100">
            Pricing
          </Link>
          <Link to="#" className="text-decoration-none text-light opacity-75 hover-opacity-100">
            Hire a VA
          </Link>
          <Link to="#" className="text-decoration-none text-light opacity-75 hover-opacity-100">
            Privacy Policy
          </Link>
          <Link to="#" className="text-decoration-none text-light opacity-75 hover-opacity-100">
            Terms & Conditions
          </Link>
          <Link to="#" className="text-decoration-none text-light opacity-75 hover-opacity-100">
            Contact
          </Link>
          <Link to="#" className="text-decoration-none text-light opacity-75 hover-opacity-100">
            FAQ
          </Link>
        </div>

        {/* Social / Contact Icons */}
        <div className="d-flex justify-content-center align-items-center gap-2 mb-4">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noreferrer"
            className="btn text-white d-inline-flex align-items-center justify-content-center"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              fontSize: '1.1rem',
            }}
          >
            <i className="bi bi-facebook"></i>
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="btn text-white d-inline-flex align-items-center justify-content-center"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              fontSize: '1.1rem',
            }}
          >
            <i className="bi bi-instagram"></i>
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noreferrer"
            className="btn text-white d-inline-flex align-items-center justify-content-center"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              fontSize: '1.1rem',
            }}
          >
            <i className="bi bi-linkedin"></i>
          </a>
          <a
            href="mailto:support@careerai.com"
            className="btn text-white d-inline-flex align-items-center justify-content-center"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              fontSize: '1.1rem',
            }}
          >
            <i className="bi bi-envelope"></i>
          </a>
        </div>

        {/* Thin Divider Line */}
        <div
          className="mx-auto mb-4"
          style={{
            maxWidth: '1100px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        ></div>

        {/* Copyright Notice */}
        <div className="small text-light opacity-50">
          &copy; 2026 CareerAI. All rights reserved.
        </div>
      </div>

      {/* Floating Support Chat Trigger */}
      <div
        className="position-absolute d-flex align-items-center justify-content-center shadow-lg"
        style={{
          bottom: '24px',
          left: '24px',
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          backgroundColor: '#432CE6',
          cursor: 'pointer',
        }}
        title="Support Chat"
      >
        <i className="bi bi-chat-fill text-white fs-5"></i>
      </div>
    </footer>
  );
};

export default Footer;