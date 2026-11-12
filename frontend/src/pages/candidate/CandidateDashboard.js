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

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading dashboard...</span>
        </div>
        <p className="text-muted mt-3">Aggregating your career readiness analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
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
    candidate,
    kpis,
    active_resume,
    top_matches,
    skill_gaps,
    application_stats,
    interview_trend,
    radar_metrics,
    recent_activities,
  } = data;

  // Radar Chart Config
  const radarData = {
    labels: radar_metrics.labels,
    datasets: [
      {
        label: 'Your Career Readiness (%)',
        data: radar_metrics.values,
        backgroundColor: 'rgba(79, 70, 229, 0.18)',
        borderColor: '#4f46e5',
        borderWidth: 2,
        pointBackgroundColor: '#4f46e5',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#4f46e5',
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
        ticks: { stepSize: 25, backdropColor: 'transparent', font: { size: 10 } },
        grid: { color: '#e2e8f0' },
        pointLabels: { font: { size: 11, weight: '600' }, color: '#334155' },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  // Interview Score Trend Line Chart Config
  const lineData = {
    labels: interview_trend.length > 0 ? interview_trend.map((item) => item.date) : ['No Data'],
    datasets: [
      {
        label: 'Interview Score (%)',
        data: interview_trend.length > 0 ? interview_trend.map((item) => item.score) : [0],
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderColor: '#10b981',
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#10b981',
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 100, ticks: { stepSize: 25 } },
      x: { grid: { display: false } },
    },
    plugins: {
      legend: { display: false },
    },
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'bg-success-subtle text-success border border-success-subtle';
    if (score >= 60) return 'bg-primary-subtle text-primary border border-primary-subtle';
    return 'bg-warning-subtle text-warning border border-warning-subtle';
  };

  return (
    <div className="container py-4">
      {/* Header & Profile Completion Strip */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white">
        <div className="card-body p-4">
          <div className="row align-items-center g-3">
            <div className="col-lg-7">
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-1">
                  <i className="bi bi-stars me-1"></i> Candidate Workspace
                </span>
                <span className="text-muted small">
                  Target Track: <strong>{candidate.target_role}</strong>
                </span>
              </div>
              <h2 className="fw-bold text-dark mb-1">Welcome back, {candidate.name}</h2>
              <p className="text-muted mb-0">
                Track your ATS resume score, skill gaps, job compatibility, and mock interview progress.
              </p>
            </div>

            <div className="col-lg-5">
              <div className="p-3 rounded-3 bg-light border">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-semibold small text-dark">
                    <i className="bi bi-person-check-fill text-primary me-1"></i>
                    Profile Completeness
                  </span>
                  <span className="fw-bold text-primary small">{candidate.profile_completion}%</span>
                </div>
                <div className="progress mb-2" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-primary"
                    role="progressbar"
                    style={{ width: `${candidate.profile_completion}%` }}
                    aria-valuenow={candidate.profile_completion}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted small">{candidate.skills_count} verified skills</span>
                  <Link to="/profile" className="text-decoration-none small fw-semibold">
                    Update Profile <i className="bi bi-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="p-2 rounded-3 bg-primary-subtle text-primary">
                  <i className="bi bi-file-earmark-bar-graph fs-4"></i>
                </div>
                <Link to="/resume-analyzer" className="btn btn-sm btn-light rounded-pill">
                  Analyze
                </Link>
              </div>
              <h3 className="fw-bold mb-1">{kpis.ats_score}/100</h3>
              <p className="text-muted small mb-0">Latest ATS Resume Score</p>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="p-2 rounded-3 bg-success-subtle text-success">
                  <i className="bi bi-briefcase-fill fs-4"></i>
                </div>
                <Link to="/job-matching" className="btn btn-sm btn-light rounded-pill">
                  View Matches
                </Link>
              </div>
              <h3 className="fw-bold mb-1">{kpis.avg_job_fit}%</h3>
              <p className="text-muted small mb-0">
                Avg Job Fit ({kpis.job_matches_count} roles matched)
              </p>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="p-2 rounded-3 bg-info-subtle text-info">
                  <i className="bi bi-kanban fs-4"></i>
                </div>
                <Link to="/applications" className="btn btn-sm btn-light rounded-pill">
                  Kanban
                </Link>
              </div>
              <h3 className="fw-bold mb-1">{kpis.total_applications}</h3>
              <p className="text-muted small mb-0">
                Tracked Applications ({kpis.saved_jobs} Saved)
              </p>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="p-2 rounded-3 bg-warning-subtle text-warning">
                  <i className="bi bi-mic-fill fs-4"></i>
                </div>
                <Link to="/mock-interview" className="btn btn-sm btn-light rounded-pill">
                  Practice
                </Link>
              </div>
              <h3 className="fw-bold mb-1">{kpis.avg_interview_score}%</h3>
              <p className="text-muted small mb-0">
                Avg Interview Score ({kpis.completed_interviews} done)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row: Career Readiness Radar + Interview Performance Trend */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0">Career Readiness Radar</h5>
                  <small className="text-muted">6-dimension employability benchmark</small>
                </div>
                <span className="badge bg-light text-dark border">Live Metrics</span>
              </div>
              <div style={{ height: '270px' }}>
                <Radar data={radarData} options={radarOptions} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0">Mock Interview Score Trend</h5>
                  <small className="text-muted">Recent completed session scores</small>
                </div>
                <Link to="/interview-history" className="btn btn-sm btn-outline-primary">
                  Full History
                </Link>
              </div>
              {interview_trend.length > 0 ? (
                <div style={{ height: '270px' }}>
                  <Line data={lineData} options={lineOptions} />
                </div>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-chat-square-dots fs-1 text-muted"></i>
                  <p className="text-muted mt-2 mb-3">
                    No completed mock interviews yet. Start a session to chart your progress.
                  </p>
                  <Link to="/mock-interview" className="btn btn-primary btn-sm">
                    Start Mock Interview
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Top Job Recommendations & Skill Gap Priorities */}
      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0">Top Recommended Jobs</h5>
                  <small className="text-muted">
                    {active_resume
                      ? `Matched against ${active_resume.filename}`
                      : 'Upload a resume for personalized compatibility scores'}
                  </small>
                </div>
                <Link to="/job-matching" className="btn btn-sm btn-outline-primary">
                  Explore All
                </Link>
              </div>

              {top_matches.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  No jobs available yet. Visit Job Descriptions to seed sample positions.
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {top_matches.map((job) => (
                    <div
                      key={job.job_id}
                      className="list-group-item px-0 py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2"
                    >
                      <div>
                        <h6 className="fw-bold mb-1">{job.title}</h6>
                        <div className="text-muted small mb-2">
                          <i className="bi bi-building me-1"></i>
                          {job.company} • <i className="bi bi-geo-alt me-1"></i>
                          {job.location}
                        </div>
                        <div className="d-flex flex-wrap gap-1">
                          {job.matched_skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="badge bg-success-subtle text-success fw-normal"
                            >
                              ✓ {skill}
                            </span>
                          ))}
                          {job.missing_skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="badge bg-danger-subtle text-danger fw-normal"
                            >
                              + {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-end">
                        <span className={`badge rounded-pill px-3 py-2 ${getScoreBadgeClass(job.match_score)}`}>
                          {job.match_score}% Match
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-0">Priority Skill Gaps</h5>
                    <small className="text-muted">High-demand skills missing from your resume</small>
                  </div>
                  <i className="bi bi-lightning-charge-fill text-warning fs-5"></i>
                </div>

                {skill_gaps.length > 0 ? (
                  <div className="d-flex flex-wrap gap-2 mb-4">
                    {skill_gaps.map((item, idx) => (
                      <span
                        key={idx}
                        className="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 rounded-pill"
                      >
                        {item.skill}{' '}
                        <span className="ms-1 opacity-75">({item.demand_count} roles)</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="alert alert-success small mb-4">
                    <i className="bi bi-check-circle-fill me-1"></i>
                    Great alignment! No critical missing skills detected across top matches.
                  </div>
                )}

                <h6 className="fw-bold small text-uppercase text-muted mb-2">
                  Application Pipeline Snapshot
                </h6>
                <div className="row g-2 text-center mb-3">
                  {Object.entries(application_stats).map(([stage, count]) => (
                    <div key={stage} className="col-4">
                      <div className="p-2 border rounded-3 bg-light">
                        <div className="fw-bold text-dark">{count}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {stage}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="d-grid gap-2 mt-2">
                <Link to="/resumes" className="btn btn-primary">
                  <i className="bi bi-cloud-arrow-up me-2"></i>Upload / Update Resume
                </Link>
                <Link to="/interview-prep" className="btn btn-outline-secondary">
                  <i className="bi bi-stars me-2"></i>Open AI Interview Prep Hub
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Activity Timeline */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">Recent Activity</h5>
          {recent_activities.length === 0 ? (
            <p className="text-muted mb-0">
              No recent activity yet. Upload a resume or start a mock interview to begin.
            </p>
          ) : (
            <div className="row g-3">
              {recent_activities.map((act, index) => (
                <div key={index} className="col-md-6 col-lg-4">
                  <div className="d-flex align-items-start gap-3 p-3 rounded-3 border bg-light h-100">
                    <div className={`p-2 rounded-circle bg-${act.color}-subtle text-${act.color}`}>
                      <i className={`bi ${act.icon}`}></i>
                    </div>
                    <div>
                      <div className="fw-semibold text-dark small">{act.title}</div>
                      <div className="text-muted small">{act.subtitle}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;