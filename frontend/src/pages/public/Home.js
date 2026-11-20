import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CORE_PRODUCTS = [
  {
    icon: 'bi-magic',
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
    badge: 'Resume Studio',
    title: 'AI Resume Builder',
    description:
      'Draft ATS-compliant resumes from scratch with a live A4 preview, section-by-section editing, Groq AI bullet rewriting, and instant DOCX export.',
    tags: ['Live A4 Preview', 'AI Bullet Rewriter', 'DOCX Export'],
  },
  {
    icon: 'bi-speedometer2',
    iconBg: '#ECFDF5',
    iconColor: '#10B981',
    badge: 'Diagnostics',
    title: 'ATS Resume Analyzer',
    description:
      'Upload PDF or DOCX resumes to parse sections automatically, calculate deterministic ATS compatibility scores, and fix formatting gaps.',
    tags: ['PDF & DOCX Parser', '0–100 ATS Gauge', 'Gap Audit'],
  },
  {
    icon: 'bi-bullseye',
    iconBg: '#F5F3FF',
    iconColor: '#7C3AED',
    badge: 'Career Discovery',
    title: 'Smart Job Matching',
    description:
      'Measure weighted resume-to-job compatibility across skills, experience, and keywords with mandatory vs. preferred skill gap breakdowns.',
    tags: ['Compatibility %', 'JD Parser', 'Skill Gap Radar'],
  },
  {
    icon: 'bi-kanban',
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
    badge: 'Pipeline',
    title: 'Kanban Application Tracker',
    description:
      'Manage your entire job search across 6 visual pipeline stages (Saved, Applied, Screening, Interview, Offer, Rejected) with notes and match scores.',
    tags: ['6-Stage Kanban', 'Table View', 'Role Notes'],
  },
  {
    icon: 'bi-mic-fill',
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
    badge: 'Interview AI',
    title: 'AI Mock Interview & Prep',
    description:
      'Practice Technical, HR, and Behavioral (STAR) interviews in timed sessions evaluated turn-by-turn by Groq LLM with model answers.',
    tags: ['STAR Rubric', 'Question Bank', 'Scorecards'],
  },
  {
    icon: 'bi-graph-up-arrow',
    iconBg: '#FDF2F8',
    iconColor: '#DB2777',
    badge: 'Analytics',
    title: 'Readiness & Admin Portals',
    description:
      'Track career readiness trends, ATS improvements, and interview history on your personal dashboard, backed by a full Admin control panel.',
    tags: ['Chart.js Insights', 'Session History', 'JWT Security'],
  },
];

const WORKFLOW_STEPS = [
  {
    num: '01',
    title: 'Upload or Build Resume',
    desc: 'Import a PDF/DOCX file or draft a structured resume in the live builder.',
  },
  {
    num: '02',
    title: 'Run ATS Analysis',
    desc: 'Get an instant 0–100 ATS score with section-by-section strength diagnostics.',
  },
  {
    num: '03',
    title: 'Match With Jobs',
    desc: 'Compare your profile against target roles and spot missing skills.',
  },
  {
    num: '04',
    title: 'Optimize & Track',
    desc: 'Apply AI bullet improvements and organize applications on the Kanban board.',
  },
  {
    num: '05',
    title: 'Ace Mock Interviews',
    desc: 'Practice timed AI interviews and review detailed performance reports.',
  },
];

const BENEFITS = [
  {
    icon: 'bi-lightning-charge-fill',
    color: '#4F46E5',
    bg: '#EEF2FF',
    title: 'Save Hours of Prep',
    desc: 'Automate resume audits, keyword checks, and interview practice in one workspace.',
  },
  {
    icon: 'bi-check2-circle',
    color: '#10B981',
    bg: '#ECFDF5',
    title: 'Pass ATS Filters',
    desc: 'Eliminate formatting blind spots and missing keywords before applying.',
  },
  {
    icon: 'bi-bar-chart-line-fill',
    color: '#2563EB',
    bg: '#EFF6FF',
    title: 'Data-Driven Decisions',
    desc: 'Prioritize roles where your skill alignment and compatibility score are highest.',
  },
  {
    icon: 'bi-chat-square-heart-fill',
    color: '#7C3AED',
    bg: '#F5F3FF',
    title: 'Build Confidence',
    desc: 'Rehearse behavioral and technical questions with structured AI coaching.',
  },
  {
    icon: 'bi-trophy-fill',
    color: '#D97706',
    bg: '#FFFBEB',
    title: 'Centralized Tracking',
    desc: 'Keep resumes, match reports, interview transcripts, and job stages organized.',
  },
];

const FAQS = [
  {
    q: 'How does CareerAI calculate my ATS Resume Score?',
    a: 'CareerAI parses your uploaded PDF or DOCX file to evaluate contact completeness, section structure, action verbs, quantifiable impact, and technical skill density—producing an objective 0–100 score alongside actionable fixes.',
  },
  {
    q: 'How accurate is the Smart Job Matching and Skill Gap engine?',
    a: 'The matching engine compares your extracted resume skills, experience level, and keywords against each job description using weighted scoring, separating matched skills from mandatory and preferred missing skills.',
  },
  {
    q: 'How do the AI Mock Interviews work?',
    a: 'You choose a target job role, interview category (Technical, HR, Behavioral STAR, or Mixed), and difficulty level. Groq AI evaluates each answer in real time with a score out of 100, strengths, areas to improve, and a suggested model answer.',
  },
  {
    q: 'Which file formats are supported for resume upload and export?',
    a: 'You can upload existing resumes in PDF (.pdf) or Microsoft Word (.docx) format, and export newly drafted resumes directly from the AI Resume Builder as clean ATS-friendly DOCX documents.',
  },
  {
    q: 'What is the purpose of the CareerAI project?',
    a: 'CareerAI was built as a full-stack career intelligence platform to unify resume optimization, job compatibility analytics, application tracking, and AI-assisted interview coaching into a single accessible web application.',
  },
];

const Home = () => {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState(0);

  const dashboardRoute = user?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#F8FAFC', color: '#0F172A' }}>
      {/* Light Frosted SaaS Top Navbar */}
      <header
        className="sticky-top"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E2E8F0',
          zIndex: 1030,
        }}
      >
        <div className="container py-3 d-flex align-items-center justify-content-between">
          <Link to="/" className="text-decoration-none d-inline-flex align-items-center gap-2">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-3 shadow-sm"
              style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                color: '#FFFFFF',
              }}
            >
              <i className="bi bi-layers-fill fs-5"></i>
            </div>
            <span className="fw-bold fs-4" style={{ letterSpacing: '-0.02em', color: '#0F172A' }}>
              Career<span style={{ color: '#4F46E5' }}>AI</span>
            </span>
          </Link>

          <nav className="d-none d-md-flex align-items-center gap-4 small fw-medium">
            <a href="#products" className="text-decoration-none" style={{ color: '#475569' }}>
              Features &amp; Products
            </a>
            <a href="#how-it-works" className="text-decoration-none" style={{ color: '#475569' }}>
              How It Works
            </a>
            <a href="#purpose" className="text-decoration-none" style={{ color: '#475569' }}>
              Project Purpose
            </a>
            <a href="#faq" className="text-decoration-none" style={{ color: '#475569' }}>
              FAQ
            </a>
          </nav>

          <div className="d-flex align-items-center gap-2">
            {user ? (
              <Link
                to={dashboardRoute}
                className="btn btn-primary btn-sm px-3 py-2 d-inline-flex align-items-center gap-2"
              >
                <i className="bi bi-speedometer2"></i>
                {user.role === 'admin' ? 'Admin Panel' : 'Go to Dashboard'}
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-sm fw-semibold px-3 py-2"
                  style={{ color: '#334155', backgroundColor: 'transparent' }}
                >
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm px-3 py-2 shadow-sm">
                  Get Started <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with Floating Dashboard Mockup */}
      <section
        className="py-5 position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #EEF2FF 0%, #F8FAFC 100%)',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div className="container py-3 py-lg-5">
          <div className="row align-items-center g-5">
            {/* Left Copy */}
            <div className="col-lg-6">
              <div
                className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill small fw-semibold mb-3"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#4F46E5',
                  border: '1px solid #C7D2FE',
                  boxShadow: '0 2px 6px rgba(79, 70, 229, 0.08)',
                }}
              >
                <i className="bi bi-stars"></i> AI-Powered Career Intelligence Platform
              </div>

              <h1
                className="display-5 fw-bold mb-3"
                style={{ letterSpacing: '-0.025em', lineHeight: 1.15, color: '#0F172A' }}
              >
                Build a Resume That <span style={{ color: '#4F46E5' }}>Gets Noticed.</span>
              </h1>

              <p className="lead mb-4" style={{ color: '#475569', fontSize: '1.08rem', lineHeight: 1.65 }}>
                CareerAI uses deterministic ATS scoring and Groq LLM intelligence to analyze your resume, match you
                with high-fit roles, pinpoint skill gaps, and prepare you with realistic AI mock interviews.
              </p>

              <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
                <Link
                  to={user ? dashboardRoute : '/register'}
                  className="btn btn-primary btn-lg px-4 py-2 shadow-sm"
                >
                  {user ? 'Open Your Workspace' : 'Get Started Free'}{' '}
                  <i className="bi bi-arrow-right ms-1"></i>
                </Link>
                <a
                  href="#products"
                  className="btn btn-lg bg-white fw-semibold px-4 py-2"
                  style={{
                    color: '#0F172A',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                  }}
                >
                  Explore Features
                </a>
              </div>

              <div className="d-flex flex-wrap align-items-center gap-3 pt-2 small" style={{ color: '#64748B' }}>
                <div className="d-flex align-items-center gap-1">
                  <i className="bi bi-check-circle-fill text-success"></i> Instant ATS Diagnostics
                </div>
                <span>•</span>
                <div className="d-flex align-items-center gap-1">
                  <i className="bi bi-check-circle-fill text-success"></i> Skill Gap Analysis
                </div>
                <span>•</span>
                <div className="d-flex align-items-center gap-1">
                  <i className="bi bi-check-circle-fill text-success"></i> AI Mock Interviews
                </div>
              </div>
            </div>

            {/* Right Interactive UI Preview Window */}
            <div className="col-lg-6">
              <div
                className="bg-white rounded-4 p-3 p-md-4 shadow-lg"
                style={{ border: '1px solid #E2E8F0' }}
              >
                {/* Browser Top Bar */}
                <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <span className="rounded-circle bg-danger d-inline-block" style={{ width: '10px', height: '10px' }}></span>
                    <span className="rounded-circle bg-warning d-inline-block" style={{ width: '10px', height: '10px' }}></span>
                    <span className="rounded-circle bg-success d-inline-block" style={{ width: '10px', height: '10px' }}></span>
                    <span className="ms-2 small fw-semibold text-muted">CareerAI Workspace Preview</span>
                  </div>
                  <span
                    className="badge rounded-pill px-2 py-1 fw-semibold"
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11px' }}
                  >
                    Live AI Suite
                  </span>
                </div>

                {/* Top KPI Mini Cards */}
                <div className="row g-2 mb-3">
                  <div className="col-4">
                    <div className="p-2 p-sm-3 rounded-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div className="small text-muted mb-1" style={{ fontSize: '11px' }}>ATS Score</div>
                      <div className="fw-bold fs-5" style={{ color: '#10B981' }}>88<span className="fs-6 text-muted">/100</span></div>
                      <div className="small text-success fw-medium" style={{ fontSize: '11px' }}>Excellent</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2 p-sm-3 rounded-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div className="small text-muted mb-1" style={{ fontSize: '11px' }}>Top Job Match</div>
                      <div className="fw-bold fs-5" style={{ color: '#4F46E5' }}>92%</div>
                      <div className="small fw-medium" style={{ fontSize: '11px', color: '#4F46E5' }}>High Fit</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-2 p-sm-3 rounded-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div className="small text-muted mb-1" style={{ fontSize: '11px' }}>Interview AI</div>
                      <div className="fw-bold fs-5" style={{ color: '#2563EB' }}>86%</div>
                      <div className="small text-primary fw-medium" style={{ fontSize: '11px' }}>Ready</div>
                    </div>
                  </div>
                </div>

                {/* Middle Split: Top Job Matches & AI Suggestions */}
                <div className="row g-2">
                  <div className="col-sm-6">
                    <div className="p-3 rounded-3 h-100" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div className="small fw-bold text-dark mb-2">Top Job Matches</div>
                      <div className="d-flex flex-column gap-2">
                        <div className="bg-white p-2 rounded-2 border d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-semibold" style={{ fontSize: '12px' }}>Full-Stack Engineer</div>
                            <div className="text-muted" style={{ fontSize: '10.5px' }}>React • Django</div>
                          </div>
                          <span className="badge bg-success-subtle text-success" style={{ fontSize: '10.5px' }}>94%</span>
                        </div>
                        <div className="bg-white p-2 rounded-2 border d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-semibold" style={{ fontSize: '12px' }}>Python Backend Dev</div>
                            <div className="text-muted" style={{ fontSize: '10.5px' }}>DRF • REST APIs</div>
                          </div>
                          <span className="badge bg-success-subtle text-success" style={{ fontSize: '10.5px' }}>89%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-sm-6">
                    <div className="p-3 rounded-3 h-100" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <div className="small fw-bold text-dark mb-2">AI Resume Insights</div>
                      <ul className="list-unstyled mb-0 d-flex flex-column gap-2" style={{ fontSize: '11.5px', color: '#475569' }}>
                        <li className="d-flex align-items-start gap-2">
                          <i className="bi bi-check-circle-fill text-success mt-1"></i>
                          <span>Strong action verbs &amp; quantifiable project metrics detected</span>
                        </li>
                        <li className="d-flex align-items-start gap-2">
                          <i className="bi bi-stars mt-1" style={{ color: '#4F46E5' }}></i>
                          <span>Add Docker &amp; CI/CD keywords to reach 95% role match</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Strip */}
      <section className="bg-white py-3 border-bottom">
        <div className="container">
          <div className="d-flex flex-wrap align-items-center justify-content-center gap-3 gap-md-5 small fw-semibold text-muted">
            <span className="text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.06em' }}>
              Powered by modern full-stack architecture:
            </span>
            <span className="d-inline-flex align-items-center gap-1 text-dark">
              <i className="bi bi-filetype-py text-primary"></i> Python &amp; Django REST
            </span>
            <span className="d-inline-flex align-items-center gap-1 text-dark">
              <i className="bi bi-filetype-jsx text-info"></i> React.js &amp; Bootstrap 5
            </span>
            <span className="d-inline-flex align-items-center gap-1 text-dark">
              <i className="bi bi-cpu-fill" style={{ color: '#4F46E5' }}></i> Groq Cloud LLM
            </span>
            <span className="d-inline-flex align-items-center gap-1 text-dark">
              <i className="bi bi-shield-lock-fill text-success"></i> JWT Auth &amp; SQLite
            </span>
          </div>
        </div>
      </section>

      {/* Products / Core Features Grid */}
      <section id="products" className="py-5">
        <div className="container py-3">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: '680px' }}>
            <span
              className="badge rounded-pill px-3 py-2 mb-2 fw-semibold"
              style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}
            >
              <i className="bi bi-grid-fill me-1"></i> Platform Products
            </span>
            <h2 className="fw-bold mb-2" style={{ color: '#0F172A' }}>
              Everything You Need to Advance Your Career
            </h2>
            <p className="text-muted mb-0">
              Six tightly integrated modules guiding you from initial resume creation to confident interview delivery.
            </p>
          </div>

          <div className="row g-4">
            {CORE_PRODUCTS.map((item, index) => (
              <div key={index} className="col-md-6 col-lg-4">
                <div className="card h-100 bg-white p-4 hover-card">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-3"
                      style={{
                        width: '48px',
                        height: '48px',
                        backgroundColor: item.iconBg,
                        color: item.iconColor,
                      }}
                    >
                      <i className={`bi ${item.icon} fs-4`}></i>
                    </div>
                    <span
                      className="badge rounded-pill px-3 py-1 fw-semibold"
                      style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '11.5px' }}
                    >
                      {item.badge}
                    </span>
                  </div>

                  <h5 className="fw-bold text-dark mb-2">{item.title}</h5>
                  <p className="text-muted small mb-3 flex-grow-1" style={{ lineHeight: 1.65 }}>
                    {item.description}
                  </p>

                  <div className="pt-3 border-top d-flex flex-wrap gap-1">
                    {item.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="badge fw-medium"
                        style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11px' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5-Step Workflow Section */}
      <section id="how-it-works" className="py-5 bg-white border-top border-bottom">
        <div className="container py-3">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: '640px' }}>
            <span
              className="badge rounded-pill px-3 py-2 mb-2 fw-semibold"
              style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}
            >
              Simple Process
            </span>
            <h2 className="fw-bold mb-2" style={{ color: '#0F172A' }}>
              How CareerAI Works
            </h2>
            <p className="text-muted mb-0">
              A clear, step-by-step workflow engineered to maximize your interview shortlist rate.
            </p>
          </div>

          <div className="row g-3 justify-content-center mb-5">
            {WORKFLOW_STEPS.map((step) => (
              <div key={step.num} className="col-12 col-sm-6 col-lg">
                <div
                  className="p-3 p-xl-4 rounded-4 h-100 text-center"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-pill fw-bold small px-3 py-1 mb-3"
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                  >
                    {step.num}
                  </div>
                  <h6 className="fw-bold text-dark mb-2">{step.title}</h6>
                  <p className="small text-muted mb-0" style={{ lineHeight: 1.55 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 3 Interactive Product Preview Cards */}
          <div className="row g-4">
            {/* Card 1: AI Resume Analysis Preview */}
            <div className="col-lg-4">
              <div className="card h-100 p-4 bg-white">
                <h6 className="fw-bold text-dark mb-1">AI Resume Analysis</h6>
                <p className="small text-muted mb-3">Detailed ATS breakdown &amp; score meter</p>
                <div className="d-flex align-items-center gap-3 p-3 rounded-3 mb-3" style={{ backgroundColor: '#F8FAFC' }}>
                  <div
                    className="rounded-circle d-flex flex-column align-items-center justify-content-center fw-bold"
                    style={{
                      width: '74px',
                      height: '74px',
                      border: '6px solid #10B981',
                      color: '#0F172A',
                      flexShrink: 0,
                    }}
                  >
                    <span className="fs-5 lh-1">88</span>
                    <span style={{ fontSize: '10px', color: '#64748B' }}>/100</span>
                  </div>
                  <div className="flex-grow-1 small">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Content</span>
                      <span className="fw-semibold">90%</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Skills</span>
                      <span className="fw-semibold">88%</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Formatting</span>
                      <span className="fw-semibold">86%</span>
                    </div>
                  </div>
                </div>
                <Link
                  to={user ? '/resume-analyzer' : '/login'}
                  className="btn btn-outline-primary btn-sm w-100 mt-auto"
                >
                  Open ATS Analyzer
                </Link>
              </div>
            </div>

            {/* Card 2: Job Matching Preview */}
            <div className="col-lg-4">
              <div className="card h-100 p-4 bg-white">
                <h6 className="fw-bold text-dark mb-1">Smart Job Matching</h6>
                <p className="small text-muted mb-3">Weighted compatibility &amp; skill gaps</p>
                <div className="d-flex flex-column gap-2 mb-3">
                  {[
                    { role: 'Senior Frontend Developer', co: 'TechCorp • Remote', score: '95% Match' },
                    { role: 'Python Full-Stack Engineer', co: 'InnovateLabs • Hybrid', score: '90% Match' },
                    { role: 'Software Engineer (React)', co: 'CloudScale • Onsite', score: '86% Match' },
                  ].map((job, idx) => (
                    <div
                      key={idx}
                      className="p-2 px-3 rounded-3 d-flex justify-content-between align-items-center"
                      style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                    >
                      <div>
                        <div className="fw-semibold text-dark" style={{ fontSize: '12.5px' }}>{job.role}</div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>{job.co}</div>
                      </div>
                      <span className="badge bg-success-subtle text-success">{job.score}</span>
                    </div>
                  ))}
                </div>
                <Link
                  to={user ? '/job-matching' : '/login'}
                  className="btn btn-outline-primary btn-sm w-100 mt-auto"
                >
                  Explore Job Matches
                </Link>
              </div>
            </div>

            {/* Card 3: AI Interview Assistant Preview */}
            <div className="col-lg-4">
              <div className="card h-100 p-4 bg-white">
                <h6 className="fw-bold text-dark mb-1">AI Interview Assistant</h6>
                <p className="small text-muted mb-3">Timed practice with instant AI feedback</p>
                <div className="d-flex flex-column gap-2 mb-3">
                  {[
                    { title: 'Technical System Design', meta: '5 questions • Groq AI', score: '92%' },
                    { title: 'Behavioral (STAR Method)', meta: '4 questions • Groq AI', score: '88%' },
                    { title: 'HR & Culture Readiness', meta: '4 questions • Groq AI', score: '90%' },
                  ].map((session, idx) => (
                    <div
                      key={idx}
                      className="p-2 px-3 rounded-3 d-flex justify-content-between align-items-center"
                      style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                    >
                      <div>
                        <div className="fw-semibold text-dark" style={{ fontSize: '12.5px' }}>{session.title}</div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>{session.meta}</div>
                      </div>
                      <span
                        className="badge fw-semibold"
                        style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                      >
                        {session.score}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  to={user ? '/mock-interview' : '/login'}
                  className="btn btn-outline-primary btn-sm w-100 mt-auto"
                >
                  Start Mock Practice
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Purpose & Value Strip */}
      <section id="purpose" className="py-5">
        <div className="container py-2">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: '680px' }}>
            <span
              className="badge rounded-pill px-3 py-2 mb-2 fw-semibold"
              style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}
            >
              Purpose of the Project
            </span>
            <h2 className="fw-bold mb-2" style={{ color: '#0F172A' }}>
              Designed to Help Job Seekers Succeed
            </h2>
            <p className="text-muted mb-0">
              CareerAI bridges the gap between candidate potential and automated recruiter screening through
              transparent resume diagnostics, skill-gap roadmaps, and structured AI interview coaching.
            </p>
          </div>

          <div className="row g-3 mb-5">
            {BENEFITS.map((b, idx) => (
              <div key={idx} className="col-12 col-sm-6 col-lg">
                <div className="card h-100 p-3 bg-white text-center">
                  <div
                    className="mx-auto d-inline-flex align-items-center justify-content-center rounded-3 mb-2"
                    style={{ width: '42px', height: '42px', backgroundColor: b.bg, color: b.color }}
                  >
                    <i className={`bi ${b.icon} fs-5`}></i>
                  </div>
                  <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '14px' }}>{b.title}</h6>
                  <p className="small text-muted mb-0" style={{ fontSize: '12.5px', lineHeight: 1.5 }}>
                    {b.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Indigo Gradient Platform Highlights Banner */}
          <div
            className="rounded-4 p-4 p-md-5 text-white shadow"
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
            }}
          >
            <div className="row g-4 text-center">
              <div className="col-6 col-md-3">
                <div className="display-6 fw-bold mb-1">6+</div>
                <div className="small opacity-75">Integrated AI Modules</div>
              </div>
              <div className="col-6 col-md-3">
                <div className="display-6 fw-bold mb-1">0–100</div>
                <div className="small opacity-75">Deterministic ATS Scoring</div>
              </div>
              <div className="col-6 col-md-3">
                <div className="display-6 fw-bold mb-1">STAR</div>
                <div className="small opacity-75">Behavioral &amp; Tech Rubrics</div>
              </div>
              <div className="col-6 col-md-3">
                <div className="display-6 fw-bold mb-1">100%</div>
                <div className="small opacity-75">End-to-End Career Workflow</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions Accordion */}
      <section id="faq" className="py-5 bg-white border-top border-bottom">
        <div className="container py-2" style={{ maxWidth: '820px' }}>
          <div className="text-center mb-5">
            <span
              className="badge rounded-pill px-3 py-2 mb-2 fw-semibold"
              style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}
            >
              FAQ
            </span>
            <h2 className="fw-bold mb-2" style={{ color: '#0F172A' }}>
              Frequently Asked Questions
            </h2>
            <p className="text-muted mb-0">
              Everything you need to know about how CareerAI works.
            </p>
          </div>

          <div className="d-flex flex-column gap-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-4 bg-white overflow-hidden"
                  style={{ border: '1px solid #E2E8F0' }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="w-100 btn text-start p-3 p-md-4 d-flex justify-content-between align-items-center fw-semibold"
                    style={{ color: '#0F172A', backgroundColor: isOpen ? '#F8FAFC' : '#FFFFFF' }}
                  >
                    <span>{faq.q}</span>
                    <i
                      className={`bi ${isOpen ? 'bi-chevron-up text-primary' : 'bi-chevron-down text-muted'} ms-3`}
                    ></i>
                  </button>
                  {isOpen && (
                    <div className="px-3 px-md-4 pb-4 pt-1 small text-muted" style={{ lineHeight: 1.65 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Soft Indigo CTA Banner */}
      <section className="py-5">
        <div className="container">
          <div
            className="rounded-4 p-4 p-md-5 d-flex flex-column flex-lg-row align-items-center justify-content-between gap-4"
            style={{
              background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
              border: '1px solid #C7D2FE',
            }}
          >
            <div>
              <h3 className="fw-bold mb-2" style={{ color: '#0F172A' }}>
                Ready to Take the Next Step in Your Career?
              </h3>
              <p className="text-muted mb-0" style={{ maxWidth: '580px' }}>
                Create your candidate account or sign in to analyze your resume, match with curated roles, and
                practice AI mock interviews.
              </p>
            </div>

            <div className="d-flex flex-wrap gap-2 flex-shrink-0">
              <Link to={user ? dashboardRoute : '/register'} className="btn btn-primary btn-lg px-4 shadow-sm">
                {user ? 'Open Dashboard' : 'Get Started for Free'}
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="btn btn-lg bg-white fw-semibold px-4"
                  style={{ color: '#4F46E5', border: '1px solid #C7D2FE', borderRadius: '10px' }}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Structured Multi-Column SaaS Footer */}
      <footer className="bg-white mt-auto" style={{ borderTop: '1px solid #E2E8F0', color: '#475569' }}>
        <div className="container pt-5 pb-4">
          <div className="row g-4 justify-content-between">
            <div className="col-12 col-lg-4">
              <Link to="/" className="text-decoration-none d-inline-flex align-items-center gap-2 mb-3">
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
              <p className="small mb-0" style={{ color: '#64748B', maxWidth: '320px', lineHeight: '1.6' }}>
                AI-powered career intelligence for resume optimization, smart job matching, and mock interviews.
              </p>
            </div>

            <div className="col-12 col-lg-7">
              <div className="row g-4">
                <div className="col-6 col-sm-4">
                  <h6 className="fw-bold mb-3" style={{ fontSize: '13.5px', color: '#0F172A' }}>
                    Products
                  </h6>
                  <ul className="list-unstyled d-flex flex-column gap-2 mb-0 small">
                    <li><a href="#products" className="text-decoration-none" style={{ color: '#64748B' }}>AI Resume Builder</a></li>
                    <li><a href="#products" className="text-decoration-none" style={{ color: '#64748B' }}>ATS Analyzer</a></li>
                    <li><a href="#products" className="text-decoration-none" style={{ color: '#64748B' }}>Smart Job Matching</a></li>
                  </ul>
                </div>

                <div className="col-6 col-sm-4">
                  <h6 className="fw-bold mb-3" style={{ fontSize: '13.5px', color: '#0F172A' }}>
                    Overview
                  </h6>
                  <ul className="list-unstyled d-flex flex-column gap-2 mb-0 small">
                    <li><a href="#how-it-works" className="text-decoration-none" style={{ color: '#64748B' }}>How It Works</a></li>
                    <li><a href="#purpose" className="text-decoration-none" style={{ color: '#64748B' }}>Project Purpose</a></li>
                    <li><a href="#faq" className="text-decoration-none" style={{ color: '#64748B' }}>FAQ</a></li>
                  </ul>
                </div>

                <div className="col-6 col-sm-4">
                  <h6 className="fw-bold mb-3" style={{ fontSize: '13.5px', color: '#0F172A' }}>
                    Portals
                  </h6>
                  <ul className="list-unstyled d-flex flex-column gap-2 mb-0 small">
                    <li><Link to="/login" className="text-decoration-none" style={{ color: '#64748B' }}>Candidate Sign In</Link></li>
                    <li><Link to="/register" className="text-decoration-none" style={{ color: '#64748B' }}>Create Account</Link></li>
                    <li><Link to="/admin-login" className="text-decoration-none" style={{ color: '#64748B' }}>Admin Portal</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

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
    </div>
  );
};

export default Home;