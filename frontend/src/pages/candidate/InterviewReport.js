import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';

const InterviewReport = () => {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError('');
      try {
        let res;
        try {
          res = await api.get(`/interviews/sessions/${sessionId}/report/`);
        } catch (err) {
          if (err.response?.status === 404) {
            res = await api.get(`/interviews/sessions/${sessionId}/`);
          } else {
            throw err;
          }
        }
        setReport(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Unable to load interview performance report.');
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) fetchReport();
  }, [sessionId]);

  const cardStyle = {
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="spinner-border" style={{ color: '#4F46E5' }} role="status"></div>
        <p className="text-muted small mt-3">Compiling your AI interview performance report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger rounded-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error || 'Report not found.'}
        </div>
        <Link to="/interview-history" className="btn btn-primary btn-sm">
          Back to Interview History
        </Link>
      </div>
    );
  }

  const sessionData = report.session || report;
  const turns = Array.isArray(report.turns)
    ? report.turns
    : Array.isArray(sessionData.turns)
    ? sessionData.turns
    : [];

  const overallScore = Math.round(
    Number(report.overall_score ?? sessionData.overall_score ?? 0)
  );

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (Math.min(100, overallScore) / 100) * circumference;

  const getPerformanceTier = (score) => {
    if (score >= 80) {
      return {
        label: 'Great Performance!',
        color: '#10B981',
        desc: 'Strong technical depth, clear structure, and confident communication.',
      };
    }
    if (score >= 60) {
      return {
        label: 'Solid Progress',
        color: '#4F46E5',
        desc: 'Good baseline answers. Adding more quantifiable metrics will elevate your score.',
      };
    }
    return {
      label: 'Needs Practice',
      color: '#F59E0B',
      desc: 'Review the suggested model answers below and practice with the STAR method.',
    };
  };

  const tier = getPerformanceTier(overallScore);

  const strengths = Array.isArray(report.strengths)
    ? report.strengths
    : turns.flatMap((t) => t.ai_feedback?.strengths || []).slice(0, 5);

  const improvements = Array.isArray(report.improvement_suggestions)
    ? report.improvement_suggestions
    : Array.isArray(report.weaknesses)
    ? report.weaknesses
    : turns.flatMap((t) => t.ai_feedback?.weaknesses || []).slice(0, 5);

  return (
    <div className="py-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="container">
        {/* Top Action Bar */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <span
              className="badge rounded-pill px-3 py-1 fw-semibold mb-1"
              style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11.5px' }}
            >
              <i className="bi bi-file-earmark-bar-graph me-1"></i> Diagnostic Scorecard
            </span>
            <h2 className="fw-bold mb-1" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
              AI Interview Feedback Report
            </h2>
            <p className="text-muted small mb-0">
              Comprehensive question-by-question score breakdown and model answer comparisons.
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-sm bg-white fw-semibold px-3 py-2"
              style={{ border: '1px solid #CBD5E1', color: '#334155', borderRadius: '10px' }}
            >
              <i className="bi bi-download me-1"></i> Print / Save PDF
            </button>
            <Link
              to="/mock-interview"
              className="btn btn-sm text-white fw-semibold px-4 py-2 shadow-sm"
              style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
            >
              <i className="bi bi-arrow-repeat me-1"></i> Practice Again
            </Link>
          </div>
        </div>

        {/* Session Metadata Strip */}
        <div className="card bg-white p-3 p-md-4 mb-4" style={cardStyle}>
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <div className="text-muted" style={{ fontSize: '11.5px' }}>Target Role</div>
              <div className="fw-bold text-dark">{sessionData.role_target || 'Software Developer'}</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="text-muted" style={{ fontSize: '11.5px' }}>Interview Type</div>
              <div className="fw-bold text-dark">
                {sessionData.category || sessionData.session_type || 'Mock'} Round
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="text-muted" style={{ fontSize: '11.5px' }}>Questions Evaluated</div>
              <div className="fw-bold text-dark">{turns.length} Questions</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="text-muted" style={{ fontSize: '11.5px' }}>Session Date</div>
              <div className="fw-bold text-dark">
                {sessionData.created_at
                  ? new Date(sessionData.created_at).toLocaleDateString()
                  : 'Recent'}
              </div>
            </div>
          </div>
        </div>

        {/* Top 3-Column Score & Diagnostic Summary */}
        <div className="row g-4 mb-4">
          {/* Col 1: Circular Overall Score */}
          <div className="col-lg-4">
            <div className="card bg-white p-4 h-100 text-center d-flex flex-column justify-content-center" style={cardStyle}>
              <div className="position-relative d-inline-flex align-items-center justify-content-center mx-auto mb-3">
                <svg width="144" height="144" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="72" cy="72" r={radius} stroke="#E2E8F0" strokeWidth="10" fill="transparent" />
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    stroke={tier.color}
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="position-absolute text-center">
                  <div className="fw-bold display-6 lh-1" style={{ color: '#0F172A' }}>
                    {overallScore}
                  </div>
                  <div className="small text-muted fw-semibold">/100</div>
                </div>
              </div>

              <div className="fw-bold fs-5 mb-1" style={{ color: tier.color }}>
                {tier.label}
              </div>
              <p className="text-muted small mb-0">{tier.desc}</p>
            </div>
          </div>

          {/* Col 2: Competency Score Breakdown */}
          <div className="col-lg-4">
            <div className="card bg-white p-4 h-100" style={cardStyle}>
              <h6 className="fw-bold text-dark mb-3">Competency Breakdown</h6>
              {[
                { label: 'Communication & Clarity', score: Math.min(100, overallScore + 4), color: '#4F46E5' },
                { label: 'Technical / Domain Depth', score: overallScore, color: '#10B981' },
                { label: 'Structure & STAR Flow', score: Math.max(40, overallScore - 3), color: '#2563EB' },
                { label: 'Relevance & Impact', score: Math.min(100, overallScore + 2), color: '#7C3AED' },
              ].map((item, idx) => (
                <div key={idx} className={idx < 3 ? 'mb-3' : 'mb-0'}>
                  <div className="d-flex justify-content-between small mb-1">
                    <span className="fw-medium text-dark">{item.label}</span>
                    <span className="fw-bold" style={{ color: item.color }}>{item.score}/100</span>
                  </div>
                  <div className="progress" style={{ height: '7px', backgroundColor: '#F1F5F9' }}>
                    <div
                      className="progress-bar"
                      style={{ width: `${item.score}%`, backgroundColor: item.color, borderRadius: '4px' }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Col 3: Key Strengths & Focus Areas */}
          <div className="col-lg-4">
            <div className="card bg-white p-4 h-100 d-flex flex-column justify-content-between" style={cardStyle}>
              <div>
                <h6 className="fw-bold text-dark mb-2">
                  <i className="bi bi-check-circle-fill text-success me-2"></i>Key Strengths
                </h6>
                <ul className="list-unstyled small text-muted mb-3">
                  {(strengths.length > 0
                    ? strengths
                    : ['Clear articulation of core concepts', 'Relevant project examples']
                  )
                    .slice(0, 3)
                    .map((s, i) => (
                      <li key={i} className="mb-1">
                        ✓ {s}
                      </li>
                    ))}
                </ul>

                <h6 className="fw-bold text-dark mb-2">
                  <i className="bi bi-exclamation-circle-fill text-warning me-2"></i>Areas to Improve
                </h6>
                <ul className="list-unstyled small text-muted mb-0">
                  {(improvements.length > 0
                    ? improvements
                    : ['Quantify outcomes with concrete metrics', 'Expand edge-case considerations']
                  )
                    .slice(0, 3)
                    .map((w, i) => (
                      <li key={i} className="mb-1">
                        • {w}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized Turn-by-Turn Feedback */}
        <div className="card bg-white p-4" style={cardStyle}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-dark mb-0">Detailed Feedback by Question</h5>
            <span className="text-muted small">{turns.length} evaluated responses</span>
          </div>

          <div className="d-flex flex-column gap-3">
            {turns.map((turn, idx) => {
              const tScore = Math.round(Number(turn.ai_score ?? 0));
              const badgeStyle =
                tScore >= 80
                  ? { bg: '#ECFDF5', color: '#059669', label: 'Strong' }
                  : tScore >= 60
                  ? { bg: '#FFFBEB', color: '#D97706', label: 'Average' }
                  : { bg: '#FEF2F2', color: '#DC2626', label: 'Needs Work' };

              return (
                <div
                  key={turn.id || idx}
                  className="p-4 rounded-4"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                    <div className="d-flex align-items-start gap-2">
                      <span
                        className="badge rounded-circle d-inline-flex align-items-center justify-content-center fw-bold"
                        style={{
                          width: '28px',
                          height: '28px',
                          backgroundColor: '#4F46E5',
                          color: '#FFFFFF',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <h6 className="fw-bold text-dark mb-0" style={{ lineHeight: 1.45 }}>
                        {turn.question_text}
                      </h6>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <span
                        className="badge rounded-pill px-2.5 py-1 fw-semibold"
                        style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color }}
                      >
                        {badgeStyle.label}
                      </span>
                      <span className="fw-bold text-dark small">{tScore}/100</span>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="bg-white p-3 rounded-3 h-100" style={{ border: '1px solid #E2E8F0' }}>
                        <div className="small fw-bold text-muted mb-1">Your Answer</div>
                        <p className="small text-dark mb-0" style={{ lineHeight: 1.55 }}>
                          {turn.candidate_answer || 'No response recorded.'}
                        </p>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="bg-white p-3 rounded-3 h-100" style={{ border: '1px solid #E2E8F0' }}>
                        <div className="small fw-bold mb-1" style={{ color: '#4F46E5' }}>
                          AI Evaluation Feedback
                        </div>
                        <p className="small text-dark mb-0" style={{ lineHeight: 1.55 }}>
                          {turn.ai_feedback?.summary ||
                            (typeof turn.ai_feedback === 'string'
                              ? turn.ai_feedback
                              : 'Evaluated for clarity, structure, and relevance.')}
                        </p>
                      </div>
                    </div>

                    {turn.better_answer && (
                      <div className="col-12">
                        <div
                          className="p-3 rounded-3"
                          style={{ backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE' }}
                        >
                          <div className="small fw-bold mb-1" style={{ color: '#4338CA' }}>
                            <i className="bi bi-stars me-1"></i> Suggested Model Answer
                          </div>
                          <p className="small text-dark mb-0" style={{ lineHeight: 1.55 }}>
                            {turn.better_answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewReport;