import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const MockInterview = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Setup configuration (auto-prefilled if coming from InterviewPrep or QuestionBank)
  const [roleTarget, setRoleTarget] = useState(
    location.state?.role || 'Full-Stack Software Developer'
  );
  const [category, setCategory] = useState(location.state?.category || 'Technical');
  const [difficulty, setDifficulty] = useState(location.state?.difficulty || 'Medium');
  const [numQuestions, setNumQuestions] = useState(3);

  // Active Session State
  const [activeSession, setActiveSession] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [latestFeedback, setLatestFeedback] = useState(null);

  // UI & Timer State
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [pastSessions, setPastSessions] = useState([]);
  const [error, setError] = useState('');

  const loadPastSessions = async () => {
    try {
      const res = await api.get('/interviews/sessions/');
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setPastSessions(list);
    } catch (err) {
      // Ignore silent history fetch errors
    }
  };

  useEffect(() => {
    loadPastSessions();
  }, []);

  // Stopwatch per active question
  useEffect(() => {
    if (!activeSession || !currentTurn || latestFeedback) return;
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSession, currentTurn, latestFeedback]);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    setStarting(true);
    setError('');
    setLatestFeedback(null);
    setCandidateAnswer('');
    setSecondsElapsed(0);

    try {
      const res = await api.post('/interviews/sessions/start/', {
        role_target: roleTarget,
        category,
        session_type: category,
        difficulty,
        num_questions: Number(numQuestions),
      });

      const sessionObj = res.data?.session || res.data;
      setActiveSession(sessionObj);

      const firstUnanswered =
        sessionObj.turns?.find((t) => !t.is_answered) || sessionObj.turns?.[0] || null;
      setCurrentTurn(firstUnanswered);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Unable to start mock interview session. Ensure backend questions are seeded.'
      );
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!candidateAnswer.trim() || !activeSession || !currentTurn) return;

    setSubmitting(true);
    setError('');

    try {
      let res;
      const payload = {
        turn_id: currentTurn.id,
        candidate_answer: candidateAnswer.trim(),
      };

      try {
        res = await api.post(
          `/interviews/sessions/${activeSession.id}/submit-turn/`,
          payload
        );
      } catch (err) {
        if (err.response?.status === 404) {
          res = await api.post(
            `/interviews/sessions/${activeSession.id}/submit/`,
            payload
          );
        } else {
          throw err;
        }
      }

      const updatedSession = res.data?.session || activeSession;
      const evaluatedTurn = res.data?.turn || res.data;

      setActiveSession(updatedSession);
      setLatestFeedback({
        score: Math.round(Number(evaluatedTurn?.ai_score ?? res.data?.score ?? 75)),
        feedback: evaluatedTurn?.ai_feedback || res.data?.feedback || {},
        better_answer:
          evaluatedTurn?.better_answer ||
          res.data?.better_answer ||
          evaluatedTurn?.ai_feedback?.better_answer ||
          '',
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to evaluate answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceedNext = () => {
    setLatestFeedback(null);
    setCandidateAnswer('');
    setSecondsElapsed(0);

    const nextTurn = activeSession?.turns?.find((t) => !t.is_answered);
    if (nextTurn) {
      setCurrentTurn(nextTurn);
    } else {
      setCurrentTurn(null);
      setActiveSession((prev) => ({ ...prev, status: 'completed' }));
      loadPastSessions();
    }
  };

  const totalTurns = activeSession?.turns?.length || Number(numQuestions);
  const answeredCount =
    activeSession?.turns?.filter((t) => t.is_answered).length || 0;
  const progressPct =
    totalTurns > 0 ? Math.round((answeredCount / totalTurns) * 100) : 0;

  const wordCount = candidateAnswer
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const cardStyle = {
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  };

  return (
    <div className="py-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="container">
        {/* Top Header */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <span
              className="badge rounded-pill px-3 py-1 fw-semibold mb-1"
              style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11.5px' }}
            >
              <i className="bi bi-mic-fill me-1"></i> Groq AI Evaluator
            </span>
            <h2 className="fw-bold mb-1" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
              AI Mock Interview Studio
            </h2>
            <p className="text-muted small mb-0">
              Simulate realistic Technical, Behavioral (STAR), and HR interviews with instant turn-by-turn feedback.
            </p>
          </div>

          <div className="d-flex gap-2">
            <Link
              to="/interview-prep"
              className="btn btn-sm bg-white fw-semibold px-3 py-2"
              style={{ border: '1px solid #CBD5E1', color: '#334155', borderRadius: '10px' }}
            >
              <i className="bi bi-compass me-1 text-primary"></i> Prep Hub
            </Link>
            <Link
              to="/interview-history"
              className="btn btn-sm bg-white fw-semibold px-3 py-2"
              style={{ border: '1px solid #CBD5E1', color: '#334155', borderRadius: '10px' }}
            >
              <i className="bi bi-clock-history me-1 text-primary"></i> Session History
            </Link>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger rounded-4 d-flex justify-content-between align-items-center mb-4">
            <span className="small fw-semibold">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </span>
            <button type="button" className="btn-close btn-sm" onClick={() => setError('')}></button>
          </div>
        )}

        {/* VIEW 1: SESSION SETUP & RECENT RECORDS */}
        {!activeSession ? (
          <div className="row g-4">
            {/* Left 7 Cols: Session Configurator */}
            <div className="col-lg-7">
              <div className="card bg-white p-4 p-md-5" style={cardStyle}>
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-3"
                    style={{ width: '48px', height: '48px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                  >
                    <i className="bi bi-sliders2 fs-4"></i>
                  </div>
                  <div>
                    <h5 className="fw-bold text-dark mb-0">Configure Interview Session</h5>
                    <small className="text-muted">Customize your target role, round focus, and difficulty</small>
                  </div>
                </div>

                <form onSubmit={handleStartSession}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Target Job Role</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={roleTarget}
                      onChange={(e) => setRoleTarget(e.target.value)}
                      placeholder="e.g. Python Full-Stack Developer"
                    />
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-dark">Interview Track</label>
                      <select
                        className="form-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="Technical">Technical</option>
                        <option value="Behavioral">Behavioral (STAR)</option>
                        <option value="HR">HR &amp; Culture</option>
                        <option value="Project-based">Project Deep-Dive</option>
                        <option value="Mixed">Mixed Full Round</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-dark">Difficulty</label>
                      <select
                        className="form-select"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-dark">Questions</label>
                      <select
                        className="form-select"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(Number(e.target.value))}
                      >
                        <option value={3}>3 Questions (Quick)</option>
                        <option value={5}>5 Questions (Standard)</option>
                        <option value={8}>8 Questions (Deep)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={starting}
                    className="btn text-white fw-semibold w-100 py-3 shadow-sm"
                    style={{ backgroundColor: '#4F46E5', borderRadius: '12px' }}
                  >
                    {starting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Initializing AI Interviewer...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-play-circle-fill me-2"></i>
                        Begin Mock Interview Session
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right 5 Cols: Recent Sessions & Tips */}
            <div className="col-lg-5">
              <div className="card bg-white p-4 mb-4" style={cardStyle}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-dark mb-0">Recent Interview Records</h6>
                  <Link
                    to="/interview-history"
                    className="text-decoration-none small fw-semibold"
                    style={{ color: '#4F46E5' }}
                  >
                    Full History
                  </Link>
                </div>

                {pastSessions.length === 0 ? (
                  <div
                    className="text-center py-4 rounded-4 small text-muted"
                    style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1' }}
                  >
                    No sessions completed yet. Start your first mock interview on the left!
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {pastSessions.slice(0, 4).map((sess) => (
                      <div
                        key={sess.id}
                        className="p-3 rounded-3 d-flex justify-content-between align-items-center"
                        style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                      >
                        <div>
                          <div className="fw-bold text-dark small">
                            {sess.category || sess.session_type} • {sess.role_target}
                          </div>
                          <div className="text-muted" style={{ fontSize: '11.5px' }}>
                            {new Date(sess.created_at).toLocaleDateString()} • Score:{' '}
                            <strong>{Math.round(Number(sess.overall_score || 0))}%</strong>
                          </div>
                        </div>
                        <Link
                          to={`/interview-report/${sess.id}`}
                          className="btn btn-sm fw-semibold px-3"
                          style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '8px' }}
                        >
                          Report
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Interview Tips */}
              <div className="card bg-white p-4" style={cardStyle}>
                <h6 className="fw-bold text-dark mb-3">
                  <i className="bi bi-lightbulb-fill me-2" style={{ color: '#4F46E5' }}></i>
                  Pro Tips for High AI Scores
                </h6>
                <ul className="list-unstyled d-flex flex-column gap-2 mb-0 small text-muted">
                  <li className="d-flex align-items-start gap-2">
                    <i className="bi bi-check-circle-fill text-success mt-1"></i>
                    <span>Aim for 40–120 clear, structured words per response.</span>
                  </li>
                  <li className="d-flex align-items-start gap-2">
                    <i className="bi bi-check-circle-fill text-success mt-1"></i>
                    <span>For Behavioral questions, explicitly state Situation, Task, Action, and Result.</span>
                  </li>
                  <li className="d-flex align-items-start gap-2">
                    <i className="bi bi-check-circle-fill text-success mt-1"></i>
                    <span>Mention trade-offs and concrete metrics in Technical answers.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : activeSession.status === 'completed' || !currentTurn ? (
          /* VIEW 2: SESSION COMPLETED SUMMARY CARD */
          <div className="card bg-white p-5 text-center mx-auto" style={{ ...cardStyle, maxWidth: '640px' }}>
            <div
              className="mx-auto d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{ width: '72px', height: '72px', backgroundColor: '#ECFDF5', color: '#10B981' }}
            >
              <i className="bi bi-trophy-fill fs-1"></i>
            </div>
            <h3 className="fw-bold text-dark mb-1">Mock Interview Completed!</h3>
            <p className="text-muted small mb-4">
              Your answers have been evaluated and compiled into a full diagnostic performance scorecard.
            </p>

            <div className="d-flex flex-wrap justify-content-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/interview-report/${activeSession.id}`)}
                className="btn text-white fw-semibold px-4 py-2 shadow-sm"
                style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
              >
                <i className="bi bi-file-earmark-bar-graph me-2"></i>
                View Full Performance Report
              </button>
              <button
                type="button"
                onClick={() => setActiveSession(null)}
                className="btn bg-white fw-semibold px-4 py-2"
                style={{ border: '1px solid #CBD5E1', color: '#334155', borderRadius: '10px' }}
              >
                Start Another Session
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 3: ACTIVE INTERVIEW CONVERSATION ROOM */
          <div className="row g-4">
            <div className="col-lg-8">
              {/* Top Session Progress Bar */}
              <div className="card bg-white p-3 mb-3" style={cardStyle}>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className="badge rounded-pill px-3 py-1 fw-semibold"
                      style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                    >
                      Question {Math.min(answeredCount + 1, totalTurns)} of {totalTurns}
                    </span>
                    <span className="small fw-semibold text-dark">{roleTarget}</span>
                  </div>

                  <div className="d-flex align-items-center gap-3">
                    <span className="small fw-semibold text-muted">
                      <i className="bi bi-stopwatch me-1 text-primary"></i>
                      {formatTimer(secondsElapsed)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveSession(null)}
                      className="btn btn-sm btn-outline-danger py-0 px-2"
                      style={{ fontSize: '12px' }}
                    >
                      End Session
                    </button>
                  </div>
                </div>
                <div className="progress" style={{ height: '6px', backgroundColor: '#E2E8F0' }}>
                  <div
                    className="progress-bar"
                    style={{ width: `${progressPct}%`, backgroundColor: '#4F46E5' }}
                  ></div>
                </div>
              </div>

              {/* AI Interviewer Question Bubble */}
              <div className="card bg-white p-4 mb-3" style={cardStyle}>
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle text-white fw-bold flex-shrink-0"
                    style={{
                      width: '42px',
                      height: '42px',
                      background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                    }}
                  >
                    AI
                  </div>
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span className="fw-bold small text-dark">CareerAI Interviewer</span>
                      <span
                        className="badge rounded-pill"
                        style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '10.5px' }}
                      >
                        {category} • {difficulty}
                      </span>
                    </div>
                    <p className="fw-semibold text-dark mb-0" style={{ fontSize: '16px', lineHeight: 1.55 }}>
                      {currentTurn.question_text}
                    </p>
                  </div>
                </div>
              </div>

              {/* Answer Input Form (Before Evaluation) */}
              {!latestFeedback ? (
                <div className="card bg-white p-4" style={cardStyle}>
                  <form onSubmit={handleSubmitAnswer}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="small fw-bold text-dark">Your Response</label>
                      <span className="small text-muted">{wordCount} words</span>
                    </div>
                    <textarea
                      rows="6"
                      required
                      className="form-control mb-3"
                      style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1', lineHeight: 1.6 }}
                      placeholder="Type your detailed answer here..."
                      value={candidateAnswer}
                      onChange={(e) => setCandidateAnswer(e.target.value)}
                    ></textarea>

                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted" style={{ fontSize: '12px' }}>
                        Tip: Include specific technologies, trade-offs, or STAR outcomes.
                      </span>
                      <button
                        type="submit"
                        disabled={submitting || !candidateAnswer.trim()}
                        className="btn text-white fw-semibold px-4 py-2 shadow-sm"
                        style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Evaluating with Groq AI...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send-fill me-2"></i>
                            Submit Answer &amp; Evaluate
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Real-Time AI Evaluation Feedback Card */
                <div
                  className="card bg-white p-4"
                  style={{ ...cardStyle, borderTop: '4px solid #10B981' }}
                >
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-3 mb-3 border-bottom">
                    <div>
                      <h5 className="fw-bold text-dark mb-1">
                        <i className="bi bi-cpu-fill me-2" style={{ color: '#4F46E5' }}></i>
                        Real-Time AI Evaluation
                      </h5>
                      <span
                        className="badge rounded-pill px-2.5 py-1 fw-semibold"
                        style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '11px' }}
                      >
                        Evaluated by: <strong>{latestFeedback.feedback?.provider || 'Groq AI'}</strong>
                      </span>
                    </div>

                    <div
                      className="px-3 py-2 rounded-3 text-center"
                      style={{
                        backgroundColor: latestFeedback.score >= 75 ? '#ECFDF5' : '#FFFBEB',
                        border: `1px solid ${latestFeedback.score >= 75 ? '#A7F3D0' : '#FDE68A'}`,
                      }}
                    >
                      <div
                        className="fw-bold fs-4 lh-1"
                        style={{ color: latestFeedback.score >= 75 ? '#059669' : '#D97706' }}
                      >
                        {latestFeedback.score} / 100
                      </div>
                      <div className="text-muted" style={{ fontSize: '10.5px' }}>Turn Score</div>
                    </div>
                  </div>

                  {/* Summary Critique */}
                  <div
                    className="p-3 rounded-3 mb-3"
                    style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                  >
                    <div className="small fw-bold text-dark mb-1">Evaluator Feedback:</div>
                    <p className="small text-dark mb-0" style={{ lineHeight: 1.55 }}>
                      {latestFeedback.feedback?.summary ||
                        (typeof latestFeedback.feedback === 'string'
                          ? latestFeedback.feedback
                          : 'Response evaluated against role expectations.')}
                    </p>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="row g-3 mb-3">
                    {Array.isArray(latestFeedback.feedback?.strengths) &&
                      latestFeedback.feedback.strengths.length > 0 && (
                        <div className="col-md-6">
                          <div className="p-3 rounded-3 h-100" style={{ backgroundColor: '#ECFDF5' }}>
                            <div className="small fw-bold text-success mb-1">Strengths</div>
                            <ul className="mb-0 ps-3 small text-dark">
                              {latestFeedback.feedback.strengths.map((s, idx) => (
                                <li key={idx}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                    {Array.isArray(latestFeedback.feedback?.weaknesses) &&
                      latestFeedback.feedback.weaknesses.length > 0 && (
                        <div className="col-md-6">
                          <div className="p-3 rounded-3 h-100" style={{ backgroundColor: '#FFFBEB' }}>
                            <div className="small fw-bold mb-1" style={{ color: '#B45309' }}>
                              Areas to Improve
                            </div>
                            <ul className="mb-0 ps-3 small text-dark">
                              {latestFeedback.feedback.weaknesses.map((w, idx) => (
                                <li key={idx}>{w}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Suggested Model Answer */}
                  {latestFeedback.better_answer && (
                    <div
                      className="p-3 rounded-3 mb-4"
                      style={{ backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE' }}
                    >
                      <div className="small fw-bold mb-1" style={{ color: '#4338CA' }}>
                        <i className="bi bi-stars me-1"></i> Suggested Model Answer
                      </div>
                      <p className="small text-dark mb-0" style={{ lineHeight: 1.6 }}>
                        {latestFeedback.better_answer}
                      </p>
                    </div>
                  )}

                  <div className="d-flex justify-content-end">
                    <button
                      type="button"
                      onClick={handleProceedNext}
                      className="btn text-white fw-semibold px-4 py-2 shadow-sm"
                      style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
                    >
                      {activeSession?.turns?.some((t) => !t.is_answered) ? (
                        <>
                          Next Question <i className="bi bi-arrow-right ms-1"></i>
                        </>
                      ) : (
                        <>
                          Finish &amp; View Report <i className="bi bi-check2-circle ms-1"></i>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right 4 Columns: Live Session Context Sidebar */}
            <div className="col-lg-4">
              <div className="card bg-white p-4 mb-3" style={cardStyle}>
                <h6 className="fw-bold text-dark mb-3">Session Details</h6>
                <div className="d-flex flex-column gap-2 small">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Target Role</span>
                    <span className="fw-semibold text-dark">{roleTarget}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Round Focus</span>
                    <span className="fw-semibold text-dark">{category}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Difficulty</span>
                    <span className="fw-semibold text-dark">{difficulty}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Completed Turns</span>
                    <span className="fw-semibold text-dark">
                      {answeredCount} / {totalTurns}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card bg-white p-4" style={cardStyle}>
                <h6 className="fw-bold text-dark mb-2">STAR Response Checklist</h6>
                <p className="small text-muted mb-3">
                  Ensure your answer covers these 4 elements before submitting:
                </p>
                <div className="d-flex flex-column gap-2 small">
                  <div className="p-2 rounded-3" style={{ backgroundColor: '#F8FAFC' }}>
                    <strong>1. Situation:</strong> Context &amp; project scale
                  </div>
                  <div className="p-2 rounded-3" style={{ backgroundColor: '#F8FAFC' }}>
                    <strong>2. Task:</strong> Your specific goal or problem
                  </div>
                  <div className="p-2 rounded-3" style={{ backgroundColor: '#F8FAFC' }}>
                    <strong>3. Action:</strong> Technical steps &amp; decisions
                  </div>
                  <div className="p-2 rounded-3" style={{ backgroundColor: '#F8FAFC' }}>
                    <strong>4. Result:</strong> Measurable impact &amp; outcome
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockInterview;