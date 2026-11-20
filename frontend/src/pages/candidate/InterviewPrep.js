import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const PRACTICE_TRACKS = [
  {
    category: 'Technical',
    title: 'Technical Questions',
    desc: 'Core CS, system architecture, APIs, and stack-specific problem solving.',
    icon: 'bi-code-slash',
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
    badge: 'Core Stack',
  },
  {
    category: 'Behavioral',
    title: 'Behavioral (STAR)',
    desc: 'Situational leadership, conflict resolution, and teamwork narratives.',
    icon: 'bi-diagram-3-fill',
    iconBg: '#ECFDF5',
    iconColor: '#10B981',
    badge: 'STAR Rubric',
  },
  {
    category: 'HR',
    title: 'HR & Culture Fit',
    desc: 'Career goals, strengths, adaptability, and recruiter screening rounds.',
    icon: 'bi-people-fill',
    iconBg: '#EFF6FF',
    iconColor: '#2563EB',
    badge: 'Recruiter Prep',
  },
  {
    category: 'Project-based',
    title: 'Project Deep-Dive',
    desc: 'Architecture trade-offs, bottlenecks solved, and measurable impact.',
    icon: 'bi-kanban-fill',
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
    badge: 'Portfolio',
  },
  {
    category: 'Mixed',
    title: 'Mixed Full Mock',
    desc: 'Balanced simulation combining Technical, Behavioral, and HR questions.',
    icon: 'bi-stars',
    iconBg: '#F5F3FF',
    iconColor: '#7C3AED',
    badge: 'Recommended',
  },
];

const STAR_GUIDE = [
  { letter: 'S', title: 'Situation', desc: 'Set the context and project background concisely.', color: '#4F46E5', bg: '#EEF2FF' },
  { letter: 'T', title: 'Task', desc: 'Define your specific responsibility or challenge.', color: '#2563EB', bg: '#EFF6FF' },
  { letter: 'A', title: 'Action', desc: 'Detail the exact steps and tools you implemented.', color: '#7C3AED', bg: '#F5F3FF' },
  { letter: 'R', title: 'Result', desc: 'Quantify the outcome with metrics or lessons learned.', color: '#10B981', bg: '#ECFDF5' },
];

const InterviewPrep = () => {
  const [targetRole, setTargetRole] = useState('Full-Stack Software Developer');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHubData = async () => {
      setLoading(true);
      try {
        const [profileRes, sessionsRes] = await Promise.allSettled([
          api.get('/auth/profile/'),
          api.get('/interviews/sessions/'),
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value.data?.target_role) {
          setTargetRole(profileRes.value.data.target_role);
        }

        if (sessionsRes.status === 'fulfilled') {
          const list = Array.isArray(sessionsRes.value.data)
            ? sessionsRes.value.data
            : sessionsRes.value.data?.results || [];
          setSessions(list);
        }
      } finally {
        setLoading(false);
      }
    };
    loadHubData();
  }, []);

  const completedSessions = sessions.filter((s) => s.status === 'completed' || s.overall_score > 0);
  const avgScore =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + Number(s.overall_score || 0), 0) /
            completedSessions.length
        )
      : 78;

  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (Math.min(100, avgScore) / 100) * circumference;

  const cardStyle = {
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  };

  return (
    <div className="py-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="container">
        {/* Top SaaS Header */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <span
              className="badge rounded-pill px-3 py-1 fw-semibold mb-1"
              style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11.5px' }}
            >
              <i className="bi bi-stars me-1"></i> AI Coaching Studio
            </span>
            <h2 className="fw-bold mb-1" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
              AI Interview Preparation Hub
            </h2>
            <p className="text-muted small mb-0">
              Practice smarter with Groq AI evaluation, STAR behavioral rubrics, and role-specific question sets.
            </p>
          </div>

          <div className="d-flex gap-2">
            <Link
              to="/question-bank"
              className="btn btn-sm bg-white fw-semibold px-3 py-2"
              style={{ border: '1px solid #CBD5E1', color: '#334155', borderRadius: '10px' }}
            >
              <i className="bi bi-journal-text me-1 text-primary"></i> Browse Question Bank
            </Link>
            <Link
              to="/mock-interview"
              state={{ category: 'Mixed', role: targetRole }}
              className="btn btn-sm text-white fw-semibold px-4 py-2 shadow-sm"
              style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
            >
              <i className="bi bi-mic-fill me-1"></i> Start AI Interview
            </Link>
          </div>
        </div>

        {/* Target Role Context Strip */}
        <div className="card bg-white p-3 p-md-4 mb-4" style={cardStyle}>
          <div className="row g-3 align-items-center">
            <div className="col-md-5 d-flex align-items-center gap-3">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: '44px', height: '44px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}
              >
                <i className="bi bi-briefcase-fill fs-5"></i>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '11.5px' }}>Active Target Role</div>
                <div className="fw-bold text-dark">{targetRole}</div>
              </div>
            </div>

            <div className="col-md-4 d-flex align-items-center gap-3">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                style={{ width: '44px', height: '44px', backgroundColor: '#ECFDF5', color: '#10B981' }}
              >
                <i className="bi bi-cpu-fill fs-5"></i>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '11.5px' }}>AI Evaluator Engine</div>
                <div className="fw-bold text-dark">Groq Cloud LLM + STAR Rubric</div>
              </div>
            </div>

            <div className="col-md-3 text-md-end">
              <Link
                to="/profile"
                className="text-decoration-none small fw-semibold"
                style={{ color: '#4F46E5' }}
              >
                Change Target Track <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Left 8 Columns: Practice Tracks + STAR Method Coaching + How It Works */}
          <div className="col-lg-8">
            {/* Recommended Question Sets */}
            <div className="card bg-white p-4 mb-4" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-0">Recommended Practice Tracks</h5>
                  <small className="text-muted">Launch a targeted mock interview session by round type</small>
                </div>
                <Link
                  to="/question-bank"
                  className="text-decoration-none small fw-semibold"
                  style={{ color: '#4F46E5' }}
                >
                  View all questions <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              <div className="row g-3">
                {PRACTICE_TRACKS.map((track) => (
                  <div key={track.category} className="col-md-6">
                    <div
                      className="p-3 rounded-4 h-100 d-flex flex-column justify-content-between hover-card"
                      style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                    >
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div
                            className="d-inline-flex align-items-center justify-content-center rounded-3"
                            style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: track.iconBg,
                              color: track.iconColor,
                            }}
                          >
                            <i className={`bi ${track.icon} fs-5`}></i>
                          </div>
                          <span
                            className="badge rounded-pill px-2.5 py-1 fw-semibold"
                            style={{ backgroundColor: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0', fontSize: '11px' }}
                          >
                            {track.badge}
                          </span>
                        </div>

                        <h6 className="fw-bold text-dark mb-1">{track.title}</h6>
                        <p className="text-muted small mb-3" style={{ lineHeight: 1.5 }}>
                          {track.desc}
                        </p>
                      </div>

                      <Link
                        to="/mock-interview"
                        state={{ category: track.category, role: targetRole }}
                        className="btn btn-sm bg-white fw-semibold w-100 py-2"
                        style={{
                          color: '#4F46E5',
                          border: '1px solid #C7D2FE',
                          borderRadius: '10px',
                        }}
                      >
                        Practice {track.category} <i className="bi bi-play-fill ms-1"></i>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* STAR Behavioral Framework Coaching */}
            <div className="card bg-white p-4" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold text-dark mb-0">STAR Framework Coaching Guide</h5>
                  <small className="text-muted">
                    Our AI evaluator rewards structured behavioral stories covering all 4 pillars
                  </small>
                </div>
                <span
                  className="badge rounded-pill px-3 py-1 fw-semibold"
                  style={{ backgroundColor: '#ECFDF5', color: '#059669', fontSize: '11px' }}
                >
                  +15% Rubric Bonus
                </span>
              </div>

              <div className="row g-3">
                {STAR_GUIDE.map((item) => (
                  <div key={item.letter} className="col-sm-6 col-md-3">
                    <div
                      className="p-3 rounded-4 h-100 text-center"
                      style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                    >
                      <div
                        className="mx-auto d-inline-flex align-items-center justify-content-center rounded-circle fw-bold mb-2"
                        style={{
                          width: '38px',
                          height: '38px',
                          backgroundColor: item.bg,
                          color: item.color,
                          fontSize: '16px',
                        }}
                      >
                        {item.letter}
                      </div>
                      <div className="fw-bold text-dark small mb-1">{item.title}</div>
                      <p className="text-muted mb-0" style={{ fontSize: '11.5px', lineHeight: 1.45 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 4 Columns: Readiness Score Gauge + Recent Sessions */}
          <div className="col-lg-4">
            {/* Readiness Gauge Card */}
            <div className="card bg-white p-4 mb-4" style={cardStyle}>
              <h6 className="fw-bold text-dark mb-3">Interview Readiness Score</h6>

              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="position-relative d-inline-flex align-items-center justify-content-center flex-shrink-0">
                  <svg width="116" height="116" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="58" cy="58" r={radius} stroke="#E2E8F0" strokeWidth="9" fill="transparent" />
                    <circle
                      cx="58"
                      cy="58"
                      r={radius}
                      stroke="#4F46E5"
                      strokeWidth="9"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="position-absolute text-center">
                    <div className="fw-bold fs-4 lh-1" style={{ color: '#0F172A' }}>
                      {avgScore}
                    </div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>/100</div>
                  </div>
                </div>

                <div>
                  <span
                    className="badge rounded-pill px-2.5 py-1 fw-semibold mb-1"
                    style={{ backgroundColor: '#ECFDF5', color: '#059669', fontSize: '11px' }}
                  >
                    {avgScore >= 80 ? 'Interview Ready' : 'Good Momentum'}
                  </span>
                  <div className="small text-muted" style={{ lineHeight: 1.5 }}>
                    Based on {completedSessions.length} completed AI mock interview session(s).
                  </div>
                </div>
              </div>

              {/* Dimension Progress Bars */}
              {[
                { label: 'Technical Depth', val: Math.min(100, avgScore + 3), color: '#4F46E5' },
                { label: 'Communication & Clarity', val: avgScore, color: '#10B981' },
                { label: 'STAR Structure', val: Math.max(50, avgScore - 4), color: '#2563EB' },
              ].map((m, i) => (
                <div key={i} className={i < 2 ? 'mb-3' : 'mb-0'}>
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="fw-medium text-dark">{m.label}</span>
                    <span className="fw-bold" style={{ color: m.color }}>{m.val}/100</span>
                  </div>
                  <div className="progress" style={{ height: '6px', backgroundColor: '#F1F5F9' }}>
                    <div
                      className="progress-bar"
                      style={{ width: `${m.val}%`, backgroundColor: m.color, borderRadius: '4px' }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Previous Practice Sessions Card */}
            <div className="card bg-white p-4" style={cardStyle}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-dark mb-0">Recent Sessions</h6>
                <Link
                  to="/interview-history"
                  className="text-decoration-none small fw-semibold"
                  style={{ color: '#4F46E5' }}
                >
                  View All <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              {loading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm" style={{ color: '#4F46E5' }}></div>
                </div>
              ) : sessions.length === 0 ? (
                <div
                  className="text-center py-4 rounded-4 small text-muted"
                  style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1' }}
                >
                  No mock sessions recorded yet. Start a practice track on the left!
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {sessions.slice(0, 4).map((sess) => (
                    <Link
                      key={sess.id}
                      to={`/interview-report/${sess.id}`}
                      className="text-decoration-none p-3 rounded-3 d-flex justify-content-between align-items-center hover-card"
                      style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                    >
                      <div>
                        <div className="fw-bold text-dark small">
                          {sess.category || sess.session_type || 'Mock'} Round
                        </div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>
                          {sess.role_target || targetRole} •{' '}
                          {new Date(sess.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <span
                        className="badge rounded-pill px-2.5 py-1 fw-bold"
                        style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                      >
                        {Math.round(Number(sess.overall_score || 0))}%
                      </span>
                    </Link>
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

export default InterviewPrep;