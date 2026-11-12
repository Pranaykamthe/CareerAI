import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resumeService } from '../../services/resumeService';

const ResumeAnalyzer = () => {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    setLoading(true);
    try {
      const data = await resumeService.getResumes();
      setResumes(data);
      if (data.length > 0) {
        const primary = data.find((r) => r.is_primary) || data[0];
        setSelectedResumeId(primary.id);
        await loadAnalysis(primary.id);
      }
    } catch (err) {
      setError('Failed to load candidate resumes.');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysis = async (resumeId) => {
    setAnalyzing(true);
    setError(null);
    try {
      const report = await resumeService.getAnalysis(resumeId);
      setAnalysis(report);
    } catch (err) {
      setError('Unable to load ATS analysis for this resume.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleResumeSelect = (e) => {
    const id = parseInt(e.target.value, 10);
    setSelectedResumeId(id);
    loadAnalysis(id);
  };

  const handleReanalyze = async () => {
    if (!selectedResumeId) return;
    setAnalyzing(true);
    try {
      const freshReport = await resumeService.triggerAnalysis(selectedResumeId);
      setAnalysis(freshReport);
    } catch (err) {
      setError('Failed to re-analyze resume.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const cleanText = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/\[cite:[^\]]*\]/gi, '').trim();
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Loading ATS Resume Analyzer...</p>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="container py-5">
        <div className="card border-0 shadow-sm text-center p-5 rounded-4 bg-white">
          <i className="bi bi-file-earmark-arrow-up display-3 text-muted mb-3"></i>
          <h4 className="fw-bold">No Resumes Found</h4>
          <p className="text-muted">Upload a resume first to run automated ATS scoring and analysis.</p>
          <div>
            <Link to="/resumes" className="btn btn-primary px-4 py-2">
              <i className="bi bi-upload me-2"></i>Go to Resume Upload
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const score = analysis?.overall_score || 0;
  const scoreColor = getScoreColor(score);

  return (
    <div className="container-fluid py-4 px-lg-5">
      {/* Top Header & Actions */}
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Resume Analyzer & ATS Scoring</h3>
          <p className="text-muted small mb-0">
            Evaluate your resume against industry ATS standards and discover actionable improvements.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <select
            className="form-select form-select-sm shadow-sm"
            style={{ minWidth: '240px' }}
            value={selectedResumeId || ''}
            onChange={handleResumeSelect}
            disabled={analyzing}
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.file_name} {r.is_primary ? '(Primary)' : ''}
              </option>
            ))}
          </select>

          <button
            className="btn btn-outline-primary btn-sm shadow-sm"
            onClick={handleReanalyze}
            disabled={analyzing}
          >
            <i className={`bi bi-arrow-clockwise me-1 ${analyzing ? 'spin' : ''}`}></i>
            {analyzing ? 'Analyzing...' : 'Re-Analyze'}
          </button>

          <Link to="/resumes" className="btn btn-outline-secondary btn-sm shadow-sm">
            <i className="bi bi-folder2 me-1"></i> Resumes
          </Link>

          <Link to="/job-matching" className="btn btn-primary btn-sm shadow-sm">
            <i className="bi bi-bullseye me-1"></i> Job Matching
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {analysis && (
        <div className="row g-4">
          {/* Left Column: Overall Score & Breakdown */}
          <div className="col-12 col-xl-4">
            <div className="card border-0 shadow-sm p-4 text-center rounded-4 mb-4 bg-white">
              <h6 className="text-muted text-uppercase small fw-semibold mb-3">Overall ATS Score</h6>

              <div
                className="d-flex flex-column align-items-center justify-content-center mx-auto my-2 rounded-circle"
                style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '50%',
                  border: `8px solid ${scoreColor}`,
                  boxShadow: `0 0 14px ${scoreColor}33`,
                }}
              >
                <span className="display-5 fw-bold text-dark">{score}</span>
                <span className="text-muted small fw-medium">/ 100</span>
              </div>

              <div className="mt-2">
                <span
                  className={`badge ${
                    score >= 80
                      ? 'bg-success-subtle text-success border border-success-subtle'
                      : score >= 60
                      ? 'bg-warning-subtle text-warning border border-warning-subtle'
                      : 'bg-danger-subtle text-danger border border-danger-subtle'
                  } px-3 py-2 fs-6 rounded-pill`}
                >
                  {score >= 80 ? 'Excellent Match' : score >= 60 ? 'Needs Optimization' : 'Significant Gaps'}
                </span>
                <p className="small text-muted mt-2 mb-0">
                  Calculated using section completeness, keyword density, and quantifiable impact metrics.
                </p>
              </div>
            </div>

            {/* Progress Breakdown */}
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white mb-4">
              <h6 className="fw-bold mb-3 text-dark">Score Breakdown</h6>

              <div className="mb-3">
                <div className="d-flex justify-content-between small fw-medium mb-1">
                  <span>ATS Compatibility</span>
                  <span>{analysis.ats_compatibility_score ?? 0}%</span>
                </div>
                <div className="progress" style={{ height: '7px' }}>
                  <div
                    className="progress-bar bg-primary"
                    style={{ width: `${analysis.ats_compatibility_score ?? 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between small fw-medium mb-1">
                  <span>Keyword Optimization</span>
                  <span>{analysis.keyword_score ?? 0}%</span>
                </div>
                <div className="progress" style={{ height: '7px' }}>
                  <div
                    className="progress-bar bg-info"
                    style={{ width: `${analysis.keyword_score ?? 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between small fw-medium mb-1">
                  <span>Content Quality & Verbs</span>
                  <span>{analysis.content_quality_score ?? 0}%</span>
                </div>
                <div className="progress" style={{ height: '7px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${analysis.content_quality_score ?? 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between small fw-medium mb-1">
                  <span>Measurable Impact</span>
                  <span>{analysis.measurable_impact_score ?? 0}%</span>
                </div>
                <div className="progress" style={{ height: '7px' }}>
                  <div
                    className="progress-bar bg-warning"
                    style={{ width: `${analysis.measurable_impact_score ?? 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between small fw-medium mb-1">
                  <span>Formatting & Structure</span>
                  <span>{analysis.formatting_score ?? 0}%</span>
                </div>
                <div className="progress" style={{ height: '7px' }}>
                  <div
                    className="progress-bar bg-secondary"
                    style={{ width: `${analysis.formatting_score ?? 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Extraction Metrics */}
            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
              <h6 className="fw-bold mb-3 text-dark">Extraction Statistics</h6>
              <ul className="list-group list-group-flush small">
                <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span className="text-muted"><i className="bi bi-file-text me-2"></i>Word Count</span>
                  <span className="fw-semibold">{analysis.metrics_summary?.word_count ?? 0} words</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span className="text-muted"><i className="bi bi-lightning-charge me-2"></i>Identified Skills</span>
                  <span className="fw-semibold">{analysis.metrics_summary?.skills_detected ?? 0} detected</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span className="text-muted"><i className="bi bi-bullseye me-2"></i>Action Verbs</span>
                  <span className="fw-semibold">{analysis.metrics_summary?.action_verbs_count ?? 0} used</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span className="text-muted"><i className="bi bi-graph-up me-2"></i>Quantified Metrics</span>
                  <span className="fw-semibold">{analysis.metrics_summary?.measurable_metrics_count ?? 0} found</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Findings and Recommendations */}
          <div className="col-12 col-xl-8">
            <div className="card border-0 shadow-sm p-4 rounded-4 mb-4 bg-white">
              <h5 className="fw-bold mb-3 text-dark">Analysis Findings</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="p-3 rounded-3 bg-success-subtle border border-success-subtle h-100">
                    <h6 className="text-success fw-bold d-flex align-items-center mb-3">
                      <i className="bi bi-check-circle-fill me-2"></i>Key Strengths
                    </h6>
                    <ul className="list-unstyled mb-0 small">
                      {analysis.strengths && analysis.strengths.length > 0 ? (
                        analysis.strengths.map((str, idx) => (
                          <li key={idx} className="mb-2 d-flex align-items-start">
                            <i className="bi bi-check2 text-success me-2 mt-1"></i>
                            <span>{cleanText(str)}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-muted">No primary strengths noted.</li>
                      )}
                    </ul>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="p-3 rounded-3 bg-danger-subtle border border-danger-subtle h-100">
                    <h6 className="text-danger fw-bold d-flex align-items-center mb-3">
                      <i className="bi bi-exclamation-octagon-fill me-2"></i>Areas for Improvement
                    </h6>
                    <ul className="list-unstyled mb-0 small">
                      {analysis.weaknesses && analysis.weaknesses.length > 0 ? (
                        analysis.weaknesses.map((weak, idx) => (
                          <li key={idx} className="mb-2 d-flex align-items-start">
                            <i className="bi bi-x-circle text-danger me-2 mt-1"></i>
                            <span>{cleanText(weak)}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-muted">No immediate critical issues detected.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="fw-bold mb-0 text-dark">Recommended Enhancements</h5>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                  {analysis.recommendations?.length || 0} Action Items
                </span>
              </div>
              <p className="text-muted small mb-4">
                Apply these targeted recommendations to maximize your pass rate on automated screening systems.
              </p>

              <div className="d-flex flex-column gap-3">
                {analysis.recommendations && analysis.recommendations.map((rec, index) => (
                  <div key={index} className="p-3 border rounded-3 bg-light bg-opacity-50">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-white text-dark border fw-medium">{cleanText(rec.category)}</span>
                      <small className="text-muted fw-semibold">Priority {index + 1}</small>
                    </div>
                    <h6 className="fw-bold text-dark mb-1">{cleanText(rec.title)}</h6>
                    <p className="text-muted small mb-0">{cleanText(rec.suggestion)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzer;