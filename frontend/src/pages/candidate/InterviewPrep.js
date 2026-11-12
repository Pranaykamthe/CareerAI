import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { interviewService } from '../../services/interviewService';

const InterviewPrep = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [selectedRole, setSelectedRole] = useState('Software Engineer');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [qData, sData] = await Promise.all([
        interviewService.getQuestions(),
        interviewService.getUserSessions()
      ]);
      setQuestions(qData || []);
      setRecentSessions(sData || []);
    } catch (err) {
      console.error('Failed to load interview prep data:', err);
    } finally {
      setLoading(false);
    }
  };

  const startPractice = (category) => {
    navigate('/mock-interview', { state: { category, role: selectedRole } });
  };

  // Metrics calculation
  const completedSessions = recentSessions.filter(s => s.status === 'completed' || s.status === 'Completed');
  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((acc, curr) => acc + (curr.overall_score || 0), 0) / completedSessions.length)
    : 78;

  const hrCount = questions.filter(q => q.category === 'HR').length;
  const behavioralCount = questions.filter(q => q.category === 'Behavioral').length;
  const techCount = questions.filter(q => q.category === 'Technical').length;

  return (
    <div className="min-vh-100 bg-light">
      {/* 1. Global Navbar */}

      <div className="container-fluid py-4 px-lg-5" style={{ backgroundColor: '#f8fafc' }}>
        {/* Header Banner */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
          <div>
            <h2 className="fw-bold text-dark mb-1">
              <i className="bi bi-stars text-primary me-2"></i>AI Interview Preparation
            </h2>
            <p className="text-muted mb-0">Master HR, behavioral, and technical interviews with AI-powered feedback.</p>
          </div>
          <div className="d-flex gap-2 mt-3 mt-md-0">
            <button className="btn btn-outline-secondary" onClick={() => navigate('/question-bank')}>
              <i className="bi bi-collection me-1"></i> Browse Question Bank
            </button>
            <button className="btn btn-primary px-3 shadow-sm" onClick={() => startPractice('HR')}>
              <i className="bi bi-play-circle-fill me-1"></i> Quick HR Practice
            </button>
          </div>
        </div>

        {/* Target Role & Readiness Summary Card */}
        <div className="row g-4 mb-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-3 p-4 h-100 bg-white">
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                <span className="badge bg-primary-subtle text-primary fw-semibold px-3 py-2 rounded-pill">
                  <i className="bi bi-briefcase me-1"></i> Active Target Track
                </span>
                <span className="text-muted small">Updated recently</span>
              </div>
              <div className="row g-3 align-items-center">
                <div className="col-md-7">
                  <h4 className="fw-bold text-dark mb-2">{selectedRole}</h4>
                  <p className="text-muted small mb-3">
                    Tailored question recommendations emphasizing behavioral storytelling (STAR method), technical architecture, and communication skills.
                  </p>
                  <div className="d-flex gap-2">
                    <select
                      className="form-select form-select-sm w-auto"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="Software Engineer">Software Engineer</option>
                      <option value="Frontend Developer">Frontend Developer</option>
                      <option value="Backend Developer">Backend Developer</option>
                      <option value="Full Stack Developer">Full Stack Developer</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-5 text-center border-start">
                  <div className="d-inline-flex flex-column align-items-center justify-content-center border border-4 border-primary rounded-circle" style={{ width: '110px', height: '110px' }}>
                    <span className="fs-3 fw-bold text-primary">{avgScore}</span>
                    <span className="small text-muted" style={{ fontSize: '11px' }}>/ 100</span>
                  </div>
                  <div className="fw-semibold text-dark mt-2">Interview Readiness</div>
                  <span className="badge bg-success-subtle text-success small">Good Preparation</span>
                </div>
              </div>
            </div>
          </div>

          {/* STAR Framework Quick Guide */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-3 p-4 h-100" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff' }}>
              <h5 className="fw-bold mb-3 d-flex align-items-center text-warning">
                <i className="bi bi-lightbulb-fill me-2"></i> STAR Technique Guide
              </h5>
              <ul className="list-unstyled small mb-0 d-flex flex-column gap-2 text-light">
                <li><strong className="text-info">S - Situation:</strong> Set the scene and specify the context.</li>
                <li><strong className="text-info">T - Task:</strong> Outline the challenge or requirement.</li>
                <li><strong className="text-info">A - Action:</strong> Describe what <em>you</em> personally executed.</li>
                <li><strong className="text-info">R - Result:</strong> Conclude with quantifiable outcomes & lessons.</li>
              </ul>
              <div className="mt-3 pt-3 border-top border-secondary text-secondary small">
                <i className="bi bi-check2-circle text-success me-1"></i> The AI evaluates your answer against all 4 stages.
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Practice Tracks */}
        <h5 className="fw-bold text-dark mb-3">Recommended Practice Categories</h5>
        <div className="row g-3 mb-4">
          {/* HR Questions Card */}
          <div className="col-md-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100 rounded-3 p-3 bg-white hover-shadow transition">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-warning-subtle text-warning p-2 rounded-2">
                  <i className="bi bi-people-fill fs-5"></i>
                </span>
                <div>
                  <h6 className="fw-bold mb-0 text-dark">HR & Culture Fit</h6>
                  <span className="text-muted small">{hrCount || 5} Questions</span>
                </div>
              </div>
              <p className="text-muted small mb-3">
                Self-introduction, company values, salary expectations, and career goals.
              </p>
              <button className="btn btn-sm btn-outline-warning text-dark w-100 mt-auto fw-semibold" onClick={() => startPractice('HR')}>
                Practice HR <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </div>

          {/* Behavioral Questions Card */}
          <div className="col-md-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100 rounded-3 p-3 bg-white hover-shadow transition">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-success-subtle text-success p-2 rounded-2">
                  <i className="bi bi-chat-quote-fill fs-5"></i>
                </span>
                <div>
                  <h6 className="fw-bold mb-0 text-dark">Behavioral (STAR)</h6>
                  <span className="text-muted small">{behavioralCount || 5} Questions</span>
                </div>
              </div>
              <p className="text-muted small mb-3">
                Conflict resolution, leadership under pressure, and teamwork challenges.
              </p>
              <button className="btn btn-sm btn-outline-success w-100 mt-auto fw-semibold" onClick={() => startPractice('Behavioral')}>
                Practice STAR <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </div>

          {/* Technical Questions Card */}
          <div className="col-md-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100 rounded-3 p-3 bg-white hover-shadow transition">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-primary-subtle text-primary p-2 rounded-2">
                  <i className="bi bi-code-slash fs-5"></i>
                </span>
                <div>
                  <h6 className="fw-bold mb-0 text-dark">Technical Deep Dive</h6>
                  <span className="text-muted small">{techCount || 10} Questions</span>
                </div>
              </div>
              <p className="text-muted small mb-3">
                Data structures, system architecture, REST APIs, and database design.
              </p>
              <button className="btn btn-sm btn-outline-primary w-100 mt-auto fw-semibold" onClick={() => startPractice('Technical')}>
                Practice Tech <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </div>

          {/* Full Mixed Mock Interview Card */}
          <div className="col-md-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100 rounded-3 p-3 bg-white hover-shadow transition">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-info-subtle text-info p-2 rounded-2">
                  <i className="bi bi-award-fill fs-5"></i>
                </span>
                <div>
                  <h6 className="fw-bold mb-0 text-dark">Full Simulation</h6>
                  <span className="text-muted small">Mixed Topics</span>
                </div>
              </div>
              <p className="text-muted small mb-3">
                Simulates a live multi-round interview covering HR, STAR, and system design.
              </p>
              <button className="btn btn-sm btn-primary w-100 mt-auto fw-semibold" onClick={() => startPractice('Mixed')}>
                Start Full Mock <i className="bi bi-lightning-charge-fill ms-1"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Communication & Preparation Quick Tips */}
        <div className="card border-0 shadow-sm rounded-3 p-4 bg-white mb-4">
          <h5 className="fw-bold text-dark mb-3">
            <i className="bi bi-check2-all text-success me-2"></i>Executive Interview Communication Tips
          </h5>
          <div className="row g-3">
            <div className="col-md-4">
              <div className="p-3 bg-light rounded-3 h-100">
                <h6 className="fw-bold text-dark mb-1">1. Claim Your Contributions</h6>
                <p className="text-muted small mb-0">Use "I designed" or "I resolved" instead of passive "We did". Interviewers evaluate your personal impact.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 bg-light rounded-3 h-100">
                <h6 className="fw-bold text-dark mb-1">2. Quantify the Outcome</h6>
                <p className="text-muted small mb-0">Include tangible metrics whenever possible (e.g., "reduced latency by 35%", "delivered 2 days early").</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 bg-light rounded-3 h-100">
                <h6 className="fw-bold text-dark mb-1">3. Keep It Concise</h6>
                <p className="text-muted small mb-0">Aim for responses between 90 and 150 words in text practice to demonstrate focus without ramble.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPrep;