import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { interviewService } from '../../services/interviewService';

const MockInterview = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Session Configuration & History State
  const [recentSessions, setRecentSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  // Setup Form State: initialized from incoming location.state if forwarded from InterviewPrep
  const [roleTarget, setRoleTarget] = useState(location.state?.role || 'Junior Full Stack Engineer');
  const [category, setCategory] = useState(location.state?.category || 'Mixed');
  const [difficulty, setDifficulty] = useState('Medium');
  const [totalQuestions, setTotalQuestions] = useState(3);
  const [isStarting, setIsStarting] = useState(false);

  // Update setup parameters if location.state changes
  useEffect(() => {
    if (location.state?.category) {
      setCategory(location.state.category);
    }
    if (location.state?.role) {
      setRoleTarget(location.state.role);
    }
  }, [location.state]);

  // Active Session State
  const [activeSession, setActiveSession] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Turn Result
  const [latestFeedback, setLatestFeedback] = useState(null);

  // Review Modal State
  const [selectedReviewSession, setSelectedReviewSession] = useState(null);

  // Timer State
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const timerRef = useRef(null);

  // 1. Load Past Sessions
  const loadPastSessions = async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    try {
      const data = await interviewService.getUserSessions();
      setRecentSessions(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setHistoryError('Failed to load past interview sessions.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadPastSessions();
  }, []);

  // 2. Timer Lifecycle
  useEffect(() => {
    if (activeSession && activeSession.status === 'in_progress' && !latestFeedback) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession, latestFeedback]);

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 3. Start New Session
  const handleStartSession = async (e) => {
    e.preventDefault();
    setIsStarting(true);
    setSubmitError(null);
    try {
      const payload = {
        role_target: roleTarget,
        category: category,
        difficulty: difficulty,
        total_questions: parseInt(totalQuestions, 10),
      };
      const session = await interviewService.startSession(payload);
      setActiveSession(session);

      const firstTurn = session.turns?.find((t) => !t.is_answered) || session.turns?.[0];
      setCurrentTurn(firstTurn);
      setCandidateAnswer('');
      setLatestFeedback(null);
      setSecondsElapsed(0);
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Failed to initialize interview session.');
    } finally {
      setIsStarting(false);
    }
  };

  // 4. Submit Answer & Run Evaluation
  const handleSubmitAnswer = async () => {
    if (!candidateAnswer.trim()) {
      alert('Please type your response before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        turn_id: currentTurn?.id,
        candidate_answer: candidateAnswer.trim(),
        answer: candidateAnswer.trim(),
        time_spent_seconds: secondsElapsed,
        time_taken_seconds: secondsElapsed,
      };

      const res = await interviewService.submitAnswer(activeSession.id, payload);

      const feedbackObj = res.feedback || (res.turn?.ai_feedback ? JSON.parse(res.turn.ai_feedback) : null);
      setLatestFeedback({
        score: res.ai_score ?? res.turn?.ai_score ?? 75,
        feedback: feedbackObj,
        better_answer: res.better_answer || res.turn?.better_answer || '',
        isCompleted: res.is_session_completed,
      });

      const updatedSession = res.session || (await interviewService.getSessionById(activeSession.id));
      setActiveSession(updatedSession);

      loadPastSessions();
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Failed to submit answer for evaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Advance to Next Question or Final Phase 14 Report
  const handleProceedNext = () => {
    if (latestFeedback?.isCompleted) {
      navigate(`/interview-report/${activeSession.id}`);
      return;
    }

    setLatestFeedback(null);
    setCandidateAnswer('');
    setSecondsElapsed(0);

    const nextTurn = activeSession.turns?.find((t) => !t.is_answered);
    if (nextTurn) {
      setCurrentTurn(nextTurn);
    } else {
      setCurrentTurn(null);
      setActiveSession((prev) => ({ ...prev, status: 'completed' }));
      loadPastSessions();
      navigate(`/interview-report/${activeSession.id}`);
    }
  };

  // 6. Cancel In-Progress Session
  const handleCancelSession = async () => {
    if (!window.confirm('Are you sure you want to exit this mock interview? Progress will be cancelled.')) return;
    try {
      await interviewService.cancelSession(activeSession.id);
      setActiveSession(null);
      setCurrentTurn(null);
      setLatestFeedback(null);
      loadPastSessions();
    } catch (err) {
      alert('Error cancelling session.');
    }
  };

  // Calculate Metrics
  const completedSessions = recentSessions.filter((s) => s.status === 'completed' || s.status === 'Completed');
  const avgScore = completedSessions.length
    ? Math.round(
        completedSessions.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) / completedSessions.length
      )
    : 0;

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />

      <div className="container py-4">
        {/* Top Header & Metrics Bar */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-1">
              <i className="bi bi-mic-fill text-primary me-2"></i>AI Mock Interview Simulator
            </h2>
            <p className="text-muted small mb-0">
              Practice real-world questions with real-time AI scoring, STAR rubrics, and constructive critique.
            </p>
          </div>
          <div className="d-flex gap-2">
            <div className="card border-0 shadow-sm px-3 py-2 bg-white d-flex flex-row align-items-center gap-2">
              <div className="rounded-circle bg-primary bg-opacity-10 p-2 text-primary">
                <i className="bi bi-trophy-fill"></i>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '10px' }}>AVG SCORE</div>
                <div className="fw-bold text-dark">{avgScore > 0 ? `${avgScore}%` : 'N/A'}</div>
              </div>
            </div>
            <div className="card border-0 shadow-sm px-3 py-2 bg-white d-flex flex-row align-items-center gap-2">
              <div className="rounded-circle bg-success bg-opacity-10 p-2 text-success">
                <i className="bi bi-check2-all"></i>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '10px' }}>COMPLETED</div>
                <div className="fw-bold text-dark">{completedSessions.length} Sessions</div>
              </div>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {submitError}
            <button type="button" className="btn-close" onClick={() => setSubmitError(null)}></button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW A: INTERVIEW RUNTIME (Active Session)                                */}
        {/* ========================================================================= */}
        {activeSession && activeSession.status === 'in_progress' ? (
          <div className="row g-4">
            <div className="col-lg-8">
              {/* Question Turn Card */}
              {currentTurn && !latestFeedback && (
                <div className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-primary px-3 py-2">
                        Question {currentTurn.turn_number} of {activeSession.total_questions}
                      </span>
                      <span className="badge bg-light text-dark border">
                        {currentTurn.category || activeSession.category}
                      </span>
                      <span className="badge bg-info bg-opacity-10 text-dark border border-info">
                        {activeSession.difficulty}
                      </span>
                    </div>
                    <div className="badge bg-dark bg-opacity-10 text-dark px-3 py-2 font-monospace fs-6">
                      <i className="bi bi-stopwatch text-primary me-1"></i>
                      {formatTimer(secondsElapsed)}
                    </div>
                  </div>

                  <h4 className="fw-bold text-dark mb-4">{currentTurn.question_text}</h4>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted d-flex justify-content-between">
                      <span>Your Response (STAR Method recommended)</span>
                      <span>{candidateAnswer.trim().split(/\s+/).filter(Boolean).length} words</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows="8"
                      placeholder="Structure your answer with Situation, Task, Action, and Result..."
                      value={candidateAnswer}
                      onChange={(e) => setCandidateAnswer(e.target.value)}
                      disabled={isSubmitting}
                    ></textarea>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={handleCancelSession}
                      disabled={isSubmitting}
                    >
                      <i className="bi bi-x-circle me-1"></i> Exit Session
                    </button>
                    <button
                      className="btn btn-primary px-4"
                      onClick={handleSubmitAnswer}
                      disabled={isSubmitting || !candidateAnswer.trim()}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          AI Evaluating Answer...
                        </>
                      ) : (
                        <>
                          Submit Answer & Evaluate <i className="bi bi-arrow-right ms-1"></i>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Real-Time Evaluation Feedback Card */}
              {latestFeedback && (
                <div className="card border-0 shadow-sm rounded-4 bg-white p-4 mb-4 border-top border-4 border-success">
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                    <div>
                      <h5 className="fw-bold text-dark mb-1">
                        <i className="bi bi-cpu-fill text-primary me-2"></i>Real-Time AI Evaluation
                      </h5>
                      <span className="badge bg-light text-secondary border">
                        Evaluated by: <strong>{latestFeedback.feedback?.provider || 'CareerAI Engine'}</strong>
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted">Turn Score:</span>
                      <span
                        className={`badge fs-6 px-3 py-2 ${
                          latestFeedback.score >= 80
                            ? 'bg-success'
                            : latestFeedback.score >= 60
                            ? 'bg-warning text-dark'
                            : 'bg-danger'
                        }`}
                      >
                        {latestFeedback.score} / 100
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-light rounded-3 mb-3">
                    <div className="small fw-bold text-dark mb-1">Evaluator Feedback:</div>
                    <p className="small text-dark mb-0">
                      {latestFeedback.feedback?.feedback ||
                        latestFeedback.feedback?.summary ||
                        'Good attempt providing structured context.'}
                    </p>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <div className="card h-100 border-success border-opacity-25 bg-success bg-opacity-10 p-3 rounded-3">
                        <div className="small fw-bold text-success mb-2">
                          <i className="bi bi-check-circle-fill me-1"></i> Strengths Identified:
                        </div>
                        <ul className="mb-0 ps-3 small text-dark">
                          {latestFeedback.feedback?.strengths?.length > 0 ? (
                            latestFeedback.feedback.strengths.map((s, idx) => <li key={idx}>{s}</li>)
                          ) : (
                            <li>Clear delivery and relevant terminology used.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card h-100 border-warning border-opacity-25 bg-warning bg-opacity-10 p-3 rounded-3">
                        <div className="small fw-bold text-dark mb-2">
                          <i className="bi bi-lightbulb-fill text-warning me-1"></i> Areas to Improve:
                        </div>
                        <ul className="mb-0 ps-3 small text-dark">
                          {latestFeedback.feedback?.weaknesses?.length > 0 ? (
                            latestFeedback.feedback.weaknesses.map((w, idx) => <li key={idx}>{w}</li>)
                          ) : (
                            <li>Add more quantitative metrics and specific outcomes.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {latestFeedback.better_answer && (
                    <div className="border rounded-3 p-3 bg-white mb-4">
                      <div className="small fw-bold text-primary mb-1">
                        <i className="bi bi-stars me-1"></i> Suggested Model Answer:
                      </div>
                      <p className="small text-muted mb-0">{latestFeedback.better_answer}</p>
                    </div>
                  )}

                  <div className="text-end">
                    <button className="btn btn-primary px-4" onClick={handleProceedNext}>
                      {latestFeedback.isCompleted ? (
                        <>
                          <i className="bi bi-file-earmark-bar-graph me-2"></i>View Performance Report
                        </>
                      ) : (
                        <>
                          Next Question <i className="bi bi-chevron-right ms-1"></i>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* In-Session Sidebar: Progress & Transcript */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 bg-white p-4 sticky-top" style={{ top: '80px' }}>
                <h6 className="fw-bold text-dark mb-3">Session Progress</h6>
                <div className="progress mb-3" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-primary"
                    role="progressbar"
                    style={{
                      width: `${
                        ((activeSession.turns?.filter((t) => t.is_answered).length || 0) /
                          activeSession.total_questions) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="d-flex justify-content-between small text-muted mb-4">
                  <span>
                    Answered: {activeSession.turns?.filter((t) => t.is_answered).length} of{' '}
                    {activeSession.total_questions}
                  </span>
                  <span>Target: {activeSession.role_target}</span>
                </div>

                <h6 className="fw-bold text-dark mb-2">Questions In This Session</h6>
                <div className="list-group list-group-flush small">
                  {activeSession.turns?.map((t) => (
                    <div
                      key={t.id || t.turn_number}
                      className={`list-group-item px-0 py-2 d-flex justify-content-between align-items-center ${
                        currentTurn?.turn_number === t.turn_number ? 'fw-bold text-primary' : 'text-muted'
                      }`}
                    >
                      <span className="text-truncate me-2" style={{ maxWidth: '200px' }}>
                        {t.turn_number}. {t.question_text}
                      </span>
                      {t.is_answered ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success">
                          {t.ai_score ? `${t.ai_score}%` : 'Done'}
                        </span>
                      ) : (
                        <span className="badge bg-light text-muted border">Pending</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW B: SETUP LAUNCHER & PAST RECORDS (Default View)                     */
          /* ========================================================================= */
          <div className="row g-4">
            {/* Configure Session Form */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
                <h4 className="fw-bold text-dark mb-4">Configure Your Interview Session</h4>

                <form onSubmit={handleStartSession}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Target Job Role</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Junior Full Stack Engineer"
                      value={roleTarget}
                      onChange={(e) => setRoleTarget(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark">Interview Track</label>
                      <select
                        className="form-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="Mixed">Mixed (Technical + HR + STAR)</option>
                        <option value="Technical">Technical</option>
                        <option value="HR">HR / Culture Fit</option>
                        <option value="Behavioral">Behavioral (STAR)</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-dark">Difficulty Level</label>
                      <select
                        className="form-select"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                      >
                        <option value="Easy">Easy (Entry Level)</option>
                        <option value="Medium">Medium (Mid Level)</option>
                        <option value="Hard">Hard (Senior / Lead)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold text-dark d-block mb-2">
                      Number of Questions
                    </label>
                    <div className="d-flex gap-3">
                      {[3, 5, 7].map((num) => (
                        <div key={num} className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="questionCount"
                            id={`qCount${num}`}
                            value={num}
                            checked={parseInt(totalQuestions, 10) === num}
                            onChange={(e) => setTotalQuestions(e.target.value)}
                          />
                          <label className="form-check-label small" htmlFor={`qCount${num}`}>
                            {num} Questions
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                    disabled={isStarting}
                  >
                    {isStarting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Starting Simulator...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-play-circle-fill"></i> Begin Mock Interview Session
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Recent Interview Records */}
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-dark mb-0">Recent Interview Records</h5>
                  <button
                    className="btn btn-link btn-sm text-decoration-none p-0 text-muted"
                    onClick={loadPastSessions}
                    title="Refresh records"
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                  </button>
                </div>

                {loadingHistory ? (
                  <div className="text-center py-5">
                    <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                    <div className="text-muted small mt-2">Loading sessions...</div>
                  </div>
                ) : historyError ? (
                  <div className="alert alert-light text-danger small py-3">{historyError}</div>
                ) : recentSessions.length === 0 ? (
                  <div className="text-center py-5 text-muted small">
                    <i className="bi bi-journal-x fs-2 d-block mb-2 text-secondary"></i>
                    No previous mock sessions found. Start your first session on the left!
                  </div>
                ) : (
                  <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: '420px' }}>
                    {recentSessions.map((s) => (
                      <div
                        key={s.id}
                        className="list-group-item px-0 py-3 d-flex justify-content-between align-items-center"
                      >
                        <div>
                          <div className="fw-bold text-dark small">{s.role_target}</div>
                          <div className="text-muted" style={{ fontSize: '11px' }}>
                            • {s.category || 'Mixed'} • {s.difficulty} • {new Date(s.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          {s.overall_score !== null && s.overall_score !== undefined && (
                            <span
                              className={`badge rounded-pill ${
                                s.overall_score >= 75
                                  ? 'bg-success bg-opacity-10 text-success border border-success'
                                  : 'bg-primary bg-opacity-10 text-primary border border-primary'
                              }`}
                            >
                              {s.overall_score}%
                            </span>
                          )}
                          <button
                            className="btn btn-outline-primary btn-sm py-1 px-2"
                            style={{ fontSize: '12px' }}
                            onClick={() => navigate(`/interview-report/${s.id}`)}
                          >
                            Report
                          </button>
                          <button
                            className="btn btn-outline-secondary btn-sm py-1 px-2"
                            style={{ fontSize: '12px' }}
                            onClick={() => setSelectedReviewSession(s)}
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReviewSession && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom py-3">
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0">Interview Session Transcript</h5>
                  <div className="text-muted small">
                    {selectedReviewSession.role_target} • {selectedReviewSession.difficulty} •{' '}
                    {new Date(selectedReviewSession.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedReviewSession(null)}
                ></button>
              </div>

              <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 mb-4">
                  <div>
                    <div className="small text-muted">Performance Verdict</div>
                    <div className="fw-bold text-dark fs-5">
                      {selectedReviewSession.overall_score
                        ? `${selectedReviewSession.overall_score}% Average Score`
                        : 'Completed'}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span
                      className={`badge px-3 py-2 fs-6 ${
                        selectedReviewSession.status === 'completed' || selectedReviewSession.status === 'Completed'
                          ? 'bg-success'
                          : 'bg-secondary'
                      }`}
                    >
                      {selectedReviewSession.status}
                    </span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        const targetId = selectedReviewSession.id;
                        setSelectedReviewSession(null);
                        navigate(`/interview-report/${targetId}`);
                      }}
                    >
                      <i className="bi bi-file-earmark-bar-graph me-1"></i> Full Report
                    </button>
                  </div>
                </div>

                <h6 className="fw-bold text-dark mb-3">Transcript & Question Breakdown</h6>
                {selectedReviewSession.turns?.length > 0 ? (
                  selectedReviewSession.turns.map((turn) => {
                    let feedbackParsed = null;
                    try {
                      feedbackParsed = turn.ai_feedback ? JSON.parse(turn.ai_feedback) : null;
                    } catch (e) {
                      feedbackParsed = { summary: turn.ai_feedback };
                    }

                    return (
                      <div key={turn.id || turn.turn_number} className="card border rounded-3 p-3 mb-3 bg-white">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span className="fw-bold text-dark small">
                            Question {turn.turn_number}: {turn.question_text}
                          </span>
                          {turn.ai_score !== null && turn.ai_score !== undefined && (
                            <span className="badge bg-primary ms-2">{turn.ai_score} / 100</span>
                          )}
                        </div>

                        <div className="bg-light p-2 rounded small text-dark mb-2">
                          <strong>Your Answer:</strong>{' '}
                          {turn.candidate_answer || <span className="text-muted fst-italic">Unanswered</span>}
                        </div>

                        {(feedbackParsed?.feedback || feedbackParsed?.summary) && (
                          <div className="small text-muted mb-2">
                            <strong className="text-secondary">AI Critique:</strong>{' '}
                            {feedbackParsed.feedback || feedbackParsed.summary}
                          </div>
                        )}

                        {turn.better_answer && (
                          <div className="small text-primary border-top pt-2">
                            <strong>Recommended Model Answer:</strong> {turn.better_answer}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-muted small text-center py-3">No turns recorded for this session.</div>
                )}
              </div>

              <div className="modal-footer border-top py-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedReviewSession(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockInterview;