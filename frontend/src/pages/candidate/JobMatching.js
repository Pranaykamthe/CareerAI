import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { resumeService } from '../../services/resumeService';
import { applicationService } from '../../services/applicationService';

const JobMatching = () => {
  const [searchParams] = useSearchParams();
  const focusedJobId = searchParams.get('jobId');

  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [toast, setToast] = useState(null);

  // Filter & Modal States
  const [minScoreFilter, setMinScoreFilter] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatchModal, setSelectedMatchModal] = useState(null);
  const [savingJobId, setSavingJobId] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const computeMatchesForResume = async (resumeId) => {
    if (!resumeId) return;
    setMatching(true);
    try {
      let res;
      try {
        res = await api.post('/jobs/match/', { resume_id: Number(resumeId) });
      } catch (err) {
        if (err.response?.status === 405 || err.response?.status === 404) {
          res = await api.get('/jobs/matches/', { params: { resume_id: resumeId } });
        } else {
          throw err;
        }
      }

      const list = Array.isArray(res.data)
        ? res.data
        : res.data?.matches || res.data?.results || [];

      // Sort highest match score first
      const sorted = [...list].sort(
        (a, b) => Number(b.match_score ?? 0) - Number(a.match_score ?? 0)
      );
      setMatches(sorted);

      if (focusedJobId) {
        const target = sorted.find(
          (m) => String(m.job?.id || m.job_id) === String(focusedJobId)
        );
        if (target) setSelectedMatchModal(target);
      }
    } catch (err) {
      showToast('danger', err.response?.data?.detail || 'Unable to compute job compatibility scores.');
    } finally {
      setMatching(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const data = await resumeService.getResumes();
        const list = Array.isArray(data) ? data : data?.results || [];
        setResumes(list);

        if (list.length > 0) {
          const primary = list.find((r) => r.is_primary || r.is_default);
          const initialId = String(primary?.id || list[0].id);
          setSelectedResumeId(initialId);
          await computeMatchesForResume(initialId);
        }
      } catch (err) {
        showToast('danger', 'Failed to load resumes for matching.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleResumeChange = async (e) => {
    const nextId = e.target.value;
    setSelectedResumeId(nextId);
    await computeMatchesForResume(nextId);
  };

  const handleSaveToTracker = async (jobObj) => {
    const jId = jobObj?.id || jobObj?.job_id;
    if (!jId) return;
    setSavingJobId(jId);
    try {
      await applicationService.createOrUpdateApplication(jId, 'Saved', '');
      showToast('success', `"${jobObj.title || jobObj.job_title}" added to Application Tracker!`);
    } catch (err) {
      showToast('danger', 'Failed to save job to tracker.');
    } finally {
      setSavingJobId(null);
    }
  };

  const getScoreTheme = (score) => {
    if (score >= 80) return { color: '#10B981', bg: '#ECFDF5', label: 'Strong Fit' };
    if (score >= 60) return { color: '#4F46E5', bg: '#EEF2FF', label: 'Good Match' };
    return { color: '#F59E0B', bg: '#FFFBEB', label: 'Partial Fit' };
  };

  const filteredMatches = matches.filter((m) => {
    const job = m.job || m;
    const score = Number(m.match_score ?? 0);
    const q = searchQuery.toLowerCase();
    const titleMatch = (job.title || job.job_title || '').toLowerCase().includes(q);
    const companyMatch = (job.company || '').toLowerCase().includes(q);
    return score >= minScoreFilter && (titleMatch || companyMatch);
  });

  const bestScore = matches.length > 0 ? Math.max(...matches.map((m) => Number(m.match_score ?? 0))) : 0;
  const strongFitsCount = matches.filter((m) => Number(m.match_score ?? 0) >= 75).length;

  const cardStyle = {
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  };

  const ringRadius = 28;
  const ringCircumference = 2 * Math.PI * ringRadius;

  return (
    <div className="py-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="container">
        {toast && (
          <div
            className={`alert alert-${toast.type} d-flex align-items-center justify-content-between rounded-4 shadow-sm mb-4`}
          >
            <span className="small fw-semibold">{toast.message}</span>
            <button type="button" className="btn-close btn-sm" onClick={() => setToast(null)}></button>
          </div>
        )}

        {/* Top Header */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <span
              className="badge rounded-pill px-3 py-1 fw-semibold mb-1"
              style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11.5px' }}
            >
              <i className="bi bi-bullseye me-1"></i> Weighted Compatibility Engine
            </span>
            <h2 className="fw-bold mb-1" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
              Smart Job Matching &amp; Skill Gaps
            </h2>
            <p className="text-muted small mb-0">
              Evaluates skill overlap (50%), experience alignment (30%), and keyword density (20%) against open roles.
            </p>
          </div>

          <div className="d-flex gap-2">
            <Link
              to="/jobs"
              className="btn btn-sm bg-white fw-semibold px-3 py-2"
              style={{ border: '1px solid #CBD5E1', color: '#334155', borderRadius: '10px' }}
            >
              <i className="bi bi-plus-circle me-1 text-primary"></i> Import External JD
            </Link>
            <button
              type="button"
              disabled={!selectedResumeId || matching}
              onClick={() => computeMatchesForResume(selectedResumeId)}
              className="btn btn-sm text-white fw-semibold px-3 py-2 shadow-sm"
              style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
            >
              <i className="bi bi-arrow-repeat me-1"></i>
              {matching ? 'Scoring...' : 'Refresh Matches'}
            </button>
          </div>
        </div>

        {/* Resume Selector + 3 Summary KPIs */}
        <div className="row g-3 mb-4">
          <div className="col-lg-6">
            <div className="card bg-white p-4 h-100" style={cardStyle}>
              <label className="small fw-bold text-dark mb-2 d-block">
                <i className="bi bi-file-earmark-person me-2" style={{ color: '#4F46E5' }}></i>
                Select Candidate Resume for Matching
              </label>
              <select
                className="form-select"
                value={selectedResumeId}
                onChange={handleResumeChange}
                disabled={loading || resumes.length === 0}
              >
                {resumes.length === 0 ? (
                  <option value="">No resumes uploaded yet</option>
                ) : (
                  resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.filename || r.file?.split('/').pop() || `Resume #${r.id}`}{' '}
                      {r.is_primary || r.is_default ? '(Primary)' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="col-4 col-lg-2">
            <div className="card bg-white p-3 p-md-4 h-100 text-center" style={cardStyle}>
              <div className="small text-muted fw-semibold mb-1">Roles Scored</div>
              <div className="fw-bold fs-3" style={{ color: '#0F172A' }}>{matches.length}</div>
            </div>
          </div>

          <div className="col-4 col-lg-2">
            <div className="card bg-white p-3 p-md-4 h-100 text-center" style={cardStyle}>
              <div className="small text-muted fw-semibold mb-1">Best Match</div>
              <div className="fw-bold fs-3" style={{ color: '#10B981' }}>{bestScore}%</div>
            </div>
          </div>

          <div className="col-4 col-lg-2">
            <div className="card bg-white p-3 p-md-4 h-100 text-center" style={cardStyle}>
              <div className="small text-muted fw-semibold mb-1">Strong Fits (75%+)</div>
              <div className="fw-bold fs-3" style={{ color: '#4F46E5' }}>{strongFitsCount}</div>
            </div>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="card bg-white p-3 mb-4" style={cardStyle}>
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="input-group">
                <span
                  className="input-group-text border-end-0"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}
                >
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', fontSize: '13.5px' }}
                  placeholder="Filter matched roles by title or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-6 d-flex flex-wrap justify-content-md-end gap-2">
              {[
                { label: 'All Roles', min: 0 },
                { label: '50%+ Fit', min: 50 },
                { label: '75%+ Strong Fit', min: 75 },
              ].map((pill) => (
                <button
                  key={pill.min}
                  type="button"
                  onClick={() => setMinScoreFilter(pill.min)}
                  className="btn btn-sm fw-semibold px-3 py-1.5"
                  style={{
                    borderRadius: '8px',
                    fontSize: '12px',
                    backgroundColor: minScoreFilter === pill.min ? '#4F46E5' : '#F8FAFC',
                    color: minScoreFilter === pill.min ? '#FFFFFF' : '#475569',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Match Results List */}
        {loading || matching ? (
          <div className="card bg-white p-5 text-center" style={cardStyle}>
            <div className="spinner-border mx-auto" style={{ color: '#4F46E5' }} role="status"></div>
            <h6 className="fw-bold text-dark mt-3 mb-1">Computing Job Compatibility Scores...</h6>
            <p className="text-muted small mb-0">
              Comparing your extracted resume skills and experience against active job descriptions.
            </p>
          </div>
        ) : resumes.length === 0 ? (
          <div className="card bg-white p-5 text-center" style={cardStyle}>
            <i className="bi bi-file-earmark-arrow-up fs-1 text-muted"></i>
            <h5 className="fw-bold text-dark mt-3">Upload a Resume First</h5>
            <p className="text-muted small mb-3">
              We need an uploaded resume to calculate your compatibility score against job openings.
            </p>
            <Link
              to="/resumes"
              className="btn text-white fw-semibold px-4 mx-auto"
              style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
            >
              Upload Resume
            </Link>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="card bg-white p-5 text-center" style={cardStyle}>
            <i className="bi bi-search fs-1 text-muted"></i>
            <h5 className="fw-bold text-dark mt-3">No Job Matches Above {minScoreFilter}%</h5>
            <p className="text-muted small mb-0">
              Try lowering the minimum match filter or seeding sample jobs in the Job Explorer.
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredMatches.map((item, index) => {
              const job = item.job || item;
              const jId = job.id || item.job_id || index;
              const score = Math.round(Number(item.match_score ?? 0));
              const theme = getScoreTheme(score);
              const offset = ringCircumference - (Math.min(100, score) / 100) * ringCircumference;
              const matchedSkills = Array.isArray(item.matched_skills) ? item.matched_skills : [];
              const missingSkills = Array.isArray(item.missing_skills) ? item.missing_skills : [];

              return (
                <div key={jId} className="card bg-white p-4 hover-card" style={cardStyle}>
                  <div className="row align-items-center g-4">
                    {/* Left: Role & Company Info */}
                    <div className="col-lg-4">
                      <div className="d-flex align-items-start gap-3">
                        <div
                          className="d-inline-flex align-items-center justify-content-center rounded-3 fw-bold flex-shrink-0"
                          style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: '#EEF2FF',
                            color: '#4F46E5',
                            fontSize: '16px',
                          }}
                        >
                          {(job.company || 'CO').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span
                            className="badge rounded-pill px-2.5 py-0.5 fw-semibold mb-1"
                            style={{ backgroundColor: theme.bg, color: theme.color, fontSize: '11px' }}
                          >
                            {theme.label}
                          </span>
                          <h5 className="fw-bold text-dark mb-1">{job.title || item.job_title}</h5>
                          <div className="text-muted small">
                            <strong className="text-dark fw-semibold">{job.company}</strong> •{' '}
                            {job.location || 'Remote'}
                          </div>
                          {job.salary_range && (
                            <div className="small fw-semibold text-success mt-1">
                              {job.salary_range}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Center: Matched vs Missing Skill Chips */}
                    <div className="col-lg-5">
                      <div className="mb-2">
                        <div className="text-muted fw-semibold mb-1" style={{ fontSize: '11.5px' }}>
                          Matched Skills ({matchedSkills.length})
                        </div>
                        <div className="d-flex flex-wrap gap-1">
                          {matchedSkills.length > 0 ? (
                            matchedSkills.map((s, i) => (
                              <span
                                key={i}
                                className="badge fw-medium"
                                style={{ backgroundColor: '#ECFDF5', color: '#059669', fontSize: '11px' }}
                              >
                                ✓ {s}
                              </span>
                            ))
                          ) : (
                            <span className="small text-muted fst-italic">None matched</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-muted fw-semibold mb-1" style={{ fontSize: '11.5px' }}>
                          Skill Gaps to Bridge ({missingSkills.length})
                        </div>
                        <div className="d-flex flex-wrap gap-1">
                          {missingSkills.length > 0 ? (
                            missingSkills.map((s, i) => (
                              <span
                                key={i}
                                className="badge fw-medium"
                                style={{ backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: '11px' }}
                              >
                                + {s}
                              </span>
                            ))
                          ) : (
                            <span className="small text-success fw-medium">All required skills matched!</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Circular Match Gauge + Actions */}
                    <div className="col-lg-3 d-flex flex-row flex-lg-column align-items-center align-items-lg-end justify-content-between gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <div className="position-relative d-inline-flex align-items-center justify-content-center">
                          <svg width="70" height="70" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="35" cy="35" r={ringRadius} stroke="#E2E8F0" strokeWidth="6" fill="transparent" />
                            <circle
                              cx="35"
                              cy="35"
                              r={ringRadius}
                              stroke={theme.color}
                              strokeWidth="6"
                              fill="transparent"
                              strokeDasharray={ringCircumference}
                              strokeDashoffset={offset}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="position-absolute fw-bold small" style={{ color: '#0F172A' }}>
                            {score}%
                          </span>
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedMatchModal(item)}
                          className="btn btn-sm fw-semibold px-3"
                          style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '8px' }}
                        >
                          Scorecard
                        </button>
                        <button
                          type="button"
                          disabled={savingJobId === jId}
                          onClick={() => handleSaveToTracker(job)}
                          className="btn btn-sm text-white fw-semibold px-3"
                          style={{ backgroundColor: '#4F46E5', borderRadius: '8px' }}
                        >
                          {savingJobId === jId ? 'Saving...' : 'Save Job'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Match Scorecard Modal */}
      {selectedMatchModal && (
        <div
          className="modal show fade d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-white border-bottom px-4 py-3">
                <div>
                  <h5 className="modal-title fw-bold text-dark mb-0">
                    Compatibility Scorecard — {selectedMatchModal.job?.title || selectedMatchModal.job_title}
                  </h5>
                  <div className="text-muted small">
                    {selectedMatchModal.job?.company || selectedMatchModal.company}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedMatchModal(null)}
                ></button>
              </div>

              <div className="modal-body p-4" style={{ backgroundColor: '#F8FAFC' }}>
                <div className="bg-white p-4 rounded-4 mb-3" style={{ border: '1px solid #E2E8F0' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-bold text-dark">Weighted Compatibility Breakdown</span>
                    <span
                      className="badge rounded-pill px-3 py-2 fw-bold"
                      style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '14px' }}
                    >
                      Overall: {Math.round(Number(selectedMatchModal.match_score ?? 0))}%
                    </span>
                  </div>

                  {[
                    {
                      label: 'Technical & Core Skill Overlap (50% Weight)',
                      score: Math.round(Number(selectedMatchModal.skill_score ?? selectedMatchModal.match_score ?? 0)),
                      color: '#4F46E5',
                    },
                    {
                      label: 'Experience Level Alignment (30% Weight)',
                      score: Math.round(Number(selectedMatchModal.experience_score ?? 85)),
                      color: '#10B981',
                    },
                    {
                      label: 'Job Description Keyword Density (20% Weight)',
                      score: Math.round(Number(selectedMatchModal.keyword_score ?? selectedMatchModal.match_score ?? 0)),
                      color: '#2563EB',
                    },
                  ].map((bar, idx) => (
                    <div key={idx} className={idx < 2 ? 'mb-3' : 'mb-0'}>
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="fw-medium text-dark">{bar.label}</span>
                        <span className="fw-bold" style={{ color: bar.color }}>
                          {bar.score}%
                        </span>
                      </div>
                      <div className="progress" style={{ height: '7px', backgroundColor: '#E2E8F0' }}>
                        <div
                          className="progress-bar"
                          style={{ width: `${bar.score}%`, backgroundColor: bar.color, borderRadius: '4px' }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedMatchModal.explanation && (
                  <div className="bg-white p-4 rounded-4" style={{ border: '1px solid #E2E8F0' }}>
                    <h6 className="fw-bold text-dark mb-2">
                      <i className="bi bi-lightbulb-fill me-2" style={{ color: '#4F46E5' }}></i>
                      Matching Engine Summary
                    </h6>
                    <p className="small text-muted mb-0" style={{ lineHeight: 1.6 }}>
                      {selectedMatchModal.explanation}
                    </p>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-white border-top px-4 py-3">
                <button
                  type="button"
                  className="btn btn-sm fw-semibold px-3"
                  style={{ backgroundColor: '#F1F5F9', color: '#334155', borderRadius: '8px' }}
                  onClick={() => setSelectedMatchModal(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveToTracker(selectedMatchModal.job || selectedMatchModal)}
                  className="btn btn-sm text-white fw-semibold px-4"
                  style={{ backgroundColor: '#4F46E5', borderRadius: '8px' }}
                >
                  <i className="bi bi-bookmark-plus me-1"></i> Add to Kanban Tracker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobMatching;