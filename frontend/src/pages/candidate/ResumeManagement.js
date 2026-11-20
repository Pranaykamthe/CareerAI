import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { resumeService } from '../../services/resumeService';
import ParsedResumeModal from '../../components/resumes/ParsedResumeModal';

const PIPELINE_STEPS = [
  { step: 1, icon: 'bi-cloud-arrow-up', title: 'Uploading', desc: 'Secure file transfer' },
  { step: 2, icon: 'bi-file-earmark-text', title: 'Extracting Text', desc: 'PDF / DOCX parsing' },
  { step: 3, icon: 'bi-cpu', title: 'Structuring Data', desc: 'Skills & sections' },
  { step: 4, icon: 'bi-speedometer2', title: 'ATS Scoring', desc: 'Compatibility check' },
  { step: 5, icon: 'bi-check2-circle', title: 'Ready', desc: 'Available for matching' },
];

const ResumeManagement = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activePipelineStep, setActivePipelineStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedResumeForModal, setSelectedResumeForModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [parsingId, setParsingId] = useState(null);

  const fileInputRef = useRef(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchResumes = async () => {
    setLoading(true);
    try {
      const data = await resumeService.getResumes();
      setResumes(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      showToast('danger', 'Failed to load uploaded resumes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const validateAndUpload = async (file) => {
    if (!file) return;
    const validExtensions = ['.pdf', '.docx'];
    const lowerName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValidExt) {
      showToast('danger', 'Unsupported format. Please upload a PDF (.pdf) or Word (.docx) file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('danger', 'File exceeds the 10MB maximum upload size.');
      return;
    }

    setUploading(true);
    setUploadProgress(15);
    setActivePipelineStep(1);

    try {
      await resumeService.uploadResume(file, (progressEvent) => {
        if (progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(pct);
          if (pct >= 40) setActivePipelineStep(2);
          if (pct >= 75) setActivePipelineStep(3);
        }
      });

      setActivePipelineStep(4);
      await fetchResumes();
      setActivePipelineStep(5);
      showToast('success', `"${file.name}" uploaded, parsed, and ready for ATS analysis!`);
    } catch (err) {
      showToast('danger', err.response?.data?.detail || 'Resume upload failed. Please try again.');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setActivePipelineStep(0);
      }, 900);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    validateAndUpload(file);
  };

  const handleSetPrimary = async (id) => {
    try {
      await resumeService.setPrimaryResume(id);
      await fetchResumes();
      showToast('success', 'Primary resume updated for job matching.');
    } catch (err) {
      showToast('danger', 'Could not update primary resume.');
    }
  };

  const handleReparse = async (id) => {
    setParsingId(id);
    try {
      await resumeService.parseResume(id);
      await fetchResumes();
      showToast('success', 'Resume re-parsed and structured fields refreshed.');
    } catch (err) {
      showToast('danger', 'Failed to re-parse resume.');
    } finally {
      setParsingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await resumeService.deleteResume(deleteTarget.id);
      setResumes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      showToast('success', 'Resume deleted permanently.');
    } catch (err) {
      showToast('danger', 'Failed to delete resume.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const cardStyle = {
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  };

  const getCleanFilename = (resume) => {
    if (resume.filename) return resume.filename;
    if (resume.file) return resume.file.split('/').pop();
    return `Resume_${resume.id}.pdf`;
  };

  return (
    <div className="py-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="container">
        {/* Inline Toast Banner */}
        {toast && (
          <div
            className={`alert alert-${toast.type} d-flex align-items-center justify-content-between rounded-4 shadow-sm mb-4`}
            role="alert"
          >
            <div className="small fw-semibold">
              <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
              {toast.message}
            </div>
            <button type="button" className="btn-close btn-sm" onClick={() => setToast(null)}></button>
          </div>
        )}

        {/* Top Page Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <span
              className="badge rounded-pill px-3 py-1 fw-semibold mb-1"
              style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11.5px' }}
            >
              <i className="bi bi-folder2-open me-1"></i> Resume Studio
            </span>
            <h2 className="fw-bold mb-1" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
              My Resumes &amp; Document Parser
            </h2>
            <p className="text-muted small mb-0">
              Upload existing PDF/DOCX resumes for automated parsing or build a tailored resume from scratch.
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <Link
              to="/resume-builder"
              className="btn btn-sm bg-white fw-semibold px-3 py-2"
              style={{ border: '1px solid #CBD5E1', color: '#334155', borderRadius: '10px' }}
            >
              <i className="bi bi-magic me-1" style={{ color: '#4F46E5' }}></i> Create From Scratch
            </Link>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-sm text-white fw-semibold px-3 py-2 shadow-sm"
              style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
            >
              <i className="bi bi-cloud-arrow-up-fill me-1"></i> Upload Resume
            </button>
          </div>
        </div>

        {/* Upload Dropzone + Tips Side Card */}
        <div className="row g-4 mb-4">
          <div className="col-lg-8">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className="bg-white p-4 p-md-5 text-center rounded-4 h-100 d-flex flex-column justify-content-center align-items-center"
              style={{
                border: isDragging ? '2px dashed #4F46E5' : '2px dashed #CBD5E1',
                backgroundColor: isDragging ? '#EEF2FF' : '#FFFFFF',
                cursor: uploading ? 'wait' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                className="d-none"
                onChange={(e) => validateAndUpload(e.target.files?.[0])}
              />

              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{ width: '64px', height: '64px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}
              >
                <i className="bi bi-cloud-arrow-up-fill fs-2"></i>
              </div>

              <h5 className="fw-bold text-dark mb-1">Drag &amp; Drop your resume here</h5>
              <p className="text-muted small mb-3">
                or click to browse files from your computer
              </p>

              <button
                type="button"
                disabled={uploading}
                className="btn text-white fw-semibold px-4 py-2 mb-3 shadow-sm"
                style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
              >
                {uploading ? 'Processing Document...' : 'Browse Files'}
              </button>

              <div className="d-flex flex-wrap justify-content-center gap-3 small text-muted">
                <span>
                  <i className="bi bi-file-earmark-check text-success me-1"></i> Supported: PDF, DOCX
                </span>
                <span>•</span>
                <span>
                  <i className="bi bi-hdd text-primary me-1"></i> Max file size: 10MB
                </span>
              </div>

              {uploading && (
                <div className="w-100 mt-4" style={{ maxWidth: '420px' }}>
                  <div className="d-flex justify-content-between small fw-semibold mb-1">
                    <span style={{ color: '#4F46E5' }}>Uploading &amp; Extracting Content...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="progress" style={{ height: '7px', backgroundColor: '#E2E8F0' }}>
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated"
                      style={{ width: `${uploadProgress}%`, backgroundColor: '#4F46E5' }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Tips Card */}
          <div className="col-lg-4">
            <div className="card bg-white p-4 h-100" style={cardStyle}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h6 className="fw-bold text-dark mb-0">Tips for Best Results</h6>
                <span
                  className="badge rounded-pill px-2 py-1"
                  style={{ backgroundColor: '#ECFDF5', color: '#059669', fontSize: '11px' }}
                >
                  <i className="bi bi-shield-lock-fill me-1"></i> Secure
                </span>
              </div>

              <div className="d-flex flex-column gap-3 small">
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                    style={{ width: '34px', height: '34px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                  >
                    <i className="bi bi-file-text"></i>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark">Keep It Text-Based</div>
                    <div className="text-muted" style={{ fontSize: '12px' }}>
                      Standard selectable PDFs or DOCX files yield highest skill extraction accuracy.
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                    style={{ width: '34px', height: '34px', backgroundColor: '#ECFDF5', color: '#10B981' }}
                  >
                    <i className="bi bi-star-fill"></i>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark">Set a Primary Resume</div>
                    <div className="text-muted" style={{ fontSize: '12px' }}>
                      Your active primary resume powers automated job compatibility scores.
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                    style={{ width: '34px', height: '34px', backgroundColor: '#F5F3FF', color: '#7C3AED' }}
                  >
                    <i className="bi bi-stars"></i>
                  </div>
                  <div>
                    <div className="fw-semibold text-dark">Optimize With AI</div>
                    <div className="text-muted" style={{ fontSize: '12px' }}>
                      Run the ATS Analyzer after uploading to identify missing keywords.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5-Step Upload & Analysis Pipeline Strip */}
        <div className="card bg-white p-4 mb-4" style={cardStyle}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold text-dark mb-0">Document Parsing &amp; ATS Pipeline</h6>
            <span className="text-muted" style={{ fontSize: '12px' }}>
              Automated extraction engine
            </span>
          </div>
          <div className="row g-2">
            {PIPELINE_STEPS.map((item) => {
              const isDone = activePipelineStep >= item.step || (!uploading && resumes.length > 0);
              return (
                <div key={item.step} className="col-6 col-sm-4 col-lg">
                  <div
                    className="p-3 rounded-4 text-center h-100"
                    style={{
                      backgroundColor: isDone ? '#EEF2FF' : '#F8FAFC',
                      border: `1px solid ${isDone ? '#C7D2FE' : '#E2E8F0'}`,
                    }}
                  >
                    <div
                      className="mx-auto d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
                      style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: isDone ? '#4F46E5' : '#E2E8F0',
                        color: isDone ? '#FFFFFF' : '#64748B',
                      }}
                    >
                      <i className={`bi ${item.icon}`}></i>
                    </div>
                    <div className="fw-bold text-dark" style={{ fontSize: '12.5px' }}>
                      {item.step}. {item.title}
                    </div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Uploaded Resumes Repository List */}
        <div className="card bg-white p-4" style={cardStyle}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold text-dark mb-0">Uploaded Resumes ({resumes.length})</h5>
              <small className="text-muted">Manage versions, inspect parsed sections, or run ATS audits</small>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: '#4F46E5' }} role="status"></div>
              <div className="text-muted small mt-2">Loading your resumes...</div>
            </div>
          ) : resumes.length === 0 ? (
            <div
              className="text-center py-5 rounded-4"
              style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1' }}
            >
              <i className="bi bi-file-earmark-plus fs-1 text-muted"></i>
              <h6 className="fw-bold text-dark mt-2 mb-1">No resumes uploaded yet</h6>
              <p className="text-muted small mb-3">
                Upload a PDF or DOCX resume above, or create one from scratch in the AI Resume Builder.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-sm text-white fw-semibold px-4 py-2"
                style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
              >
                Upload Your First Resume
              </button>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {resumes.map((resume) => {
                const fileName = getCleanFilename(resume);
                const isPrimary = Boolean(resume.is_primary || resume.is_default);
                const atsScore = resume.analysis?.ats_score ?? resume.ats_score ?? null;
                const skillsCount = resume.parsed_data?.skills?.length || 0;

                return (
                  <div
                    key={resume.id}
                    className="p-3 p-md-4 rounded-4 hover-card"
                    style={{
                      backgroundColor: isPrimary ? '#F8FAFF' : '#FFFFFF',
                      border: `1px solid ${isPrimary ? '#C7D2FE' : '#E2E8F0'}`,
                    }}
                  >
                    <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
                      {/* Left File Info */}
                      <div className="d-flex align-items-start gap-3">
                        <div
                          className="d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                          style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: fileName.endsWith('.pdf') ? '#FEF2F2' : '#EFF6FF',
                            color: fileName.endsWith('.pdf') ? '#DC2626' : '#2563EB',
                          }}
                        >
                          <i
                            className={`bi ${
                              fileName.endsWith('.pdf') ? 'bi-file-earmark-pdf-fill' : 'bi-file-earmark-word-fill'
                            } fs-4`}
                          ></i>
                        </div>

                        <div>
                          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                            <h6 className="fw-bold text-dark mb-0">{fileName}</h6>
                            {isPrimary && (
                              <span
                                className="badge rounded-pill px-2.5 py-1 fw-semibold"
                                style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11px' }}
                              >
                                <i className="bi bi-star-fill me-1"></i> Primary
                              </span>
                            )}
                            <span
                              className="badge rounded-pill px-2.5 py-1 fw-medium"
                              style={{ backgroundColor: '#ECFDF5', color: '#059669', fontSize: '11px' }}
                            >
                              {skillsCount} Skills Extracted
                            </span>
                          </div>
                          <div className="text-muted small">
                            Uploaded on {new Date(resume.created_at || resume.uploaded_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Right ATS Badge + Action Controls */}
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        {atsScore !== null && (
                          <div
                            className="px-3 py-1 rounded-3 text-center me-2"
                            style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}
                          >
                            <div className="fw-bold small" style={{ color: '#059669' }}>
                              ATS: {atsScore}/100
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedResumeForModal(resume)}
                          className="btn btn-sm fw-semibold"
                          style={{ backgroundColor: '#F1F5F9', color: '#334155', borderRadius: '8px' }}
                        >
                          <i className="bi bi-eye me-1"></i> Parsed Data
                        </button>

                        <Link
                          to={`/resume-analyzer?resumeId=${resume.id}`}
                          className="btn btn-sm fw-semibold"
                          style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '8px' }}
                        >
                          <i className="bi bi-speedometer2 me-1"></i> ATS Audit
                        </Link>

                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(resume.id)}
                            className="btn btn-sm bg-white fw-medium"
                            style={{ border: '1px solid #CBD5E1', color: '#475569', borderRadius: '8px' }}
                          >
                            Set Primary
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={parsingId === resume.id}
                          onClick={() => handleReparse(resume.id)}
                          className="btn btn-sm bg-white"
                          style={{ border: '1px solid #E2E8F0', color: '#475569', borderRadius: '8px' }}
                          title="Re-parse resume"
                        >
                          <i className={`bi ${parsingId === resume.id ? 'bi-hourglass-split' : 'bi-arrow-repeat'}`}></i>
                        </button>

                        <button
                          type="button"
                          onClick={() => resumeService.downloadResume(resume.id, fileName)}
                          className="btn btn-sm bg-white"
                          style={{ border: '1px solid #E2E8F0', color: '#475569', borderRadius: '8px' }}
                          title="Download file"
                        >
                          <i className="bi bi-download"></i>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ id: resume.id, name: fileName })}
                          className="btn btn-sm btn-outline-danger"
                          style={{ borderRadius: '8px' }}
                          title="Delete resume"
                        >
                          <i className="bi bi-trash3"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Parsed Content Inspection Modal */}
      {selectedResumeForModal && (
        <ParsedResumeModal
          resume={selectedResumeForModal}
          onClose={() => setSelectedResumeForModal(null)}
        />
      )}

      {/* Custom Delete Confirmation Dialog (Matches Reference Image 37) */}
      {deleteTarget && (
        <div
          className="modal show fade d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow-lg rounded-4 p-4 text-center">
              <div
                className="mx-auto d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{ width: '52px', height: '52px', backgroundColor: '#FEF2F2', color: '#EF4444' }}
              >
                <i className="bi bi-exclamation-triangle-fill fs-4"></i>
              </div>
              <h5 className="fw-bold text-dark mb-1">Delete this resume?</h5>
              <p className="text-muted small mb-4">
                This action cannot be undone. This will permanently delete <strong>{deleteTarget.name}</strong>.
              </p>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="btn btn-sm w-50 fw-semibold py-2"
                  style={{ backgroundColor: '#F1F5F9', color: '#334155', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="btn btn-danger btn-sm w-50 fw-semibold py-2"
                  style={{ borderRadius: '10px' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeManagement;