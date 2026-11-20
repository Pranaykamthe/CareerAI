import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { Radar, Line } from 'react-chartjs-2';
import dashboardService from '../../services/dashboardService';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

const QUICK_ACTIONS = [
  {
    to: '/resumes',
    icon: 'bi-cloud-arrow-up-fill',
    iconBg: '#ECFDF5',
    iconColor: '#10B981',
    title: 'Upload Resume',
    subtitle: 'Parse & store PDF/DOCX',
  },
  {
    to: '/resume-analyzer',
    icon: 'bi-shield-check',
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
    title: 'Analyze Resume',
    subtitle: 'Run ATS score audit',
  },
  {
    to: '/resume-builder',
    icon: 'bi-magic',
    iconBg: '#F5F3FF',
    iconColor: '#7C3AED',
    title: 'AI Resume Builder',
    subtitle: 'Draft & export DOCX',
  },
  {
    to: '/job-matching',
    icon: 'bi-bullseye',
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
    title: 'Match a Job',
    subtitle: 'Check role compatibility',
  },
  {
    to: '/mock-interview',
    icon: 'bi-mic-fill',
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
    title: 'Practice Interview',
    subtitle: 'Start AI mock session',
  },
];

const PIPELINE_STAGES = [
  { key: 'Saved', color: '#64748B', bg: '#F1F5F9' },
  { key: 'Applied', color: '#2563EB', bg: '#EFF6FF' },
  { key: 'Screening', color: '#D97706', bg: '#FFFBEB' },
  { key: 'Interview', color: '#4F46E5', bg: '#EEF2FF' },
  { key: 'Offer', color: '#10B981', bg: '#ECFDF5' },
  { key: 'Rejected', color: '#EF4444', bg: '#FEF2F2' },
];

const CandidateDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const summary = await dashboardService.getCandidateSummary();
      setData(summary);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Unable to load dashboard metrics. Please ensure the backend server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const cardStyle = {
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  };

  if (loading) {
    return (
      <div
        className="min-vh-100 d-flex flex-column justify-content-center align-items-center"
        style={{ backgroundColor: '#F8FAFC' }}
      >
        <div className="spinner-border" style={{ color: '#4F46E5' }} role="status">
          <span className="visually-hidden">Loading dashboard...</span>
        </div>
        <p className="text-muted small mt-3">Aggregating your career readiness analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div
          className="alert alert-danger d-flex justify-content-between align-items-center rounded-4"
          role="alert"
        >
          <div>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
          <button className="btn btn-sm btn-outline-danger" onClick={fetchDashboardData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    candidate = {},
    kpis = {},
    active_resume = null,
    ats_breakdown = {},
    top_matches = [],
    skill_gaps = [],
    application_stats = {},
    interview_trend = [],
    radar_metrics = { labels: [], values: [] },
    recent_activities = [],
  } = data || {};

  // Circular Ring Helper Values
  const atsScore = Number(kpis.ats_score || 0);
  const profileCompletion = Number(candidate.profile_completion || 0);
  const ringRadius = 24;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const atsOffset = ringCircumference - (Math.min(100, atsScore) / 100) * ringCircumference;
  const profileOffset =
    ringCircumference - (Math.min(100, profileCompletion) / 100) * ringCircumference;

  const getScoreTier = (score) => {
    if (score >= 80) return { label: 'Excellent', color: '#10B981', badge: 'bg-success-subtle text-success' };
    if (score >= 60) return { label: 'Good Fit', color: '#4F46E5', badge: 'bg-primary-subtle text-primary' };
    return { label: 'Needs Work', color: '#F59E0B', badge: 'bg-warning-subtle text-warning-emphasis' };
  };

  const atsTier = getScoreTier(atsScore);

  // Radar Chart Config
  const radarData = {
    labels: radar_metrics.labels || [],
    datasets: [
      {
        label: 'Career Readiness (%)',
        data: radar_metrics.values || [],
        backgroundColor: 'rgba(79, 70, 229, 0.16)',
        borderColor: '#4F46E5',
        borderWidth: 2,
        pointBackgroundColor: '#4F46E5',
        pointBorderColor: '#FFFFFF',
        pointHoverBackgroundColor: '#FFFFFF',
        pointHoverBorderColor: '#4F46E5',
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: { stepSize: 25, backdropColor: 'transparent', font: { size: 10 }, color: '#94A3B8' },
        grid: { color: '#E2E8F0' },
        angleLines: { color: '#E2E8F0' },
        pointLabels: { font: { size: 11, weight: '600' }, color: '#334155' },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  // Interview Score Trend Line Chart Config
  const lineData = {
    labels: interview_trend.length > 0 ? interview_trend.map((item) => item.date) : ['No Sessions'],
    datasets: [
      {
        label: 'Interview Score (%)',
        data: interview_trend.length > 0 ? interview_trend.map((item) => item.score) : [0],
        fill: true,
        backgroundColor: 'rgba(79, 70, 229, 0.10)',
        borderColor: '#4F46E5',
        borderWidth: 2.5,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#4F46E5',
        pointBorderColor: '#FFFFFF',
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { stepSize: 25, color: '#64748B', font: { size: 11 } },
        grid: { color: '#F1F5F9' },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748B', font: { size: 11 } },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  const getScoreBadgeStyle = (score) => {
    if (score >= 80) return { backgroundColor: '#ECFDF5', color: '#10B981', border: '1px solid #A7F3D0' };
    if (score >= 60) return { backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' };
    return { backgroundColor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' };
  };

  return (
    <div className="py-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="container">
        {/* Top Greeting & Profile Readiness Hero Card */}
        <div className="card bg-white p-4 mb-4" style={cardStyle}>
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <span
                  className="badge rounded-pill px-3 py-1 fw-semibold"
                  style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11.5px' }}
                >
                  <i className="bi bi-stars me-1"></i> Candidate Workspace
                </span>
                <span
                  className="badge rounded-pill px-3 py-1 fw-medium"
                  style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '11.5px' }}
                >
                  <i className="bi bi-compass me-1"></i> Track: {candidate.target_role || 'Software Developer'}
                </span>
              </div>

              <h2 className="fw-bold mb-1" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
                Welcome back, {candidate.name || 'Candidate'}!
              </h2>
              <p className="text-muted small mb-0">
                Here&apos;s what&apos;s happening with your resume optimization, role matches, and interview readiness today.
              </p>
            </div>

            {/* Right Profile Completeness Widget */}
            <div className="col-lg-5">
              <div
                className="p-3 rounded-4 d-flex align-items-center justify-content-between gap-3"
                style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="position-relative d-inline-flex align-items-center justify-content-center">
                    <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="30"
                        cy="30"
                        r={ringRadius}
                        stroke="#E2E8F0"
                        strokeWidth="5"
                        fill="transparent"
                      />
                      <circle
                        cx="30"
                        cy="30"
                        r={ringRadius}
                        stroke="#4F46E5"
                        strokeWidth="5"
                        fill="transparent"
                        strokeDasharray={ringCircumference}
                        strokeDashoffset={profileOffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="position-absolute fw-bold small" style={{ color: '#0F172A', fontSize: '12px' }}>
                      {profileCompletion}%
                    </span>
                  </div>

                  <div>
                    <div className="fw-bold text-dark small mb-0">Profile Strength</div>
                    <div className="text-muted" style={{ fontSize: '12px' }}>
                      {candidate.skills_count || 0} verified skills synced
                    </div>
                    <Link
                      to="/profile"
                      className="text-decoration-none fw-semibold d-inline-flex align-items-center gap-1 mt-1"
                      style={{ color: '#4F46E5', fontSize: '12px' }}
                    >
                      Complete Profile <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>
                </div>

                <Link
                  to="/resumes"
                  className="btn btn-sm text-white fw-semibold px-3 py-2 flex-shrink-0 d-none d-sm-inline-flex align-items-center gap-1"
                  style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
                >
                  <i className="bi bi-plus-lg"></i> Upload
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 4 SaaS KPI Metric Cards */}
        <div className="row g-3 mb-4">
          {/* KPI 1: Latest ATS Score with Ring Gauge */}
          <div className="col-sm-6 col-xl-3">
            <div className="card bg-white h-100 p-3 p-md-4 hover-card" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-3"
                  style={{ width: '42px', height: '42px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                >
                  <i className="bi bi-file-earmark-bar-graph fs-5"></i>
                </div>
                <Link
                  to="/resume-analyzer"
                  className="btn btn-sm fw-semibold px-2 py-1"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '11.5px', color: '#334155' }}
                >
                  Analyze <i className="bi bi-arrow-up-right ms-1"></i>
                </Link>
              </div>

              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted small fw-semibold mb-1">Latest ATS Score</div>
                  <h3 className="fw-bold mb-1" style={{ color: '#0F172A' }}>
                    {atsScore}
                    <span className="fs-6 fw-normal text-muted">/100</span>
                  </h3>
                  <span className="small fw-semibold" style={{ color: atsTier.color }}>
                    {atsTier.label}
                  </span>
                </div>

                <svg width="58" height="58" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="29" cy="29" r={ringRadius} stroke="#E2E8F0" strokeWidth="5" fill="transparent" />
                  <circle
                    cx="29"
                    cy="29"
                    r={ringRadius}
                    stroke={atsTier.color}
                    strokeWidth="5"
                    fill="transparent"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={atsOffset}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* KPI 2: Job Matches */}
          <div className="col-sm-6 col-xl-3">
            <div className="card bg-white h-100 p-3 p-md-4 hover-card" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-3"
                  style={{ width: '42px', height: '42px', backgroundColor: '#ECFDF5', color: '#10B981' }}
                >
                  <i className="bi bi-briefcase-fill fs-5"></i>
                </div>
                <Link
                  to="/job-matching"
                  className="btn btn-sm fw-semibold px-2 py-1"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '11.5px', color: '#334155' }}
                >
                  Matches <i className="bi bi-arrow-up-right ms-1"></i>
                </Link>
              </div>
              <div className="text-muted small fw-semibold mb-1">Avg Job Compatibility</div>
              <h3 className="fw-bold mb-1" style={{ color: '#0F172A' }}>
                {kpis.avg_job_fit || 0}%
              </h3>
              <span className="small text-success fw-medium">
                <i className="bi bi-check2-circle me-1"></i>
                {kpis.job_matches_count || 0} roles evaluated
              </span>
            </div>
          </div>

          {/* KPI 3: Tracked Applications */}
          <div className="col-sm-6 col-xl-3">
            <div className="card bg-white h-100 p-3 p-md-4 hover-card" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-3"
                  style={{ width: '42px', height: '42px', backgroundColor: '#FFFBEB', color: '#D97706' }}
                >
                  <i className="bi bi-kanban fs-5"></i>
                </div>
                <Link
                  to="/applications"
                  className="btn btn-sm fw-semibold px-2 py-1"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '11.5px', color: '#334155' }}
                >
                  Kanban <i className="bi bi-arrow-up-right ms-1"></i>
                </Link>
              </div>
              <div className="text-muted small fw-semibold mb-1">Applications Tracked</div>
              <h3 className="fw-bold mb-1" style={{ color: '#0F172A' }}>
                {kpis.total_applications || 0}
              </h3>
              <span className="small text-muted">
                {kpis.saved_jobs || 0} saved in wishlist
              </span>
            </div>
          </div>

          {/* KPI 4: Interview Prep */}
          <div className="col-sm-6 col-xl-3">
            <div className="card bg-white h-100 p-3 p-md-4 hover-card" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-3"
                  style={{ width: '42px', height: '42px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
                >
                  <i className="bi bi-mic-fill fs-5"></i>
                </div>
                <Link
                  to="/mock-interview"
                  className="btn btn-sm fw-semibold px-2 py-1"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '11.5px', color: '#334155' }}
                >
                  Practice <i className="bi bi-arrow-up-right ms-1"></i>
                </Link>
              </div>
              <div className="text-muted small fw-semibold mb-1">Avg Interview Score</div>
              <h3 className="fw-bold mb-1" style={{ color: '#0F172A' }}>
                {kpis.avg_interview_score || 0}%
              </h3>
              <span className="small text-primary fw-medium">
                {kpis.completed_interviews || 0} sessions completed
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Strip (5 Action Tiles) */}
        <div className="card bg-white p-4 mb-4" style={cardStyle}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold text-dark mb-0">Quick Actions</h6>
            <span className="text-muted" style={{ fontSize: '12px' }}>
              Launch any CareerAI workspace tool
            </span>
          </div>
          <div className="row g-3">
            {QUICK_ACTIONS.map((action, idx) => (
              <div key={idx} className="col-12 col-sm-6 col-lg">
                <Link
                  to={action.to}
                  className="text-decoration-none d-block p-3 rounded-4 h-100 hover-card"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-3"
                      style={{
                        width: '38px',
                        height: '38px',
                        backgroundColor: action.iconBg,
                        color: action.iconColor,
                      }}
                    >
                      <i className={`bi ${action.icon} fs-5`}></i>
                    </div>
                    <i className="bi bi-arrow-right text-muted small"></i>
                  </div>
                  <div className="fw-bold text-dark small mb-1">{action.title}</div>
                  <div className="text-muted" style={{ fontSize: '11.5px' }}>
                    {action.subtitle}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Split: Recommended Jobs + ATS & Skill Gap Insights + Recent Activity */}
        <div className="row g-4 mb-4">
          {/* Left Column (7 cols): Top Recommended Jobs */}
          <div className="col-lg-7">
            <div className="card bg-white p-4 h-100" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-0">Recommended Jobs for You</h5>
                  <small className="text-muted">
                    {active_resume
                      ? `Scored against ${active_resume.filename}`
                      : 'Upload a resume to unlock personalized compatibility scores'}
                  </small>
                </div>
                <Link
                  to="/job-matching"
                  className="text-decoration-none small fw-semibold"
                  style={{ color: '#4F46E5' }}
                >
                  View All Jobs <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              {top_matches.length === 0 ? (
                <div
                  className="text-center py-5 rounded-4 my-auto"
                  style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1' }}
                >
                  <i className="bi bi-briefcase fs-2 text-muted"></i>
                  <p className="text-muted small mt-2 mb-3">
                    No job postings matched yet. Explore the Job Board to run compatibility checks.
                  </p>
                  <Link
                    to="/jobs"
                    className="btn btn-sm text-white fw-semibold px-3"
                    style={{ backgroundColor: '#4F46E5' }}
                  >
                    Browse Job Descriptions
                  </Link>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {top_matches.map((job) => (
                    <div
                      key={job.job_id}
                      className="p-3 rounded-4"
                      style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div className="d-flex align-items-start gap-3">
                          <div
                            className="d-inline-flex align-items-center justify-content-center rounded-3 fw-bold flex-shrink-0"
                            style={{
                              width: '42px',
                              height: '42px',
                              backgroundColor: '#EEF2FF',
                              color: '#4F46E5',
                              fontSize: '15px',
                            }}
                          >
                            {(job.company || 'C').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h6 className="fw-bold text-dark mb-0">{job.title}</h6>
                            <div className="text-muted small">
                              {job.company} • <i className="bi bi-geo-alt"></i> {job.location}
                            </div>
                          </div>
                        </div>

                        <span
                          className="badge rounded-pill px-3 py-2 fw-semibold flex-shrink-0"
                          style={getScoreBadgeStyle(job.match_score)}
                        >
                          {job.match_score}% Match
                        </span>
                      </div>

                      <div className="d-flex flex-wrap gap-1 pt-2 border-top">
                        {(job.matched_skills || []).map((skill, idx) => (
                          <span
                            key={`m-${idx}`}
                            className="badge fw-normal"
                            style={{ backgroundColor: '#ECFDF5', color: '#059669', fontSize: '11px' }}
                          >
                            ✓ {skill}
                          </span>
                        ))}
                        {(job.missing_skills || []).map((skill, idx) => (
                          <span
                            key={`g-${idx}`}
                            className="badge fw-normal"
                            style={{ backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: '11px' }}
                          >
                            + {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): ATS Breakdown + Priority Skill Gaps */}
          <div className="col-lg-5">
            <div className="card bg-white p-4 h-100 d-flex flex-column justify-content-between" style={cardStyle}>
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold text-dark mb-0">Resume &amp; Skill Diagnostics</h5>
                    <small className="text-muted">ATS sub-scores &amp; high-demand gaps</small>
                  </div>
                  <Link
                    to="/resume-analyzer"
                    className="text-decoration-none small fw-semibold"
                    style={{ color: '#4F46E5' }}
                  >
                    Full Audit
                  </Link>
                </div>

                {/* ATS Sub-Metrics Bars */}
                <div
                  className="p-3 rounded-4 mb-4"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                  {[
                    { label: 'Formatting & Structure', val: ats_breakdown.formatting || 0, color: '#4F46E5' },
                    { label: 'Keyword Alignment', val: ats_breakdown.keywords || 0, color: '#10B981' },
                    { label: 'Section Completeness', val: ats_breakdown.completeness || 0, color: '#2563EB' },
                    { label: 'Quantified Impact', val: ats_breakdown.impact || 0, color: '#F59E0B' },
                  ].map((bar, i) => (
                    <div key={i} className={i < 3 ? 'mb-3' : 'mb-0'}>
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="fw-medium text-dark">{bar.label}</span>
                        <span className="fw-bold" style={{ color: bar.color }}>
                          {bar.val}%
                        </span>
                      </div>
                      <div className="progress" style={{ height: '6px', backgroundColor: '#E2E8F0' }}>
                        <div
                          className="progress-bar"
                          style={{ width: `${bar.val}%`, backgroundColor: bar.color, borderRadius: '4px' }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Priority Skill Gaps */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold small text-uppercase text-muted mb-0">
                    Priority Skill Gaps
                  </h6>
                  <span className="text-muted" style={{ fontSize: '11px' }}>
                    Most requested in target roles
                  </span>
                </div>

                {skill_gaps.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2 mb-4">
                    {skill_gaps.map((item, idx) => (
                      <span
                        key={idx}
                        className="badge rounded-pill px-3 py-2 fw-medium"
                        style={{
                          backgroundColor: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          fontSize: '11.5px',
                        }}
                      >
                        {item.skill}{' '}
                        <span className="opacity-75">({item.demand_count} roles)</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div
                    className="p-3 rounded-3 small mb-4 d-flex align-items-center gap-2"
                    style={{ backgroundColor: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0' }}
                  >
                    <i className="bi bi-check-circle-fill text-success"></i>
                    <span>Strong skill coverage across your top matched roles!</span>
                  </div>
                )}
              </div>

              <div className="d-grid gap-2">
                <Link
                  to="/resume-builder"
                  className="btn text-white fw-semibold py-2"
                  style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
                >
                  <i className="bi bi-magic me-2"></i>Tailor Resume in AI Builder
                </Link>
                <Link
                  to="/interview-prep"
                  className="btn bg-white fw-semibold py-2"
                  style={{ color: '#334155', border: '1px solid #CBD5E1', borderRadius: '10px' }}
                >
                  <i className="bi bi-stars me-2" style={{ color: '#4F46E5' }}></i>Open AI Interview Prep Hub
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Charts Row: Career Readiness Radar + Mock Interview Score Trend */}
        <div className="row g-4 mb-4">
          <div className="col-lg-6">
            <div className="card bg-white p-4 h-100" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-0">Profile Strength &amp; Readiness Radar</h5>
                  <small className="text-muted">6-dimension employability benchmark</small>
                </div>
                <span
                  className="badge rounded-pill px-3 py-1 fw-semibold"
                  style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11px' }}
                >
                  Live Analytics
                </span>
              </div>
              <div style={{ height: '270px' }}>
                <Radar data={radarData} options={radarOptions} />
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card bg-white p-4 h-100" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-0">Interview Progress Overview</h5>
                  <small className="text-muted">Score progression across recent mock sessions</small>
                </div>
                <Link
                  to="/interview-history"
                  className="btn btn-sm fw-semibold"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155' }}
                >
                  Full History
                </Link>
              </div>
              {interview_trend.length > 0 ? (
                <div style={{ height: '270px' }}>
                  <Line data={lineData} options={lineOptions} />
                </div>
              ) : (
                <div
                  className="text-center py-5 rounded-4 my-auto"
                  style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1' }}
                >
                  <i className="bi bi-chat-square-dots fs-1 text-muted"></i>
                  <p className="text-muted small mt-2 mb-3">
                    No completed mock interviews yet. Complete a session to visualize your score trend.
                  </p>
                  <Link
                    to="/mock-interview"
                    className="btn btn-sm text-white fw-semibold px-3"
                    style={{ backgroundColor: '#4F46E5' }}
                  >
                    Start Mock Interview
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Application Pipeline Overview + Recent Activity Timeline */}
        <div className="row g-4">
          {/* Application Pipeline Card */}
          <div className="col-lg-5">
            <div className="card bg-white p-4 h-100" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-0">Application Pipeline</h5>
                  <small className="text-muted">Status distribution across Kanban stages</small>
                </div>
                <Link
                  to="/applications"
                  className="text-decoration-none small fw-semibold"
                  style={{ color: '#4F46E5' }}
                >
                  Open Board <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              <div className="row g-2">
                {PIPELINE_STAGES.map((stage) => (
                  <div key={stage.key} className="col-4">
                    <div
                      className="p-3 rounded-4 text-center h-100"
                      style={{ backgroundColor: stage.bg, border: '1px solid #E2E8F0' }}
                    >
                      <div className="fw-bold fs-4 mb-0" style={{ color: stage.color }}>
                        {application_stats[stage.key] ?? 0}
                      </div>
                      <div className="fw-semibold" style={{ fontSize: '12px', color: '#334155' }}>
                        {stage.key}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="col-lg-7">
            <div className="card bg-white p-4 h-100" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-0">Recent Activity</h5>
                  <small className="text-muted">Latest resume, job, and interview events</small>
                </div>
              </div>

              {recent_activities.length === 0 ? (
                <div
                  className="text-center py-4 rounded-4"
                  style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1' }}
                >
                  <p className="text-muted small mb-0">
                    No recent activity yet. Upload a resume or start a mock interview to begin.
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {recent_activities.map((act, index) => (
                    <div
                      key={index}
                      className="d-flex align-items-center justify-content-between gap-3 p-3 rounded-4"
                      style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className={`d-inline-flex align-items-center justify-content-center rounded-circle bg-${act.color}-subtle text-${act.color} flex-shrink-0`}
                          style={{ width: '38px', height: '38px' }}
                        >
                          <i className={`bi ${act.icon}`}></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark small">{act.title}</div>
                          <div className="text-muted" style={{ fontSize: '12px' }}>
                            {act.subtitle}
                          </div>
                        </div>
                      </div>
                      <i className="bi bi-chevron-right text-muted small"></i>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;