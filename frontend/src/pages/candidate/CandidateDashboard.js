import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { Radar, Line, Doughnut } from 'react-chartjs-2';
import dashboardService from '../../services/dashboardService';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement,
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
    subtitle: 'Parse & manage PDF/DOCX',
  },
  {
    to: '/resume-analyzer',
    icon: 'bi-shield-check',
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
    title: 'ATS Analyzer',
    subtitle: 'Run 0–100 score diagnostic',
  },
  {
    to: '/resume-builder',
    icon: 'bi-magic',
    iconBg: '#F5F3FF',
    iconColor: '#7C3AED',
    title: 'AI Resume Builder',
    subtitle: 'Draft & export clean DOCX',
  },
  {
    to: '/job-matching',
    icon: 'bi-bullseye',
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
    title: 'Smart Job Match',
    subtitle: 'Check role compatibility',
  },
  {
    to: '/mock-interview',
    icon: 'bi-mic-fill',
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
    title: 'AI Mock Interview',
    subtitle: 'Practice with STAR rubric',
  },
];

const PIPELINE_STAGES = [
  { key: 'Saved', color: '#64748B', bg: '#F8FAFC', dot: '#94A3B8' },
  { key: 'Applied', color: '#2563EB', bg: '#EFF6FF', dot: '#3B82F6' },
  { key: 'Screening', color: '#D97706', bg: '#FFFBEB', dot: '#F59E0B' },
  { key: 'Interview', color: '#4F46E5', bg: '#EEF2FF', dot: '#6366F1' },
  { key: 'Offer', color: '#10B981', bg: '#ECFDF5', dot: '#10B981' },
  { key: 'Rejected', color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444' },
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
    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
  };

  const tabularStyle = {
    fontVariantNumeric: 'tabular-nums',
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
        <p className="text-muted small fw-medium mt-3">
          Aggregating your career readiness telemetry...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-5" style={{ backgroundColor: '#F8FAFC', minHeight: '80vh' }}>
        <div className="container">
          <div
            className="alert alert-danger d-flex flex-wrap justify-content-between align-items-center gap-3 rounded-4 p-4 shadow-sm"
            role="alert"
          >
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill fs-5"></i>
              <span>{error}</span>
            </div>
            <button
              className="btn btn-sm btn-danger fw-semibold px-3"
              onClick={fetchDashboardData}
            >
              <i className="bi bi-arrow-clockwise me-1"></i> Retry Connection
            </button>
          </div>
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

  // Circular SVG Ring Helpers
  const atsScore = Math.max(0, Math.min(100, Number(kpis.ats_score || 0)));
  const profileCompletion = Math.max(0, Math.min(100, Number(candidate.profile_completion || 0)));
  const ringRadius = 23;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const atsOffset = ringCircumference - (atsScore / 100) * ringCircumference;
  const profileOffset = ringCircumference - (profileCompletion / 100) * ringCircumference;

  const getScoreTier = (score) => {
    if (score >= 80) {
      return { label: 'ATS Ready', color: '#10B981', bg: '#ECFDF5' };
    }
    if (score >= 60) {
      return { label: 'Good Fit', color: '#4F46E5', bg: '#EEF2FF' };
    }
    return { label: 'Needs Audit', color: '#D97706', bg: '#FFFBEB' };
  };

  const atsTier = getScoreTier(atsScore);

  const getScoreBadgeStyle = (score) => {
    if (score >= 80) {
      return { backgroundColor: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' };
    }
    if (score >= 60) {
      return { backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' };
    }
    return { backgroundColor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' };
  };

  // Career Readiness Radar Chart
  const radarLabels = Array.isArray(radar_metrics?.labels) ? radar_metrics.labels : [];
  const radarValues = Array.isArray(radar_metrics?.values) ? radar_metrics.values : [];

  const radarData = {
    labels: radarLabels.length > 0 ? radarLabels : ['ATS', 'Skills', 'Experience', 'Projects', 'Matching', 'Interview'],
    datasets: [
      {
        label: 'Readiness (%)',
        data: radarValues.length > 0 ? radarValues : [0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(79, 70, 229, 0.14)',
        borderColor: '#4F46E5',
        borderWidth: 2,
        pointBackgroundColor: '#4F46E5',
        pointBorderColor: '#FFFFFF',
        pointHoverBackgroundColor: '#FFFFFF',
        pointHoverBorderColor: '#4F46E5',
        pointRadius: 3.5,
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

  // Interview Score Trend Line Chart
  const lineData = {
    labels: interview_trend.length > 0 ? interview_trend.map((item) => item.date) : ['No Sessions'],
    datasets: [
      {
        label: 'Interview Score (%)',
        data: interview_trend.length > 0 ? interview_trend.map((item) => item.score) : [0],
        fill: true,
        backgroundColor: 'rgba(79, 70, 229, 0.08)',
        borderColor: '#4F46E5',
        borderWidth: 2.5,
        tension: 0.35,
        pointRadius: 4.5,
        pointHoverRadius: 6,
        pointBackgroundColor: '#4F46E5',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
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
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748B', font: { size: 11 } },
        border: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
      },
    },
  };

  // ATS Sub-Score Doughnut Chart
  const atsMetrics = [
    { label: 'Formatting & Structure', val: Number(ats_breakdown.formatting || 0), color: '#4F46E5' },
    { label: 'Keyword Alignment', val: Number(ats_breakdown.keywords || 0), color: '#10B981' },
    { label: 'Section Completeness', val: Number(ats_breakdown.completeness || 0), color: '#2563EB' },
    { label: 'Quantified Impact', val: Number(ats_breakdown.impact || 0), color: '#F59E0B' },
  ];
  const hasAtsBreakdown = atsMetrics.some((m) => m.val > 0);

  const doughnutData = {
    labels: hasAtsBreakdown ? atsMetrics.map((m) => m.label) : ['Pending Analysis'],
    datasets: [
      {
        data: hasAtsBreakdown ? atsMetrics.map((m) => m.val) : [100],
        backgroundColor: hasAtsBreakdown ? atsMetrics.map((m) => m.color) : ['#E2E8F0'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: hasAtsBreakdown },
    },
  };

  const totalPipelineCount = PIPELINE_STAGES.reduce(
    (sum, s) => sum + Number(application_stats[s.key] || 0),
    0
  );

  return (
    <div className="py-4" style={{ backgroundColor: '#F8FAFC', minHeight: '100%' }}>
      <style>{`
        .careerai-saas-card {
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .careerai-saas-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06) !important;
          border-color: #CBD5E1 !important;
        }
        .careerai-action-tile {
          transition: all 0.18s ease;
        }
        .careerai-action-tile:hover {
          background-color: #FFFFFF !important;
          border-color: #C7D2FE !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.08);
        }
      `}</style>

      <div className="container">
        {/* Top Executive Workspace Header */}
        <div className="card bg-white p-4 mb-4" style={cardStyle}>
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <span
                  className="badge rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1"
                  style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11.5px' }}
                >
                  <span
                    className="rounded-circle d-inline-block"
                    style={{ width: '6px', height: '6px', backgroundColor: '#4F46E5' }}
                  ></span>
                  Candidate Intelligence Workspace
                </span>
                <span
                  className="badge rounded-pill px-3 py-1 fw-medium"
                  style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '11.5px' }}
                >
                  <i className="bi bi-compass me-1"></i>
                  {candidate.target_role || 'Software Engineering Track'}
                </span>
                {active_resume && (
                  <span
                    className="badge rounded-pill px-3 py-1 fw-medium"
                    style={{ backgroundColor: '#ECFDF5', color: '#059669', fontSize: '11.5px' }}
                  >
                    <i className="bi bi-file-earmark-check me-1"></i>
                    {active_resume.filename}
                  </span>
                )}
              </div>

              <h2
                className="fw-bold mb-1"
                style={{ color: '#0F172A', letterSpacing: '-0.025em', fontSize: '1.65rem' }}
              >
                Welcome back, {candidate.name || 'Candidate'}
              </h2>
              <p className="text-muted small mb-0">
                Monitor your ATS diagnostics, AI role compatibility, pipeline velocity, and mock interview scores.
              </p>
            </div>

            {/* Right Profile Readiness & Primary Actions */}
            <div className="col-lg-5">
              <div
                className="p-3 rounded-4 d-flex align-items-center justify-content-between gap-3"
                style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="position-relative d-inline-flex align-items-center justify-content-center flex-shrink-0">
                    <svg width="58" height="58" style={{ transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="29"
                        cy="29"
                        r={ringRadius}
                        stroke="#E2E8F0"
                        strokeWidth="5"
                        fill="transparent"
                      />
                      <circle
                        cx="29"
                        cy="29"
                        r={ringRadius}
                        stroke="#4F46E5"
                        strokeWidth="5"
                        fill="transparent"
                        strokeDasharray={ringCircumference}
                        strokeDashoffset={profileOffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      className="position-absolute fw-bold"
                      style={{ color: '#0F172A', fontSize: '11.5px', ...tabularStyle }}
                    >
                      {profileCompletion}%
                    </span>
                  </div>

                  <div>
                    <div className="fw-bold text-dark small mb-0">Profile Readiness</div>
                    <div className="text-muted" style={{ fontSize: '12px', ...tabularStyle }}>
                      {candidate.skills_count || 0} verified skills synced
                    </div>
                    <Link
                      to="/profile"
                      className="text-decoration-none fw-semibold d-inline-flex align-items-center gap-1 mt-1"
                      style={{ color: '#4F46E5', fontSize: '12px' }}
                    >
                      Edit Profile <i className="bi bi-arrow-right"></i>
                    </Link>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2 flex-shrink-0">
                  <Link
                    to="/resume-builder"
                    className="btn btn-sm text-white fw-semibold px-3 py-2 d-inline-flex align-items-center justify-content-center gap-1 shadow-sm"
                    style={{ backgroundColor: '#4F46E5', borderRadius: '10px', fontSize: '12px' }}
                  >
                    <i className="bi bi-magic"></i> AI Builder
                  </Link>
                  <button
                    type="button"
                    onClick={fetchDashboardData}
                    className="btn btn-sm bg-white fw-medium px-3 py-1 d-inline-flex align-items-center justify-content-center gap-1"
                    style={{
                      border: '1px solid #CBD5E1',
                      color: '#334155',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                    }}
                  >
                    <i className="bi bi-arrow-clockwise"></i> Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Card Enterprise KPI Strip */}
        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-5 g-3 mb-4">
          {/* KPI 1: Latest ATS Score */}
          <div className="col">
            <div className="card bg-white h-100 p-3 careerai-saas-card" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-3"
                  style={{ width: '38px', height: '38px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                >
                  <i className="bi bi-file-earmark-bar-graph fs-5"></i>
                </div>
                <Link
                  to="/resume-analyzer"
                  className="text-decoration-none fw-semibold px-2 py-1 rounded-2"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '11px', color: '#334155' }}
                >
                  Audit <i className="bi bi-arrow-up-right"></i>
                </Link>
              </div>

              <div className="d-flex align-items-center justify-content-between gap-2 mt-auto">
                <div>
                  <div className="text-muted fw-semibold mb-1" style={{ fontSize: '12px' }}>
                    ATS Score
                  </div>
                  <div className="fw-bold fs-3 lh-1 mb-1" style={{ color: '#0F172A', ...tabularStyle }}>
                    {atsScore}
                    <span className="fs-6 fw-normal text-muted">/100</span>
                  </div>
                  <span
                    className="badge rounded-pill fw-semibold"
                    style={{ backgroundColor: atsTier.bg, color: atsTier.color, fontSize: '10.5px' }}
                  >
                    {atsTier.label}
                  </span>
                </div>

                <svg width="54" height="54" className="flex-shrink-0" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="27" cy="27" r={ringRadius} stroke="#E2E8F0" strokeWidth="5" fill="transparent" />
                  <circle
                    cx="27"
                    cy="27"
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

          {/* KPI 2: Job Compatibility */}
          <div className="col">
            <div className="card bg-white h-100 p-3 careerai-saas-card" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-3"
                  style={{ width: '38px', height: '38px', backgroundColor: '#ECFDF5', color: '#10B981' }}
                >
                  <i className="bi bi-bullseye fs-5"></i>
                </div>
                <Link
                  to="/job-matching"
                  className="text-decoration-none fw-semibold px-2 py-1 rounded-2"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '11px', color: '#334155' }}
                >
                  Matches <i className="bi bi-arrow-up-right"></i>
                </Link>
              </div>
              <div className="mt-auto">
                <div className="text-muted fw-semibold mb-1" style={{ fontSize: '12px' }}>
                  Avg Job Match
                </div>
                <div className="fw-bold fs-3 lh-1 mb-1" style={{ color: '#0F172A', ...tabularStyle }}>
                  {kpis.avg_job_fit || 0}%
                </div>
                <div className="text-success fw-medium" style={{ fontSize: '11.5px', ...tabularStyle }}>
                  <i className="bi bi-check2-circle me-1"></i>
                  {kpis.job_matches_count || 0} roles scored
                </div>
              </div>
            </div>
          </div>

          {/* KPI 3: Pipeline Applications */}
          <div className="col">
            <div className="card bg-white h-100 p-3 careerai-saas-card" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-3"
                  style={{ width: '38px', height: '38px', backgroundColor: '#FFFBEB', color: '#D97706' }}
                >
                  <i className="bi bi-kanban fs-5"></i>
                </div>
                <Link
                  to="/applications"
                  className="text-decoration-none fw-semibold px-2 py-1 rounded-2"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '11px', color: '#334155' }}
                >
                  Board <i className="bi bi-arrow-up-right"></i>
                </Link>
              </div>
              <div className="mt-auto">
                <div className="text-muted fw-semibold mb-1" style={{ fontSize: '12px' }}>
                  Active Pipeline
                </div>
                <div className="fw-bold fs-3 lh-1 mb-1" style={{ color: '#0F172A', ...tabularStyle }}>
                  {kpis.total_applications || 0}
                </div>
                <div className="text-muted fw-medium" style={{ fontSize: '11.5px', ...tabularStyle }}>
                  {kpis.saved_jobs || 0} saved in wishlist
                </div>
              </div>
            </div>
          </div>

          {/* KPI 4: Mock Interview Score */}
          <div className="col">
            <div className="card bg-white h-100 p-3 careerai-saas-card" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-3"
                  style={{ width: '38px', height: '38px', backgroundColor: '#EFF6FF', color: '#2563EB' }}
                >
                  <i className="bi bi-mic-fill fs-5"></i>
                </div>
                <Link
                  to="/mock-interview"
                  className="text-decoration-none fw-semibold px-2 py-1 rounded-2"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '11px', color: '#334155' }}
                >
                  Practice <i className="bi bi-arrow-up-right"></i>
                </Link>
              </div>
              <div className="mt-auto">
                <div className="text-muted fw-semibold mb-1" style={{ fontSize: '12px' }}>
                  Interview Score
                </div>
                <div className="fw-bold fs-3 lh-1 mb-1" style={{ color: '#0F172A', ...tabularStyle }}>
                  {kpis.avg_interview_score || 0}%
                </div>
                <div className="text-primary fw-medium" style={{ fontSize: '11.5px', ...tabularStyle }}>
                  {kpis.completed_interviews || 0} sessions done
                </div>
              </div>
            </div>
          </div>

          {/* KPI 5: Verified Skills */}
          <div className="col">
            <div className="card bg-white h-100 p-3 careerai-saas-card" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-3"
                  style={{ width: '38px', height: '38px', backgroundColor: '#F5F3FF', color: '#7C3AED' }}
                >
                  <i className="bi bi-cpu-fill fs-5"></i>
                </div>
                <Link
                  to="/question-bank"
                  className="text-decoration-none fw-semibold px-2 py-1 rounded-2"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '11px', color: '#334155' }}
                >
                  Q-Bank <i className="bi bi-arrow-up-right"></i>
                </Link>
              </div>
              <div className="mt-auto">
                <div className="text-muted fw-semibold mb-1" style={{ fontSize: '12px' }}>
                  Verified Skills
                </div>
                <div className="fw-bold fs-3 lh-1 mb-1" style={{ color: '#0F172A', ...tabularStyle }}>
                  {candidate.skills_count || 0}
                </div>
                <div className="fw-medium" style={{ color: '#7C3AED', fontSize: '11.5px', ...tabularStyle }}>
                  {skill_gaps.length} skill gaps flagged
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Launchpad */}
        <div className="card bg-white p-4 mb-4" style={cardStyle}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <h6 className="fw-bold text-dark mb-0">Workspace Quick Actions</h6>
              <small className="text-muted">Jump directly into any AI career intelligence module</small>
            </div>
            <Link
              to="/jobs"
              className="text-decoration-none fw-semibold small"
              style={{ color: '#4F46E5' }}
            >
              Browse All Open Roles <i className="bi bi-arrow-right"></i>
            </Link>
          </div>

          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-5 g-3">
            {QUICK_ACTIONS.map((action, idx) => (
              <div key={idx} className="col">
                <Link
                  to={action.to}
                  className="text-decoration-none d-block p-3 rounded-4 h-100 careerai-action-tile"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-3"
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: action.iconBg,
                        color: action.iconColor,
                      }}
                    >
                      <i className={`bi ${action.icon} fs-5`}></i>
                    </div>
                    <i className="bi bi-arrow-up-right text-muted small"></i>
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

        {/* Primary Analytics Row: Interview Trajectory Line Chart + Career Readiness Radar */}
        <div className="row g-4 mb-4">
          <div className="col-lg-7">
            <div className="card bg-white p-4 h-100" style={cardStyle}>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-0">Interview Readiness Trajectory</h5>
                  <small className="text-muted">
                    Score progression across completed Groq AI mock sessions
                  </small>
                </div>
                <Link
                  to="/interview-history"
                  className="btn btn-sm fw-semibold px-3"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155', borderRadius: '8px' }}
                >
                  Session History <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>

              {interview_trend.length > 0 ? (
                <div style={{ height: '275px' }}>
                  <Line data={lineData} options={lineOptions} />
                </div>
              ) : (
                <div
                  className="text-center py-5 px-3 rounded-4 my-auto"
                  style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1' }}
                >
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
                    style={{ width: '48px', height: '48px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                  >
                    <i className="bi bi-mic-fill fs-5"></i>
                  </div>
                  <h6 className="fw-bold text-dark mb-1">No Mock Interview Data Yet</h6>
                  <p className="text-muted small mb-3 mx-auto" style={{ maxWidth: '380px' }}>
                    Complete a timed Technical, HR, or Behavioral (STAR) session to chart your performance trend.
                  </p>
                  <Link
                    to="/mock-interview"
                    className="btn btn-sm text-white fw-semibold px-4 py-2"
                    style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
                  >
                    Start First Session
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card bg-white p-4 h-100" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-0">6-Axis Readiness Radar</h5>
                  <small className="text-muted">Holistic employability benchmark</small>
                </div>
                <span
                  className="badge rounded-pill px-3 py-1 fw-semibold"
                  style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11px' }}
                >
                  Live Telemetry
                </span>
              </div>
              <div style={{ height: '275px' }}>
                <Radar data={radarData} options={radarOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Core Workspace Split: Top AI-Matched Roles + ATS & Skill Diagnostics */}
        <div className="row g-4 mb-4">
          {/* Left Column (7 cols): Top AI-Matched Opportunities */}
          <div className="col-lg-7">
            <div className="card bg-white p-4 h-100" style={cardStyle}>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-0">Top AI-Matched Roles</h5>
                  <small className="text-muted">
                    {active_resume
                      ? `Weighted compatibility against ${active_resume.filename}`
                      : 'Upload a resume to unlock weighted job compatibility scores'}
                  </small>
                </div>
                <Link
                  to="/job-matching"
                  className="text-decoration-none small fw-semibold"
                  style={{ color: '#4F46E5' }}
                >
                  Explore All Matches <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              {top_matches.length === 0 ? (
                <div
                  className="text-center py-5 px-3 rounded-4 my-auto"
                  style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1' }}
                >
                  <i className="bi bi-briefcase fs-2 text-muted"></i>
                  <h6 className="fw-bold text-dark mt-2 mb-1">No Job Matches Computed Yet</h6>
                  <p className="text-muted small mb-3">
                    Browse curated job descriptions or run a compatibility match against your resume.
                  </p>
                  <Link
                    to="/jobs"
                    className="btn btn-sm text-white fw-semibold px-4 py-2"
                    style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
                  >
                    Browse Job Board
                  </Link>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {top_matches.map((job) => (
                    <div
                      key={job.job_id}
                      className="p-3 rounded-4 careerai-saas-card"
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
                              fontSize: '14px',
                            }}
                          >
                            {(job.company || 'CA').slice(0, 2).toUpperCase()}
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
                          style={{ ...getScoreBadgeStyle(job.match_score), ...tabularStyle }}
                        >
                          {job.match_score}% Match
                        </span>
                      </div>

                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top">
                        <div className="d-flex flex-wrap gap-1">
                          {(job.matched_skills || []).slice(0, 4).map((skill, idx) => (
                            <span
                              key={`m-${idx}`}
                              className="badge fw-medium"
                              style={{ backgroundColor: '#ECFDF5', color: '#059669', fontSize: '11px' }}
                            >
                              ✓ {skill}
                            </span>
                          ))}
                          {(job.missing_skills || []).slice(0, 3).map((skill, idx) => (
                            <span
                              key={`g-${idx}`}
                              className="badge fw-medium"
                              style={{ backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: '11px' }}
                            >
                              + {skill}
                            </span>
                          ))}
                        </div>

                        <Link
                          to="/job-matching"
                          className="text-decoration-none fw-semibold"
                          style={{ color: '#4F46E5', fontSize: '12px' }}
                        >
                          Details <i className="bi bi-chevron-right"></i>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): ATS Breakdown Doughnut + Priority Skill Gaps */}
          <div className="col-lg-5">
            <div className="card bg-white p-4 h-100 d-flex flex-column justify-content-between" style={cardStyle}>
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold text-dark mb-0">ATS &amp; Skill Diagnostics</h5>
                    <small className="text-muted">Sub-score distribution &amp; missing keywords</small>
                  </div>
                  <Link
                    to="/resume-analyzer"
                    className="text-decoration-none small fw-semibold"
                    style={{ color: '#4F46E5' }}
                  >
                    Full Audit <i className="bi bi-arrow-up-right"></i>
                  </Link>
                </div>

                {/* ATS Doughnut + Sub-Metric Bars */}
                <div
                  className="p-3 rounded-4 mb-4"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                  <div className="row align-items-center g-3">
                    <div className="col-4">
                      <div className="position-relative mx-auto" style={{ width: '96px', height: '96px' }}>
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                        <div className="position-absolute top-50 start-50 translate-middle text-center">
                          <div className="fw-bold small lh-1" style={{ color: '#0F172A', ...tabularStyle }}>
                            {atsScore}%
                          </div>
                          <div className="text-muted" style={{ fontSize: '9px' }}>
                            ATS
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-8">
                      {atsMetrics.map((bar, i) => (
                        <div key={i} className={i < atsMetrics.length - 1 ? 'mb-2' : 'mb-0'}>
                          <div className="d-flex justify-content-between mb-1" style={{ fontSize: '11.5px' }}>
                            <span className="fw-medium text-dark">{bar.label}</span>
                            <span className="fw-bold" style={{ color: bar.color, ...tabularStyle }}>
                              {bar.val}%
                            </span>
                          </div>
                          <div className="progress" style={{ height: '5px', backgroundColor: '#E2E8F0' }}>
                            <div
                              className="progress-bar"
                              style={{
                                width: `${bar.val}%`,
                                backgroundColor: bar.color,
                                borderRadius: '4px',
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Priority Skill Gaps */}
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold small text-uppercase text-muted mb-0" style={{ letterSpacing: '0.04em' }}>
                    Priority Skill Gaps
                  </h6>
                  <span className="text-muted" style={{ fontSize: '11px' }}>
                    Target role demand
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
                          ...tabularStyle,
                        }}
                      >
                        {item.skill} <span className="opacity-75">({item.demand_count})</span>
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
                  className="btn text-white fw-semibold py-2 shadow-sm"
                  style={{ backgroundColor: '#4F46E5', borderRadius: '10px', fontSize: '13.5px' }}
                >
                  <i className="bi bi-magic me-2"></i>Tailor Resume in AI Builder
                </Link>
                <Link
                  to="/interview-prep"
                  className="btn bg-white fw-semibold py-2"
                  style={{
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    borderRadius: '10px',
                    fontSize: '13.5px',
                  }}
                >
                  <i className="bi bi-stars me-2" style={{ color: '#4F46E5' }}></i>Open AI Interview Prep Hub
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: 6-Stage Kanban Pipeline Overview + Recent Activity Timeline */}
        <div className="row g-4">
          {/* Application Pipeline Card */}
          <div className="col-lg-5">
            <div className="card bg-white p-4 h-100" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-0">Application Pipeline</h5>
                  <small className="text-muted">Distribution across 6 Kanban stages</small>
                </div>
                <Link
                  to="/applications"
                  className="text-decoration-none small fw-semibold"
                  style={{ color: '#4F46E5' }}
                >
                  Open Board <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              {/* Proportional Pipeline Progress Bar */}
              {totalPipelineCount > 0 && (
                <div
                  className="progress mb-3"
                  style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '999px' }}
                >
                  {PIPELINE_STAGES.map((stage) => {
                    const count = Number(application_stats[stage.key] || 0);
                    const pct = (count / totalPipelineCount) * 100;
                    if (pct <= 0) return null;
                    return (
                      <div
                        key={stage.key}
                        className="progress-bar"
                        style={{ width: `${pct}%`, backgroundColor: stage.dot }}
                        title={`${stage.key}: ${count}`}
                      ></div>
                    );
                  })}
                </div>
              )}

              <div className="row g-2">
                {PIPELINE_STAGES.map((stage) => (
                  <div key={stage.key} className="col-4">
                    <div
                      className="p-3 rounded-4 text-center h-100"
                      style={{ backgroundColor: stage.bg, border: '1px solid #E2E8F0' }}
                    >
                      <div
                        className="fw-bold fs-4 mb-0"
                        style={{ color: stage.color, ...tabularStyle }}
                      >
                        {application_stats[stage.key] ?? 0}
                      </div>
                      <div
                        className="fw-semibold d-inline-flex align-items-center gap-1"
                        style={{ fontSize: '11.5px', color: '#334155' }}
                      >
                        <span
                          className="rounded-circle d-inline-block"
                          style={{ width: '6px', height: '6px', backgroundColor: stage.dot }}
                        ></span>
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
                  <h5 className="fw-bold text-dark mb-0">Recent Workspace Activity</h5>
                  <small className="text-muted">Latest resume audits, role matches, and mock sessions</small>
                </div>
                <span
                  className="badge rounded-pill px-3 py-1 fw-medium"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569', fontSize: '11px' }}
                >
                  Activity Log
                </span>
              </div>

              {recent_activities.length === 0 ? (
                <div
                  className="text-center py-5 rounded-4 my-auto"
                  style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1' }}
                >
                  <i className="bi bi-clock-history fs-3 text-muted"></i>
                  <p className="text-muted small mt-2 mb-0">
                    No recent activity yet. Upload a resume or start a mock interview to populate your timeline.
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
                          className={`d-inline-flex align-items-center justify-content-center rounded-3 bg-${
                            act.color || 'primary'
                          }-subtle text-${act.color || 'primary'} flex-shrink-0`}
                          style={{ width: '38px', height: '38px' }}
                        >
                          <i className={`bi ${act.icon || 'bi-activity'}`}></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark small">{act.title}</div>
                          <div className="text-muted" style={{ fontSize: '12px' }}>
                            {act.subtitle}
                          </div>
                        </div>
                      </div>
                      <span
                        className="badge rounded-pill bg-white text-muted border fw-normal d-none d-sm-inline-block"
                        style={{ fontSize: '10.5px' }}
                      >
                        Synced
                      </span>
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