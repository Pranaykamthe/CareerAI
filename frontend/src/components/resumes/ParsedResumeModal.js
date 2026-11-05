import React from 'react';

const ParsedResumeModal = ({ show, onClose, resume }) => {
  if (!show || !resume) return null;

  const parsed = resume.parsed_data || {};
  const contact = parsed.contact || {};
  const skills = parsed.skills || [];
  const sections = parsed.sections || {};

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
          
          {/* Header */}
          <div className="modal-header border-bottom px-4 py-3 bg-light" style={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
            <div>
              <h5 className="modal-title fw-bold text-dark mb-1">
                <i className="bi bi-file-earmark-check-fill text-primary me-2"></i>
                Parsed Content: {resume.file_name}
              </h5>
              <span className={`badge ${resume.parse_status === 'parsed' ? 'bg-success' : 'bg-warning'} px-2 py-1`}>
                Status: {resume.parse_status.toUpperCase()}
              </span>
            </div>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            {resume.parse_status === 'failed' ? (
              <div className="alert alert-danger">
                <i className="bi bi-exclamation-octagon-fill me-2"></i>
                Parsing failed: {parsed.error || 'Unable to extract text from document.'}
              </div>
            ) : (
              <>
                {/* Contact Information Bar */}
                <div className="card-custom p-3 mb-4 bg-light">
                  <h6 className="fw-bold text-muted small text-uppercase mb-2">Identified Contact Details</h6>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <span className="text-muted small d-block">Email</span>
                      <strong className="text-dark">{contact.email || 'Not detected'}</strong>
                    </div>
                    <div className="col-md-6">
                      <span className="text-muted small d-block">Phone</span>
                      <strong className="text-dark">{contact.phone || 'Not detected'}</strong>
                    </div>
                    {contact.github && (
                      <div className="col-md-6 mt-2">
                        <span className="text-muted small d-block">GitHub</span>
                        <a href={contact.github} target="_blank" rel="noreferrer" className="text-primary text-decoration-none small">
                          {contact.github}
                        </a>
                      </div>
                    )}
                    {contact.linkedin && (
                      <div className="col-md-6 mt-2">
                        <span className="text-muted small d-block">LinkedIn</span>
                        <a href={contact.linkedin} target="_blank" rel="noreferrer" className="text-primary text-decoration-none small">
                          {contact.linkedin}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Extracted Skills Section */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold text-dark mb-0">Extracted Skills ({skills.length})</h6>
                    <small className="text-muted">Normalized against skill dictionary</small>
                  </div>
                  {skills.length > 0 ? (
                    <div className="d-flex flex-wrap gap-2 pt-1">
                      {skills.map((skill, index) => (
                        <span 
                          key={index} 
                          className="badge" 
                          style={{ 
                            backgroundColor: '#EEF2FF', 
                            color: '#4F46E5', 
                            fontSize: '0.85rem', 
                            padding: '6px 12px', 
                            borderRadius: '20px',
                            border: '1px solid #C7D2FE'
                          }}
                        >
                          <i className="bi bi-check-circle-fill me-1" style={{ fontSize: '0.75rem' }}></i>
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted small mb-0">No recognized technical skills found.</p>
                  )}
                </div>

                {/* Document Statistics */}
                <div className="row g-3 mb-4">
                  <div className="col-6 col-md-3">
                    <div className="p-2 border rounded text-center">
                      <small className="text-muted d-block">Word Count</small>
                      <span className="fw-bold text-primary">{parsed.word_count || 0}</span>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-2 border rounded text-center">
                      <small className="text-muted d-block">Characters</small>
                      <span className="fw-bold text-dark">{parsed.character_count || 0}</span>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-2 border rounded text-center">
                      <small className="text-muted d-block">Format</small>
                      <span className="fw-bold text-uppercase">{resume.file_type}</span>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-2 border rounded text-center">
                      <small className="text-muted d-block">Sections Found</small>
                      <span className="fw-bold text-success">{Object.keys(sections).length}</span>
                    </div>
                  </div>
                </div>

                {/* Extracted Sections Preview */}
                <div>
                  <h6 className="fw-bold text-dark mb-3">Segmented Sections</h6>
                  {Object.entries(sections).map(([sectionTitle, content]) => (
                    <div key={sectionTitle} className="mb-3 border rounded p-3 bg-white">
                      <h6 className="fw-bold text-primary text-capitalize border-bottom pb-2 mb-2">
                        {sectionTitle}
                      </h6>
                      <pre 
                        className="text-muted small mb-0" 
                        style={{ 
                          whiteSpace: 'pre-wrap', 
                          fontFamily: 'inherit',
                          maxHeight: '120px', 
                          overflowY: 'auto' 
                        }}
                      >
                        {content}
                      </pre>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer border-top px-4 py-2 bg-light">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close Preview
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ParsedResumeModal;