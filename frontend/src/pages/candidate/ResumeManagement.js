import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { resumeService } from '../../services/resumeService';
import ParsedResumeModal from '../../components/resumes/ParsedResumeModal';

const ResumeManagement = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [selectedResume, setSelectedResume] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [parsingId, setParsingId] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const data = await resumeService.getResumes();
      setResumes(data);
    } catch (err) {
      setStatusMessage({ type: 'danger', text: 'Failed to fetch uploaded resumes.' });
    } finally {
      setLoading(false);
    }
  };

  const validateFile = (file) => {
    const validExtensions = ['pdf', 'docx'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      setStatusMessage({
        type: 'danger',
        text: `Invalid file format (${ext.toUpperCase()}). Only PDF and DOCX files are allowed.`,
      });
      return false;
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setStatusMessage({
        type: 'danger',
        text: 'File size exceeds 10MB. Please upload a smaller file.',
      });
      return false;
    }
    return true;
  };

  const handleFileUpload = async (file) => {
    if (!validateFile(file)) return;

    setStatusMessage({ type: '', text: '' });
    setUploadingFile(file);
    setUploadProgress(0);

    try {
      const newResume = await resumeService.uploadResume(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      setStatusMessage({
        type: 'success',
        text: `"${newResume.file_name || file.name}" uploaded and parsed successfully!`,
      });
      await loadResumes();
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.file?.[0] ||
        'Upload failed. Please check the file and try again.';
      setStatusMessage({ type: 'danger', text: errMsg });
    } finally {
      setUploadingFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleManualParse = async (id) => {
    try {
      setParsingId(id);
      const response = await resumeService.parseResume(id);
      const updatedResume = response.resume || response;
      setStatusMessage({ type: 'success', text: 'Resume re-parsed and ATS score updated!' });
      setResumes((prev) => prev.map((r) => (r.id === id ? updatedResume : r)));
    } catch (err) {
      setStatusMessage({ type: 'danger', text: 'Failed to re-parse resume content.' });
    } finally {
      setParsingId(null);
    }
  };

  const handleDelete = async (id, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) return;
    try {
      await resumeService.deleteResume(id);
      setStatusMessage({ type: 'success', text: 'Resume deleted successfully.' });
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setStatusMessage({ type: 'danger', text: 'Failed to delete resume.' });
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      await resumeService.setPrimaryResume(id);
      setStatusMessage({ type: 'success', text: 'Primary resume updated.' });
      setResumes((prev) =>
        prev.map((r) => ({
          ...r,
          is_primary: r.id === id,
        }))
      );
    } catch (err) {
      setStatusMessage({ type: 'danger', text: 'Could not update primary resume.' });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="container py-4 pb-5">
      {/* Header Bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Resume Management & Parsing</h3>
          <p className="text-muted small mb-0">
            Upload your resume, inspect extracted skills and sections, or build an ATS-optimized resume with AI.
          </p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2">
          <Link to="/resume-builder" className="btn btn-primary btn-sm px-3 py-2 fw-medium">
            <i className="bi bi-magic me-2"></i>AI Resume Builder
          </Link>
          <Link to="/resume-analyzer" className="btn btn-outline-primary btn-sm px-3 py-2 fw-medium">
            <i className="bi bi-bar-chart-line me-2"></i>ATS Analyzer
          </Link>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {statusMessage.text && (
        <div className={`alert alert-${statusMessage.type} alert-dismissible fade show shadow-sm`} role="alert">
          <i
            className={`bi ${
              statusMessage.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'
            } me-2`}
          ></i>
          {statusMessage.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setStatusMessage({ type: '', text: '' })}
          ></button>
        </div>
      )}

      <div className="row g-4">
        {/* Main Upload Zone & Library */}
        <div className="col-lg-8">
          <div
            className={`card shadow-sm border-2 p-5 text-center mb-4 ${
              dragActive ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary-subtle bg-white'
            }`}
            style={{
              borderRadius: '16px',
              borderStyle: 'dashed',
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer',
            }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="d-none"
              accept=".pdf,.docx"
              onChange={handleFileChange}
            />

            <div
              className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-sm"
              style={{
                width: '72px',
                height: '72px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
              }}
            >
              <i className="bi bi-cloud-arrow-up-fill fs-1"></i>
            </div>

            <h5 className="fw-bold text-dark mb-1">Drag & Drop your resume here</h5>
            <p className="text-muted small mb-3">or click to browse files from your computer</p>

            <div>
              <button
                type="button"
                className="btn btn-primary px-4 py-2 fw-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current && fileInputRef.current.click();
                }}
                disabled={uploadingFile !== null}
              >
                <i className="bi bi-folder2-open me-2"></i>Browse Files
              </button>
            </div>

            <div className="text-muted small mt-3" style={{ fontSize: '12px' }}>
              Supported formats: <strong>PDF, DOCX</strong> • Maximum file size: <strong>10MB</strong>
            </div>
          </div>

          {/* Live Upload Progress Indicator */}
          {uploadingFile && (
            <div className="card shadow-sm border-0 rounded-3 p-3 mb-4 bg-white">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-file-earmark-text-fill text-primary fs-4"></i>
                  <div>
                    <div className="fw-semibold small">{uploadingFile.name}</div>
                    <small className="text-muted">{uploadProgress}% uploaded & parsing...</small>
                  </div>
                </div>
                <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
              </div>
              <div className="progress" style={{ height: '6px' }}>
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                  role="progressbar"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Resumes Library */}
          <div className="card shadow-sm border-0 rounded-3 p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark mb-0">
                <i className="bi bi-collection-fill text-primary me-2"></i>My Uploaded Documents
              </h5>
              <span className="badge bg-light text-muted border px-2 py-1">
                {resumes.length} {resumes.length === 1 ? 'file' : 'files'}
              </span>
            </div>

            {loading ? (
              <div className="text-center py-4 text-muted">
                <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                Loading your resumes...
              </div>
            ) : resumes.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-file-earmark-x fs-1 d-block mb-2 text-secondary"></i>
                <h6>No resumes uploaded yet</h6>
                <p className="small mb-0">
                  Upload your PDF or DOCX resume above to get started with ATS analysis.
                </p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {resumes.map((resume) => {
                  const parsedOk = resume.is_parsed || resume.parse_status === 'parsed';
                  return (
                    <div
                      key={resume.id}
                      className={`p-3 rounded-3 border d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 ${
                        resume.is_primary ? 'border-primary bg-primary bg-opacity-10' : 'bg-light'
                      }`}
                    >
                      <div className="d-flex align-items-start gap-3">
                        <div
                          className="rounded p-3 d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{
                            backgroundColor: resume.file_type === 'pdf' ? '#FEE2E2' : '#EFF6FF',
                            color: resume.file_type === 'pdf' ? '#DC2626' : '#2563EB',
                            width: '48px',
                            height: '48px',
                          }}
                        >
                          <i
                            className={`bi ${
                              resume.file_type === 'pdf' ? 'bi-filetype-pdf' : 'bi-filetype-docx'
                            } fs-3`}
                          ></i>
                        </div>

                        <div>
                          <div className="d-flex flex-wrap align-items-center gap-2">
                            <span className="fw-bold text-dark">{resume.file_name}</span>
                            {resume.is_primary && (
                              <span
                                className="badge bg-primary text-white rounded-pill px-2 py-1"
                                style={{ fontSize: '11px' }}
                              >
                                Primary Active
                              </span>
                            )}
                            <span
                              className={`badge ${
                                parsedOk
                                  ? 'bg-success-subtle text-success border-success-subtle'
                                  : 'bg-warning-subtle text-warning border-warning-subtle'
                              } border`}
                              style={{ fontSize: '11px' }}
                            >
                              {parsedOk ? 'Parsed' : 'Pending'}
                            </span>
                            {resume.analysis?.overall_score !== undefined && (
                              <span
                                className="badge bg-white text-primary border"
                                style={{ fontSize: '11px' }}
                              >
                                ATS: {resume.analysis.overall_score}/100
                              </span>
                            )}
                          </div>

                          <div className="text-muted small mt-1">
                            {resume.formatted_file_size || formatFileSize(resume.file_size)} • Uploaded on{' '}
                            {new Date(resume.uploaded_at).toLocaleDateString()}
                          </div>

                          {/* Extracted Skills Tags Preview */}
                          {resume.extracted_skills && resume.extracted_skills.length > 0 && (
                            <div className="d-flex flex-wrap gap-1 mt-2">
                              {resume.extracted_skills.slice(0, 6).map((sk, idx) => (
                                <span
                                  key={idx}
                                  className="badge bg-white text-secondary border"
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  {sk}
                                </span>
                              ))}
                              {resume.extracted_skills.length > 6 && (
                                <span
                                  className="badge bg-white text-muted border"
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  +{resume.extracted_skills.length - 6} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Controls */}
                      <div className="d-flex flex-wrap align-items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            setSelectedResume(resume);
                            setShowModal(true);
                          }}
                          title="Inspect extracted text and structured data"
                        >
                          <i className="bi bi-eye me-1"></i> View Parsed
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleManualParse(resume.id)}
                          disabled={parsingId === resume.id}
                          title="Re-parse resume content"
                        >
                          {parsingId === resume.id ? (
                            <span className="spinner-border spinner-border-sm"></span>
                          ) : (
                            <i className="bi bi-arrow-repeat"></i>
                          )}
                        </button>

                        {!resume.is_primary && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleSetPrimary(resume.id)}
                            title="Set as primary active resume"
                          >
                            Set Primary
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => resumeService.downloadResume(resume.id, resume.file_name)}
                          title="Download resume file"
                        >
                          <i className="bi bi-download"></i>
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(resume.id, resume.file_name)}
                          title="Delete resume"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Tips & AI Builder Side Panel */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-3 p-4 bg-white mb-4">
            <h6 className="fw-bold text-dark mb-3">
              <i className="bi bi-lightbulb-fill text-warning me-2"></i>Tips for best results
            </h6>

            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-start gap-3">
                <div className="rounded p-2" style={{ backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                  <i className="bi bi-file-earmark-check fs-5"></i>
                </div>
                <div>
                  <h6 className="mb-1 small fw-semibold">Use an updated resume</h6>
                  <p className="text-muted small mb-0">
                    Upload your latest resume for accurate job matching and ATS scoring.
                  </p>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="rounded p-2" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                  <i className="bi bi-layers fs-5"></i>
                </div>
                <div>
                  <h6 className="mb-1 small fw-semibold">Set your primary resume</h6>
                  <p className="text-muted small mb-0">
                    Your primary resume is automatically used across Job Matching and Mock Interviews.
                  </p>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="rounded p-2" style={{ backgroundColor: '#FAF5FF', color: '#7C3AED' }}>
                  <i className="bi bi-type-h1 fs-5"></i>
                </div>
                <div>
                  <h6 className="mb-1 small fw-semibold">Keep it text-based</h6>
                  <p className="text-muted small mb-0">
                    Standard text-based PDF/DOCX layouts yield higher ATS extraction accuracy.
                  </p>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3">
                <div className="rounded p-2" style={{ backgroundColor: '#ECFDF5', color: '#10B981' }}>
                  <i className="bi bi-hdd-network fs-5"></i>
                </div>
                <div>
                  <h6 className="mb-1 small fw-semibold">File size limit</h6>
                  <p className="text-muted small mb-0">
                    Maximum allowable file size is 10MB per document.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Navigation Card */}
          <div className="card shadow-sm border-0 rounded-3 p-4 bg-white text-center">
            <i className="bi bi-stars text-primary fs-1 mb-2"></i>
            <h6 className="fw-bold mb-1">Optimize with AI Resume Builder</h6>
            <p className="text-muted small mb-3">
              Use Groq AI to rewrite weak bullet points, auto-fix ATS issues, and export a clean DOCX resume.
            </p>
            <div className="d-grid gap-2">
              <Link to="/resume-builder" className="btn btn-primary btn-sm">
                <i className="bi bi-magic me-1"></i> Open AI Resume Builder
              </Link>
              <Link to="/resume-analyzer" className="btn btn-outline-primary btn-sm">
                <i className="bi bi-bar-chart-line me-1"></i> View Full ATS Report
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Content Modal */}
      <ParsedResumeModal
        show={showModal}
        onClose={() => setShowModal(false)}
        resume={selectedResume}
      />
    </div>
  );
};

export default ResumeManagement;