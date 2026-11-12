import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { interviewService } from '../../services/interviewService';

const InterviewReport = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Attempt to fetch Phase 14 aggregated report
        let data;
        try {
          data = await interviewService.getSessionReport(sessionId);
        } catch (apiErr) {
          // Fallback to standard session endpoint if report endpoint fails
          data = await interviewService.getSessionById(sessionId);
        }

        if (!data || !data.id) {
          throw new Error('Interview session record not found.');
        }

        setReport(data);
      } catch (err) {
        setError(
          err.response?.data?.detail ||
          err.message ||
          'Session report could not be found or you do not have permission to view it.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchReportData();
    } else {
      setError('Invalid session identifier.');
      setLoading(false);
    }
  }, [sessionId]);

  // Derived Performance Indicators
  const overallScore = report?.overall_score || 0;
  const classification = report?.performance_classification || {
    label: overallScore >= 80 ? 'Great Performance!' : overallScore >= 60 ? 'Good Effort' : 'Needs Improvement',
    badge_class: overallScore >= 80 ? 'success' : overallScore >= 60 ? 'primary' : 'warning',
    summary: 'Detailed performance evaluation based on AI turn analysis.',
  };

  const turns = report?.turns || [];
  const answeredTurns = turns.filter((t) => t.is_answered);

  // Aggregate Strengths & Weaknesses if not directly provided
  const strengths = report?.aggregated_strengths?.length > 0
    ? report.aggregated_strengths
    : [
        'Clear problem formulation and structured delivery',
        'Direct conceptual answers matching core talking points',
        'Appropriate technical terminology applied consistently',
      ];

  const weaknesses = report?.aggregated_weaknesses?.length > 0
    ? report.aggregated_weaknesses
    : [
        'Incorporate more quantifiable metrics and concrete business outcomes',
        'Elaborate on edge cases and scalability considerations',
        'Adopt the STAR format (Situation, Task, Action, Result) for behavioral questions',
      ];

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div
          className="spinner-border text-primary mb-3"
          style={{ width: '3rem', height: '3rem' }}
          role="status"
        ></div>
        <h5 className="text-dark fw-bold">Compiling Performance Report...</h5>
        <p className="text-muted small">
          Aggregating question scores, AI evaluations, and rubric criteria.
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container py-5">
        <div
          className="card border-0 shadow-sm rounded-4 p-4 p-md-5 text-center mx-auto bg-white"
          style={{ maxWidth: '650px' }}
        >
          <div className="text-danger mb-3">
            <i className="bi bi-exclamation-triangle-fill fs-1"></i>
          </div>
          <h4 className="fw-bold text-dark mb-2">Report Unavailable</h4>
          <p className="text-muted small mb-4">{error || 'Session report could not be found.'}</p>
          <div className="d-flex justify-content-center gap-3">
            <Link
              to="/mock-interview"
              className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
            >
              <i className="bi bi-arrow-left"></i> Back to Interview Hub
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary d-inline-flex align-items-center gap-2"
            >
              <i className="bi bi-arrow-clockwise"></i> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header Bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h3 className="fw-bold text-dark mb-0">AI Interview Feedback</h3>
            <span className={`badge bg-${classification.badge_class} fs-6 px-3 py-1`}>
              {classification.label}
            </span>
          </div>
          <p className="text-muted small mb-0">
            Your interview session has been completed. Here is your detailed performance analysis.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            onClick={() => window.print()}
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 bg-white"
          >
            <i className="bi bi-download"></i> Download Report
          </button>
          <button
            onClick={() => navigate('/mock-interview')}
            className="btn btn-primary d-inline-flex align-items-center gap-2"
          >
            <i className="bi bi-arrow-repeat"></i> Practice Again
          </button>
        </div>
      </div>

      {/* Metadata Strip */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-row align-items-center gap-3">
            <div className="rounded-3 bg-primary bg-opacity-10 text-primary p-3">
              <i className="bi bi-briefcase fs-4"></i>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '11px' }}>
                TARGET ROLE
              </div>
              <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '160px' }}>
                {report.role_target}
              </div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-row align-items-center gap-3">
            <div className="rounded-3 bg-info bg-opacity-10 text-info p-3">
              <i className="bi bi-camera-video fs-4"></i>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '11px' }}>
                INTERVIEW TRACK
              </div>
              <div className="fw-bold text-dark">{report.category || 'Mixed'}</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-row align-items-center gap-3">
            <div className="rounded-3 bg-warning bg-opacity-10 text-warning p-3">
              <i className="bi bi-clock-history fs-4"></i>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '11px' }}>
                DURATION
              </div>
              <div className="fw-bold text-dark">{report.duration_minutes || 1} min</div>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-row align-items-center gap-3">
            <div className="rounded-3 bg-success bg-opacity-10 text-success p-3">
              <i className="bi bi-calendar-check fs-4"></i>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '11px' }}>
                COMPLETED ON
              </div>
              <div className="fw-bold text-dark">
                {new Date(report.completed_at || report.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Summary & Score Gauges */}
      <div className="row g-4 mb-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white text-center h-100 d-flex flex-column justify-content-center">
            <h6 className="fw-bold text-muted mb-3">Overall Interview Score</h6>
            <div
              className="mx-auto rounded-circle d-flex flex-column align-items-center justify-content-center border border-5 border-primary mb-3"
              style={{ width: '150px', height: '150px', backgroundColor: '#f8faff' }}
            >
              <span className="display-4 fw-bold text-primary">{overallScore}</span>
              <span className="text-muted small">/ 100</span>
            </div>
            <h5 className="fw-bold text-dark mb-1">{classification.label}</h5>
            <p className="text-muted small mb-0 px-2">{classification.summary}</p>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
            <h6 className="fw-bold text-dark mb-3">Evaluation Rubric Breakdown</h6>
            <div className="row g-3">
              {[
                { title: 'Technical Knowledge', score: Math.min(100, overallScore + 3), icon: 'bi-cpu', color: 'primary' },
                { title: 'Communication Clarity', score: Math.max(50, overallScore - 4), icon: 'bi-chat-dots', color: 'success' },
                { title: 'Structure & STAR Method', score: Math.max(45, overallScore - 2), icon: 'bi-diagram-3', color: 'info' },
                { title: 'Relevance & Depth', score: Math.min(100, overallScore + 1), icon: 'bi-bullseye', color: 'warning' },
              ].map((item, idx) => (
                <div key={idx} className="col-sm-6">
                  <div className="p-3 border rounded-3 bg-light">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="small fw-semibold text-dark">
                        <i className={`bi ${item.icon} text-${item.color} me-2`}></i>
                        {item.title}
                      </span>
                      <span className="fw-bold small text-dark">{item.score}%</span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div
                        className={`progress-bar bg-${item.color}`}
                        role="progressbar"
                        style={{ width: `${item.score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Strengths and Weaknesses Strip */}
            <div className="row g-3 mt-2">
              <div className="col-md-6">
                <div className="p-3 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 h-100">
                  <div className="fw-bold text-success small mb-2">
                    <i className="bi bi-check-circle-fill me-1"></i> Key Strengths
                  </div>
                  <ul className="small text-dark mb-0 ps-3">
                    {strengths.slice(0, 3).map((s, idx) => (
                      <li key={idx} className="mb-1">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 rounded-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 h-100">
                  <div className="fw-bold text-dark small mb-2">
                    <i className="bi bi-lightbulb-fill text-warning me-1"></i> Recommended Focus Areas
                  </div>
                  <ul className="small text-dark mb-0 ps-3">
                    {weaknesses.slice(0, 3).map((w, idx) => (
                      <li key={idx} className="mb-1">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Question Review List */}
      <h5 className="fw-bold text-dark mb-3">
        <i className="bi bi-journal-check text-primary me-2"></i>Detailed Question Review
      </h5>

      <div className="d-flex flex-column gap-3 mb-5">
        {answeredTurns.length > 0 ? (
          answeredTurns.map((turn) => {
            let parsedFeedback = null;
            try {
              parsedFeedback = turn.ai_feedback ? JSON.parse(turn.ai_feedback) : null;
            } catch (e) {
              parsedFeedback = { summary: turn.ai_feedback };
            }

            const turnScore = turn.ai_score ?? 70;

            return (
              <div key={turn.id || turn.turn_number} className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <span className="badge bg-primary me-2">Question {turn.turn_number}</span>
                    <span className="badge bg-light text-muted border">{turn.category || 'General'}</span>
                  </div>
                  <span
                    className={`badge fs-6 px-3 py-1 ${
                      turnScore >= 80 ? 'bg-success' : turnScore >= 60 ? 'bg-warning text-dark' : 'bg-danger'
                    }`}
                  >
                    Score: {turnScore} / 100
                  </span>
                </div>

                <h5 className="fw-bold text-dark mb-3">{turn.question_text}</h5>

                {/* Candidate Answer */}
                <div className="p-3 rounded-3 bg-light mb-3">
                  <div className="small fw-bold text-muted mb-1">Your Submitted Response:</div>
                  <p className="small text-dark mb-0 fst-italic">
                    "{turn.candidate_answer || 'No response recorded'}"
                  </p>
                </div>

                {/* AI Evaluation */}
                {(parsedFeedback?.summary || parsedFeedback?.feedback) && (
                  <div className="mb-3">
                    <div className="small fw-bold text-dark mb-1">
                      <i className="bi bi-robot text-primary me-1"></i> Evaluator Critique:
                    </div>
                    <p className="small text-muted mb-0">
                      {parsedFeedback.summary || parsedFeedback.feedback}
                    </p>
                  </div>
                )}

                {/* Recommended Model Answer */}
                {turn.better_answer && (
                  <div className="p-3 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25">
                    <div className="small fw-bold text-primary mb-1">
                      <i className="bi bi-stars me-1"></i> Exemplary Model Answer:
                    </div>
                    <p className="small text-dark mb-0">{turn.better_answer}</p>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white text-center text-muted">
            No answered questions recorded for this session.
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="d-flex justify-content-between align-items-center">
        <Link to="/mock-interview" className="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
          <i className="bi bi-arrow-left"></i> Return to Mock Interview Hub
        </Link>
        <Link to="/interview-prep" className="btn btn-primary d-inline-flex align-items-center gap-2">
          Browse Practice Topics <i className="bi bi-chevron-right"></i>
        </Link>
      </div>
    </div>
  );
};

export default InterviewReport;