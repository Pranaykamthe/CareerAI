import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { jobService } from '../../services/jobService';
import { resumeService } from '../../services/resumeService';

const JobMatching = () => {
  const [matches, setMatches] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [activeResumeInfo, setActiveResumeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    fetchResumesAndMatches();
  }, []);

  const fetchResumesAndMatches = async (resumeId = null) => {
    setLoading(true);
    setError('');
    try {
      const resumeList = await resumeService.getResumes();
      setResumes(resumeList);

      const matchRes = await jobService.getMatches(resumeId);
      setMatches(matchRes.matches || []);
      setActiveResumeInfo(matchRes.resume);

      if (matchRes.resume && !selectedResumeId) {
        setSelectedResumeId(matchRes.resume.id);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load job compatibility matches.');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeChange = (e) => {
    const id = e.target.value;
    setSelectedResumeId(id);
    fetchResumesAndMatches(id);
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'bg-success text-white';
    if (score >= 60) return 'bg-warning text-dark';
    return 'bg-secondary text-white';
  };

  const filteredMatches = matches.filter((item) => {
    const matchesFilter =
      filterLevel === 'ALL' ||
      (filterLevel === 'HIGH' && item.match_score >= 80) ||
      (filterLevel === 'MODERATE' && item.match_score >= 60 && item.match_score < 80) ||
      (filterLevel === 'LOW' && item.match_score < 60);

    const matchesSearch =
      !searchQuery ||
      item.job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.job.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />

      <div className="container py-4">
        {/* Header Breadcrumb & Actions */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h3 className="fw-bold text-dark mb-1 d-flex align-items-center">
              <i className="bi bi-bullseye text-primary me-2"></i> Job Matching & Compatibility
            </h3>
            <p className="text-muted small mb-0">
              Deterministic matching calculated across technical skills (50%), experience alignment (30%), and keyword density (20%).
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <label className="small fw-semibold text-muted text-nowrap d-none d-sm-inline">
              Active Resume:
            </label>
            <select
              className="form-select form-select-sm shadow-sm"
              style={{ minWidth: '220px' }}
              value={selectedResumeId}
              onChange={handleResumeChange}
              disabled={loading || resumes.length === 0}
            >
              {resumes.length === 0 && <option value="">No resumes found</option>}
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.file_name} {r.is_primary ? '(Primary)' : ''}
                </option>
              ))}
            </select>

            <button
              className="btn btn-outline-primary btn-sm text-nowrap"
              onClick={() => fetchResumesAndMatches(selectedResumeId)}
              disabled={loading}
              title="Recalculate matches"
            >
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
            <div>{error}</div>
          </div>
        )}

        {/* No Resumes Prompt */}
        {!loading && resumes.length === 0 && (
          <div className="card shadow-sm border-0 p-5 text-center bg-white rounded-3">
            <div className="d-inline-flex p-3 rounded-circle bg-primary bg-opacity-10 text-primary mx-auto mb-3">
              <i className="bi bi-file-earmark-arrow-up fs-1"></i>
            </div>
            <h4 className="fw-bold text-dark">No Resume Uploaded Yet</h4>
            <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '460px' }}>
              Upload your resume in PDF or DOCX format to analyze match compatibility against curated Indian tech roles.
            </p>
            <div>
              <Link to="/resumes" className="btn btn-primary-custom px-4">
                <i className="bi bi-cloud-arrow-up me-1"></i> Upload Resume
              </Link>
            </div>
          </div>
        )}

        {/* Filters and Search Bar */}
        {resumes.length > 0 && (
          <div className="card shadow-sm border-0 p-3 rounded-3 bg-white mb-4">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-6">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search by role, company, or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-md-6 d-flex justify-content-md-end gap-2">
                <div className="btn-group btn-group-sm w-100 w-md-auto">
                  <button
                    className={`btn ${filterLevel === 'ALL' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setFilterLevel('ALL')}
                  >
                    All ({matches.length})
                  </button>
                  <button
                    className={`btn ${filterLevel === 'HIGH' ? 'btn-success' : 'btn-outline-secondary'}`}
                    onClick={() => setFilterLevel('HIGH')}
                  >
                    High Match (&ge;80%)
                  </button>
                  <button
                    className={`btn ${filterLevel === 'MODERATE' ? 'btn-warning' : 'btn-outline-secondary'}`}
                    onClick={() => setFilterLevel('MODERATE')}
                  >
                    Moderate (60-79%)
                  </button>
                  <button
                    className={`btn ${filterLevel === 'LOW' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={() => setFilterLevel('LOW')}
                  >
                    Low (&lt;60%)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Calculating Compatibility...</span>
            </div>
            <p className="text-muted small mt-2">Comparing resume skills against job requirements...</p>
          </div>
        )}

        {/* Match Cards List */}
        {!loading && resumes.length > 0 && (
          <div className="row g-3">
            {filteredMatches.length === 0 ? (
              <div className="col-12 text-center py-5">
                <i className="bi bi-search fs-1 text-muted"></i>
                <p className="text-muted mt-2">No job matches found matching current filters.</p>
              </div>
            ) : (
              filteredMatches.map((item) => (
                <div className="col-12" key={item.id}>
                  <div className="card shadow-sm border-0 rounded-3 p-3 bg-white h-100">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3">
                      {/* Left: Role Info */}
                      <div className="flex-grow-1">
                        <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                          <h5 className="fw-bold text-dark mb-0">{item.job.title}</h5>
                          <span className="badge bg-light text-dark border">
                            <i className="bi bi-building me-1"></i> {item.job.company}
                          </span>
                          <span className="badge bg-light text-muted border">
                            <i className="bi bi-geo-alt me-1"></i> {item.job.location}
                          </span>
                          <span className="badge bg-light text-muted border">
                            <i className="bi bi-briefcase me-1"></i> {item.job.job_type}
                          </span>
                          {item.job.salary_range && (
                            <span className="badge bg-success bg-opacity-10 text-success fw-semibold">
                              <i className="bi bi-currency-rupee"></i> {item.job.salary_range}
                            </span>
                          )}
                        </div>

                        <p className="text-muted small mb-2" style={{ maxWidth: '780px' }}>
                          {item.job.description.slice(0, 160)}...
                        </p>

                        {/* Matched & Missing Skills Tags */}
                        <div className="d-flex flex-wrap align-items-center gap-1 mb-2">
                          <span className="small text-muted me-1 fw-semibold">Matched:</span>
                          {item.matched_skills.length > 0 ? (
                            item.matched_skills.map((skill, idx) => (
                              <span key={idx} className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2 py-1 small">
                                <i className="bi bi-check me-1"></i> {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted small fst-italic">None detected</span>
                          )}

                          {item.missing_skills.length > 0 && (
                            <>
                              <span className="small text-muted ms-2 me-1 fw-semibold">Missing Gaps:</span>
                              {item.missing_skills.slice(0, 4).map((skill, idx) => (
                                <span key={idx} className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-2 py-1 small">
                                  <i className="bi bi-x me-1"></i> {skill}
                                </span>
                              ))}
                              {item.missing_skills.length > 4 && (
                                <span className="badge bg-light text-muted rounded-pill small">
                                  +{item.missing_skills.length - 4} more
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right: Score Gauge & Action */}
                      <div className="d-flex flex-md-column align-items-center justify-content-between text-end border-start-md ps-md-3" style={{ minWidth: '150px' }}>
                        <div className="text-center mb-md-2">
                          <span className={`badge rounded-pill px-3 py-2 fs-6 fw-bold ${getScoreBadgeClass(item.match_score)}`}>
                            {item.match_score}% Match
                          </span>
                          <div className="small fw-semibold text-muted mt-1">{item.match_level}</div>
                        </div>

                        <button
                          className="btn btn-outline-primary btn-sm px-3"
                          onClick={() => setSelectedMatch(item)}
                        >
                          <i className="bi bi-eye me-1"></i> Scorecard
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal: Detailed Match Breakdown Scorecard */}
        {selectedMatch && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg rounded-3">
                <div className="modal-header border-bottom py-3">
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">
                      {selectedMatch.job.title} — Compatibility Breakdown
                    </h5>
                    <small className="text-muted">{selectedMatch.job.company} &bull; {selectedMatch.job.location}</small>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setSelectedMatch(null)}></button>
                </div>

                <div className="modal-body p-4">
                  {/* Summary Metric Ribbon */}
                  <div className="row g-3 text-center mb-4">
                    <div className="col-4">
                      <div className="p-3 bg-light rounded-3 border">
                        <small className="text-muted fw-semibold d-block">Overall Match</small>
                        <span className="fs-3 fw-bold text-primary">{selectedMatch.match_score}%</span>
                        <div className="small text-muted">{selectedMatch.match_level}</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-3 bg-light rounded-3 border">
                        <small className="text-muted fw-semibold d-block">Skill Match (50%)</small>
                        <span className="fs-3 fw-bold text-success">{selectedMatch.skill_score}%</span>
                        <div className="small text-muted">{selectedMatch.matched_skills.length} matched</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-3 bg-light rounded-3 border">
                        <small className="text-muted fw-semibold d-block">Experience (30%)</small>
                        <span className="fs-3 fw-bold text-info">{selectedMatch.experience_score}%</span>
                        <div className="small text-muted">&ge; {selectedMatch.job.min_experience_years} yrs req.</div>
                      </div>
                    </div>
                  </div>

                  {/* Summary explanation */}
                  <div className="alert alert-light border small text-muted mb-4">
                    <i className="bi bi-info-circle text-primary me-2"></i>
                    {selectedMatch.summary}
                  </div>

                  {/* Matched Skills */}
                  <div className="mb-3">
                    <h6 className="fw-bold text-success small mb-2 d-flex align-items-center">
                      <i className="bi bi-check-circle-fill me-2"></i> Matched Technical Skills
                    </h6>
                    <div className="d-flex flex-wrap gap-1">
                      {selectedMatch.matched_skills.length > 0 ? (
                        selectedMatch.matched_skills.map((s, idx) => (
                          <span key={idx} className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 rounded-pill">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted small">No direct skill matches detected.</span>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills Gap */}
                  <div className="mb-4">
                    <h6 className="fw-bold text-danger small mb-2 d-flex align-items-center">
                      <i className="bi bi-exclamation-octagon-fill me-2"></i> Skill Gaps to Improve
                    </h6>
                    <div className="d-flex flex-wrap gap-1">
                      {selectedMatch.missing_skills.length > 0 ? (
                        selectedMatch.missing_skills.map((s, idx) => (
                          <span key={idx} className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 rounded-pill">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-success small fw-semibold">Great job! You have all required skills.</span>
                      )}
                    </div>
                  </div>

                  {/* Job Description Excerpt */}
                  <div className="border-top pt-3">
                    <h6 className="fw-bold text-dark small mb-1">Job Responsibilities & Scope</h6>
                    <p className="text-muted small mb-0" style={{ whiteSpace: 'pre-line' }}>
                      {selectedMatch.job.description}
                    </p>
                  </div>
                </div>

                <div className="modal-footer border-top py-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedMatch(null)}>
                    Close
                  </button>
                  <Link to="/job-descriptions" className="btn btn-primary-custom btn-sm">
                    View in Job Explorer
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

export default JobMatching;