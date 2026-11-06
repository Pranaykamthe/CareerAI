import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { resumeService } from '../../services/resumeService';
import ParsedResumeModal from '../../components/resumes/ParsedResumeModal';

const ResumeManagement = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedResume, setSelectedResume] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [parsingId, setParsingId] = useState(null);

  const fileInputRef = useRef(null);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const data = await resumeService.getResumes();
      setResumes(data);
    } catch (err) {
      setError('Failed to fetch resumes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;

    const validExtensions = ['pdf', 'docx'];
    const fileExt = file.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(fileExt)) {
      setError('Invalid file format. Only PDF and DOCX files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      setUploading(true);
      setUploadProgress(0);

      const newResume = await resumeService.uploadResume(file, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);
      });

      setSuccess(`"${newResume.file_name}" uploaded and parsed successfully!`);
      await fetchResumes();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.file?.[0] || 'Failed to upload and parse resume.';
      setError(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleManualParse = async (id) => {
    try {
      setParsingId(id);
      const updated = await resumeService.parseResume(id);
      setSuccess('Resume re-parsed successfully!');
      setResumes((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      setError('Failed to re-parse resume content.');
    } finally {
      setParsingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    try {
      await resumeService.deleteResume(id);
      setSuccess('Resume removed successfully.');
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError('Failed to delete resume.');
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      await resumeService.setPrimaryResume(id);
      setSuccess('Primary resume updated.');
      await fetchResumes();
    } catch (err) {
      setError('Failed to set primary resume.');
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
    <div className="min-vh-100 bg-light">
      <Navbar />

      <div className="container py-4">
        {/* Title */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold text-dark mb-1">Resume Management & Parsing</h3>
            <p className="text-muted mb-0">Upload, extract text, and verify your resume credentials</p>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError(null)}></button>
          </div>
        )}
        {success && (
          <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
          </div>
        )}

        {/* Upload Zone */}
        <div
          className="card shadow-sm p-5 mb-4 text-center bg-white"
          style={{ border: '2px dashed #CBD5E1', borderRadius: '16px' }}
        >
          <i className="bi bi-cloud-arrow-up-fill text-primary" style={{ fontSize: '3rem' }}></i>
          <h5 className="fw-bold mt-3 mb-1">Upload Your Resume for Parsing</h5>
          <p className="text-muted small mb-3">Supported formats: PDF, DOCX (Max size: 10MB)</p>

          <input
            type="file"
            ref={fileInputRef}
            className="d-none"
            accept=".pdf,.docx"
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />

          <div>
            <button
              className="btn btn-primary px-4 py-2 fw-medium"
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Uploading & Parsing ({uploadProgress}%)
                </>
              ) : (
                <>
                  <i className="bi bi-folder-symlink me-2"></i>Browse Files
                </>
              )}
            </button>
          </div>

          {uploading && (
            <div className="progress mt-3 mx-auto" style={{ maxWidth: '400px', height: '8px' }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                role="progressbar"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Resumes List */}
        <div className="card shadow-sm border-0 rounded-3 p-4 bg-white">
          <h5 className="fw-bold text-dark mb-3">
            <i className="bi bi-stack me-2 text-primary"></i>My Uploaded Documents
          </h5>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted mt-2 small">Loading documents...</p>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-file-earmark-arrow-up display-4 d-block mb-2"></i>
              No resumes uploaded yet. Upload a PDF or DOCX file to begin.
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {resumes.map((item) => (
                <div
                  key={item.id}
                  className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center py-3 px-2 border-bottom"
                >
                  <div className="d-flex align-items-center mb-2 mb-md-0">
                    <div className="me-3 p-3 bg-light rounded text-center" style={{ width: '54px' }}>
                      <i
                        className={`bi ${
                          item.file_type === 'pdf' ? 'bi-filetype-pdf text-danger' : 'bi-filetype-docx text-primary'
                        }`}
                        style={{ fontSize: '1.6rem' }}
                      ></i>
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold text-dark">{item.file_name}</span>
                        {item.is_primary && (
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
                            Primary
                          </span>
                        )}
                        <span
                          className={`badge ${
                            item.parse_status === 'parsed'
                              ? 'bg-success-subtle text-success'
                              : 'bg-warning-subtle text-warning'
                          } border`}
                        >
                          {item.parse_status || 'uploaded'}
                        </span>
                      </div>
                      <small className="text-muted d-block mt-1">
                        {formatFileSize(item.file_size)} • Uploaded on{' '}
                        {new Date(item.uploaded_at).toLocaleDateString()}
                      </small>

                      {/* Inline skills tags preview */}
                      {item.extracted_skills && item.extracted_skills.length > 0 && (
                        <div className="d-flex flex-wrap gap-1 mt-2">
                          {item.extracted_skills.slice(0, 5).map((sk, idx) => (
                            <span
                              key={idx}
                              className="badge bg-light text-secondary border"
                              style={{ fontSize: '0.75rem' }}
                            >
                              {sk}
                            </span>
                          ))}
                          {item.extracted_skills.length > 5 && (
                            <span className="badge bg-light text-muted border" style={{ fontSize: '0.75rem' }}>
                              +{item.extracted_skills.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        setSelectedResume(item);
                        setShowModal(true);
                      }}
                    >
                      <i className="bi bi-eye me-1"></i> View Parsed
                    </button>

                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleManualParse(item.id)}
                      disabled={parsingId === item.id}
                      title="Re-parse resume"
                    >
                      {parsingId === item.id ? (
                        <span className="spinner-border spinner-border-sm"></span>
                      ) : (
                        <i className="bi bi-arrow-repeat"></i>
                      )}
                    </button>

                    {!item.is_primary && (
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => handleSetPrimary(item.id)}
                        title="Set as default active resume"
                      >
                        Set Primary
                      </button>
                    )}

                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => resumeService.downloadResume(item.id, item.file_name)}
                      title="Download file"
                    >
                      <i className="bi bi-download"></i>
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(item.id)}
                      title="Delete resume"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Structured Content Modal */}
        <ParsedResumeModal
          show={showModal}
          onClose={() => setShowModal(false)}
          resume={selectedResume}
        />
      </div>
    </div>
  );
};

export default ResumeManagement;