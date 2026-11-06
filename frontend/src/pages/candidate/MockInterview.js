import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { interviewService } from '../../services/interviewService';
import { Navbar } from '../../components/layout/Navbar';

const MockInterview = () => {
  // Session Configuration Form
  const [config, setConfig] = useState({
    role_target: 'Python / Django Developer',
    category: 'Mixed',
    difficulty: 'Medium',
    total_questions: 3,
  });

  // Active Session State
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Turn Input State
  const [answerInput, setAnswerInput] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const answerBoxRef = useRef(null);

  // Tick timer while answering
  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Start new session
  const handleStartSession = async (e) => {
    e.preventDefault();
    setStarting(true);
    setError(null);
    try {
      const data = await interviewService.startSession(config);
      setActiveSession(data);
      setAnswerInput('');
      setTimerSeconds(0);
      setTimerActive(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start interview session.');
    } finally {
      setStarting(false);
    }
  };

  // Submit candidate answer
  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!answerInput.trim()) {
      alert('Please provide an answer before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await interviewService.submitAnswer(activeSession.id, {
        answer: answerInput.trim(),
        time_taken_seconds: timerSeconds,
      });

      setActiveSession(res.session);
      setAnswerInput('');
      setTimerSeconds(0);

      if (res.session.status === 'completed') {
        setTimerActive(false);
      } else {
        setTimeout(() => {
          if (answerBoxRef.current) answerBoxRef.current.focus();
        }, 100);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error submitting answer. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel / End early
  const handleCancelSession = async () => {
    if (!window.confirm('Are you sure you want to end this interview session early?')) return;
    try {
      await interviewService.cancelSession(activeSession.id);
      setActiveSession(null);
      setTimerActive(false);
      setTimerSeconds(0);
      setAnswerInput('');
    } catch (err) {
      alert('Failed to exit session.');
    }
  };

  // Determine current active turn
  const currentTurn = activeSession?.turns?.find((t) => !t.is_answered);
  const completedTurns = activeSession?.turns?.filter((t) => t.is_answered) || [];

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />

      <div className="container py-4">
        {/* Error Banner */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}

        {/* ================= STATE 1: SETUP LAUNCHER ================= */}
        {!activeSession && (
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                <div className="bg-primary text-white p-4 p-md-5 text-center">
                  <div className="d-inline-flex p-3 rounded-circle bg-white bg-opacity-25 mb-3">
                    <i className="bi bi-mic-fill fs-2"></i>
                  </div>
                  <h2 className="fw-bold mb-2">AI Mock Interview Simulator</h2>
                  <p className="mb-0 text-white-50">
                    Configure your session parameters to simulate realistic technical, behavioral, and architectural interviews.
                  </p>
                </div>

                <div className="card-body p-4 p-md-5">
                  <form onSubmit={handleStartSession}>
                    {/* Target Role */}
                    <div className="mb-4">
                      <label className="form-label fw-bold small text-muted text-uppercase">
                        Target Role / Specialization
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-lg fs-6"
                        value={config.role_target}
                        onChange={(e) => setConfig({ ...config, role_target: e.target.value })}
                        placeholder="e.g. Full Stack Developer, Data Engineer, Python Developer"
                        required
                      />
                    </div>

                    <div className="row g-3 mb-4">
                      {/* Interview Category */}
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-bold small text-muted text-uppercase">
                          Interview Format
                        </label>
                        <select
                          className="form-select form-select-lg fs-6"
                          value={config.category}
                          onChange={(e) => setConfig({ ...config, category: e.target.value })}
                        >
                          <option value="Mixed">Comprehensive Mixed (Technical + HR + STAR)</option>
                          <option value="Technical">Technical & Coding Architecture</option>
                          <option value="HR">HR & Culture Fit</option>
                          <option value="Behavioral">Behavioral (STAR Method)</option>
                          <option value="Project-based">Project Architecture Deep Dive</option>
                        </select>
                      </div>

                      {/* Difficulty Level */}
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-bold small text-muted text-uppercase">
                          Experience Tier
                        </label>
                        <select
                          className="form-select form-select-lg fs-6"
                          value={config.difficulty}
                          onChange={(e) => setConfig({ ...config, difficulty: e.target.value })}
                        >
                          <option value="Easy">Easy (Entry Level 0-2 yrs)</option>
                          <option value="Medium">Medium (Mid Level 2-5 yrs)</option>
                          <option value="Hard">Hard (Senior / Lead 5+ yrs)</option>
                        </select>
                      </div>
                    </div>

                    {/* Question Count Selection */}
                    <div className="mb-4">
                      <label className="form-label fw-bold small text-muted text-uppercase d-block">
                        Session Length
                      </label>
                      <div className="row g-2">
                        {[3, 5, 7].map((num) => (
                          <div key={num} className="col-4">
                            <button
                              type="button"
                              className={`btn w-100 py-2 ${
                                config.total_questions === num
                                  ? 'btn-primary fw-bold shadow-sm'
                                  : 'btn-outline-secondary'
                              }`}
                              onClick={() => setConfig({ ...config, total_questions: num })}
                            >
                              {num} Questions
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Launch Action */}
                    <div className="d-grid mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg fw-bold py-3 shadow"
                        disabled={starting}
                      >
                        {starting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Configuring Interview Environment...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-play-circle-fill me-2"></i>
                            Begin Mock Interview Session
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STATE 2: ACTIVE QUESTION SCREEN ================= */}
        {activeSession && activeSession.status === 'in_progress' && currentTurn && (
          <div className="row justify-content-center">
            <div className="col-12 col-lg-10">
              {/* Header Status Bar */}
              <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-3 p-md-4">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div>
                      <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-2 rounded-pill me-2">
                        <i className="bi bi-briefcase me-1"></i> {activeSession.role_target}
                      </span>
                      <span className="badge bg-secondary bg-opacity-10 text-secondary fw-semibold px-2 py-2 rounded-pill me-2">
                        {currentTurn.category}
                      </span>
                      <span className="badge bg-info bg-opacity-10 text-info fw-semibold px-2 py-2 rounded-pill">
                        {activeSession.difficulty}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                      {/* Timer */}
                      <div className="d-flex align-items-center text-danger fw-bold fs-5 font-monospace bg-danger bg-opacity-10 px-3 py-1 rounded-pill">
                        <i className="bi bi-stopwatch-fill me-2"></i>
                        {formatTime(timerSeconds)}
                      </div>

                      {/* Exit */}
                      <button
                        className="btn btn-outline-danger btn-sm rounded-pill px-3"
                        onClick={handleCancelSession}
                      >
                        <i className="bi bi-x-circle me-1"></i> End Session
                      </button>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-3">
                    <div className="d-flex justify-content-between small text-muted mb-1">
                      <span>
                        Question <strong>{currentTurn.turn_number}</strong> of {activeSession.total_questions}
                      </span>
                      <span>
                        {Math.round(((currentTurn.turn_number - 1) / activeSession.total_questions) * 100)}% Complete
                      </span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div
                        className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                        role="progressbar"
                        style={{
                          width: `${((currentTurn.turn_number - 1) / activeSession.total_questions) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Delivery Card */}
              <div className="card border-0 shadow-sm rounded-4 mb-4">
                <div className="card-body p-4 p-md-5">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <span className="badge bg-primary rounded-pill px-3 py-2 fs-6">
                      Question #{currentTurn.turn_number}
                    </span>
                    <span className="text-muted small">Interview Prompt</span>
                  </div>

                  <h4 className="fw-bold text-dark lh-base mb-4">
                    {currentTurn.question_text}
                  </h4>

                  {/* Structured Answer Box */}
                  <form onSubmit={handleSubmitAnswer}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold text-muted small text-uppercase">
                        Your Professional Response
                      </label>
                      <textarea
                        ref={answerBoxRef}
                        className="form-control rounded-3 p-3 fs-6"
                        rows="7"
                        placeholder="Structure your thoughts clearly. For technical questions, mention core mechanisms, trade-offs, and examples. For behavioral questions, highlight the Situation, Task, Action, and Result (STAR)."
                        value={answerInput}
                        onChange={(e) => setAnswerInput(e.target.value)}
                        required
                        disabled={submitting}
                      ></textarea>
                    </div>

                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                      <div className="small text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        Words: <strong>{answerInput.trim() ? answerInput.trim().split(/\s+/).length : 0}</strong> |
                        Characters: <strong>{answerInput.length}</strong>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary px-4 py-2 fw-bold shadow-sm"
                        disabled={submitting || !answerInput.trim()}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Recording Answer...
                          </>
                        ) : (
                          <>
                            Submit Answer & Next
                            <i className="bi bi-arrow-right ms-2"></i>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Transcript of Completed Turns in this Session */}
              {completedTurns.length > 0 && (
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-header bg-white border-0 pt-4 px-4">
                    <h5 className="fw-bold mb-0 text-dark">
                      <i className="bi bi-chat-left-quote-fill text-primary me-2"></i>
                      Session Transcript So Far ({completedTurns.length})
                    </h5>
                  </div>
                  <div className="card-body p-4">
                    <div className="d-flex flex-column gap-3">
                      {completedTurns.map((turn) => (
                        <div key={turn.id} className="p-3 rounded-3 bg-light border">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="fw-bold small text-primary">
                              Q{turn.turn_number}: {turn.question_text}
                            </span>
                            <span className="badge bg-success bg-opacity-10 text-success rounded-pill">
                              <i className="bi bi-check-circle me-1"></i> Answered
                            </span>
                          </div>
                          <p className="text-secondary small mb-0 mt-2 fst-italic">
                            "{turn.candidate_answer}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= STATE 3: SESSION COMPLETED ================= */}
        {activeSession && activeSession.status === 'completed' && (
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 text-center p-5 bg-white">
                <div className="d-inline-flex p-4 rounded-circle bg-success bg-opacity-10 text-success mx-auto mb-4">
                  <i className="bi bi-trophy-fill display-4"></i>
                </div>
                <h2 className="fw-bold text-dark mb-2">Mock Interview Completed!</h2>
                <p className="text-muted mb-4 fs-6">
                  Great work! You have answered all <strong>{activeSession.total_questions}</strong> questions for{' '}
                  <strong>{activeSession.role_target}</strong>.
                </p>

                <div className="p-4 rounded-4 bg-light text-start mb-4">
                  <h6 className="fw-bold text-uppercase text-muted small mb-3">Session Summary</h6>
                  <div className="row g-3">
                    <div className="col-6 col-md-3">
                      <div className="small text-muted">Role</div>
                      <div className="fw-bold text-dark text-truncate">{activeSession.role_target}</div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="small text-muted">Format</div>
                      <div className="fw-bold text-dark">{activeSession.category}</div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="small text-muted">Difficulty</div>
                      <div className="fw-bold text-dark">{activeSession.difficulty}</div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="small text-muted">Questions</div>
                      <div className="fw-bold text-dark">{activeSession.total_questions} Answered</div>
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-wrap justify-content-center gap-3">
                  <button
                    className="btn btn-primary px-4 py-2 fw-bold"
                    onClick={() => setActiveSession(null)}
                  >
                    <i className="bi bi-arrow-repeat me-1"></i> Start Another Mock Interview
                  </button>
                  <Link to="/question-bank" className="btn btn-outline-secondary px-4 py-2">
                    <i className="bi bi-collection-play me-1"></i> Practice Question Catalog
                  </Link>
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