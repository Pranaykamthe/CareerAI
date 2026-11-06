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
    const id = parseInt(e.target.value);
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
    if (score >= 80) return '#10B981'; // green
    if (score >= 60) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'badge bg-success-subtle text-success border border-success-subtle';
    if (score >= 60) return 'badge bg-warning-subtle text-warning border border-warning-subtle';
    return 'badge bg-danger-subtle text-danger border border-danger-subtle';
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
        <div className="card border-0 shadow-sm text-center p-5">
          <i className="bi bi-file-earmark-arrow-up display-3 text-muted mb-3"></i>
          <h4 className="fw-bold">No Resumes Found</h4>
          <p className="text-muted">Upload a resume first to run the automated ATS scoring and analysis.</p>
          <div>
            <Link to="/resumes" className="btn btn-primary px-4 py-2">
              <i className="bi bi-upload me-2"></i>Go to Resume Upload
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedResume = resumes.find((r) => r.id === selectedResumeId);
  const score = analysis?.overall_score || 0;
  const scoreColor = getScoreColor(score);

  return (
    <div className="container-fluid py-4 px-lg-5 bg-light min-vh-100">
      {/* Top Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-dark mb-1">Resume Analyzer & ATS Scoring</h3>
          <p className="text-muted mb-0">Evaluate your resume against industry ATS standards and discover actionable improvements.</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <select
            className="form-select shadow-sm"
            style={{ minWidth: '240px' }}
            value={selectedResumeId}
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
            className="btn btn-outline-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={handleReanalyze}
            disabled={analyzing}
          >
            <i className={`bi bi-arrow-clockwise ${analyzing ? 'spin' : ''}`}></i>
            {analyzing ? 'Analyzing...' : 'Re-Analyze'}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      {analysis && (
        <div className="row g-4">
          {/* Left Column: Overall Score & Sub-scores */}
          <div className="col-lg-4">
            {/* Circular Gauge Card */}
            <div className="card border-0 shadow-sm p-4 text-center mb-4">
              <h6 className="text-muted text-uppercase fw-semibold mb-3">Overall ATS Score</h6>
              
              {/* Circular Meter Simulation */}
              <div
                className="d-flex flex-column align-items-center justify-content-center mx-auto my-3 rounded-circle shadow-inner"
                style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  border: `10px solid ${scoreColor}`,
                  boxShadow: `0 0 15px ${scoreColor}33`,
                }}
              >
                <span className="display-4 fw-bold text-dark">{score}</span>
                <span className="text-muted small fw-medium">/ 100</span>
              </div>

              <div className="mt-2">
                <span className={getScoreBadgeClass(score)}>
                  {score >= 80 ? 'Excellent Match' : score >= 60 ? 'Needs Optimization' : 'Significant Gaps'}
                </span>
                <p className="small text-muted mt-2 mb-0">
                  Calculated using section completeness, keyword density, and quantifiable impact metrics[cite: 4].
                </p>
              </div>
            </div>

            {/* Score Breakdown Bars */}
            <div className="card border-0 shadow-sm p-4 mb-4">
              <h6 className="fw-bold mb-3">Score Breakdown</h6>
              
              <div className="mb-3">
                <div className="d-flex justify-content-between small fw-medium mb-1">
                  <span>ATS Compatibility</span>
                  <span>{analysis.ats_compatibility_score}%</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-primary"
                    style={{ width: `${analysis.ats_compatibility_score}%` }}
                  ></div>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between small fw-medium mb-1">
                  <span>Keyword Optimization</span>
                  <span>{analysis.keyword_score}%</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-info"
                    style={{ width: `${analysis.keyword_score}%` }}
                  ></div>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between small fw-medium mb-1">
                  <span>Content Quality & Verbs</span>
                  <span>{analysis.content_quality_score}%</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${analysis.content_quality_score}%` }}
                  ></div>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between small fw-medium mb-1">
                  <span>Measurable Impact</span>
                  <span>{analysis.measurable_impact_score}%</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-warning"
                    style={{ width: `${analysis.measurable_impact_score}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between small fw-medium mb-1">
                  <span>Formatting & Structure</span>
                  <span>{analysis.formatting_score}%</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-secondary"
                    style={{ width: `${analysis.formatting_score}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Card */}
            <div className="card border-0 shadow-sm p-4">
              <h6 className="fw-bold mb-3">Extraction Statistics</h6>
              <ul className="list-group list-group-flush small">
                <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span className="text-muted"><i className="bi bi-file-text me-2"></i>Word Count</span>
                  <span className="fw-semibold">{analysis.metrics_summary?.word_count || 0} words</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span className="text-muted"><i className="bi bi-lightning-charge me-2"></i>Identified Skills</span>
                  <span className="fw-semibold">{analysis.metrics_summary?.skills_detected || 0} skills</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span className="text-muted"><i className="bi bi-bullseye me-2"></i>Action Verbs</span>
                  <span className="fw-semibold">{analysis.metrics_summary?.action_verbs_count || 0} verbs</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span className="text-muted"><i className="bi bi-graph-up me-2"></i>Quantified Metrics</span>
                  <span className="fw-semibold">{analysis.metrics_summary?.measurable_metrics_count || 0} metrics</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Strengths, Weaknesses, and Actionable Recommendations */}
          <div className="col-lg-8">
            {/* Strengths & Weaknesses Split Card */}
            <div className="card border-0 shadow-sm p-4 mb-4">
              <h5 className="fw-bold mb-3">Analysis Findings</h5>
              <div className="row g-4">
                {/* Strengths */}
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
                            <span>{str}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-muted">No primary strengths noted.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Weaknesses */}
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
                            <span>{weak}</span>
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

            {/* Improvement Recommendations (Cards) */}
            <div className="card border-0 shadow-sm p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Recommended Enhancements</h5>
                <span className="badge bg-primary-subtle text-primary">
                  {analysis.recommendations?.length || 0} Action Items
                </span>
              </div>
              <p className="text-muted small mb-4">
                Apply these targeted recommendations to maximize your pass rate on automated screening systems[cite: 4].
              </p>

              <div className="d-flex flex-column gap-3">
                {analysis.recommendations && analysis.recommendations.map((rec, index) => (
                  <div key={index} className="p-3 border rounded-3 bg-white shadow-xs">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-light text-dark border fw-medium">{rec.category}</span>
                      <small className="text-muted">Priority {index + 1}</small>
                    </div>
                    <h6 className="fw-bold text-dark mb-1">{rec.title}</h6>
                    <p className="text-muted small mb-0">{rec.suggestion}</p>
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