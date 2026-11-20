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
    if (typeof str !== 'string') return '';
    return str.replace(/\[cite:[^\]]*\]/gi, '').trim();
  };

  // Safely render either a string or { category, title, suggestion } object
  const renderFeedbackText = (item) => {
    if (typeof item === 'string') return cleanText(item);
    if (item && typeof item === 'object') {
      return cleanText(item.suggestion || item.title || item.category || '');
    }
    return '';
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
  const selectedResume = resumes.find((r) => r.id === selectedResumeId);
  const extractedSkills = selectedResume?.parsed_data?.skills || [];

  const breakdownItems = [
    { label: 'ATS Compatibility', value: analysis?.ats_compatibility_score ?? 0 },
    { label: 'Keyword Optimization', value: analysis?.keyword_score ?? 0 },
    { label: 'Content Quality', value: analysis?.content_quality_score ?? 0 },
    { label: 'Measurable Impact', value: analysis?.measurable_impact_score ?? 0 },
    { label: 'Formatting & Structure', value: analysis?.formatting_score ?? 0 },
  ];

  return (
    <div className="container-fluid py-4 px-lg-5" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Top Header & Actions */}
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Resume Analyzer &amp; ATS Scoring</h3>
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

          <Link to="/resume-builder" className="btn btn-outline-secondary btn-sm shadow-sm">
            <i className="bi bi-magic me-1"></i> AI Resume Builder
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
            <div className="card border shadow-sm p-4 text-center rounded-4 mb-4 bg-white">
              <h6 className="text-muted text-uppercase small fw-semibold mb-3">Overall ATS Score</h6>
              <div
                className="d-flex flex-column align-items-center justify-content-center mx-auto my-2 rounded-circle"
                style={{
                  width: '160px',
                  height: '160px',
                  border: `8px solid ${scoreColor}`,
                  boxShadow: `0 0 14px ${scoreColor}33`,
                }}
              >
                <span className="display-5 fw-bold text-dark">{score}</span>
                <span className="text-muted small fw-medium">/ 100</span>
              </div>
              <p className="small text-muted mt-3 mb-0">
                {score >= 80
                  ? 'Strong ATS alignment. Ready for targeted applications.'
                  : score >= 60
                  ? 'Moderate score. Apply the recommendations to boost visibility.'
                  : 'Needs optimization before applying to competitive roles.'}
              </p>
            </div>

            <div className="card border shadow-sm p-4 rounded-4 bg-white">
              <h6 className="fw-bold text-dark mb-3">Score Breakdown</h6>
              <div className="d-flex flex-column gap-3">
                {breakdownItems.map((item, idx) => (
                  <div key={idx}>
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted fw-medium">{item.label}</span>
                      <span className="fw-bold text-dark">{item.value}%</span>
                    </div>
                    <div className="progress" style={{ height: '8px', backgroundColor: '#E2E8F0' }}>
                      <div
                        className="progress-bar"
                        style={{
                          width: `${item.value}%`,
                          backgroundColor: getScoreColor(item.value),
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Strengths, Weaknesses, Skills & Recommendations */}
          <div className="col-12 col-xl-8">
            <div className="row g-4 mb-4">
              {/* Strengths */}
              <div className="col-md-6">
                <div className="card border shadow-sm p-4 rounded-4 bg-white h-100">
                  <h6 className="fw-bold text-success mb-3">
                    <i className="bi bi-check-circle-fill me-2"></i>Key Strengths
                  </h6>
                  {analysis.strengths?.length > 0 ? (
                    <ul className="small text-muted ps-3 mb-0 d-flex flex-column gap-2">
                      {analysis.strengths.map((item, i) => (
                        <li key={i}>{renderFeedbackText(item)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="small text-muted mb-0">No strengths recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Weaknesses */}
              <div className="col-md-6">
                <div className="card border shadow-sm p-4 rounded-4 bg-white h-100">
                  <h6 className="fw-bold text-danger mb-3">
                    <i className="bi bi-exclamation-circle-fill me-2"></i>Areas to Improve
                  </h6>
                  {analysis.weaknesses?.length > 0 ? (
                    <ul className="small text-muted ps-3 mb-0 d-flex flex-column gap-2">
                      {analysis.weaknesses.map((item, i) => (
                        <li key={i}>{renderFeedbackText(item)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="small text-muted mb-0">No critical issues detected.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Extracted Skills */}
            {extractedSkills.length > 0 && (
              <div className="card border shadow-sm p-4 rounded-4 bg-white mb-4">
                <h6 className="fw-bold text-dark mb-3">
                  <i className="bi bi-tags-fill text-primary me-2"></i>Detected Resume Skills ({extractedSkills.length})
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {extractedSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="badge fw-medium px-3 py-2 rounded-pill"
                      style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                    >
                      {typeof skill === 'string' ? skill : skill?.name || ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actionable Recommendations */}
            <div className="card border shadow-sm p-4 rounded-4 bg-white">
              <h6 className="fw-bold text-dark mb-3">
                <i className="bi bi-lightbulb-fill text-warning me-2"></i>Actionable Recommendations
              </h6>
              <div className="d-flex flex-column gap-3">
                {analysis.recommendations?.length > 0 ? (
                  analysis.recommendations.map((rec, index) => {
                    const isObj = rec && typeof rec === 'object';
                    const category = isObj ? cleanText(rec.category || 'General') : 'Tip';
                    const title = isObj ? cleanText(rec.title || `Recommendation ${index + 1}`) : `Priority ${index + 1}`;
                    const suggestion = isObj ? cleanText(rec.suggestion || '') : cleanText(String(rec));

                    return (
                      <div key={index} className="p-3 border rounded-3 bg-light bg-opacity-50">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="badge bg-white text-dark border fw-medium">{category}</span>
                          <small className="text-muted fw-semibold">Priority {index + 1}</small>
                        </div>
                        <h6 className="fw-bold text-dark mb-1">{title}</h6>
                        <p className="text-muted small mb-0">{suggestion}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="small text-muted mb-0">No additional recommendations at this time.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzer;