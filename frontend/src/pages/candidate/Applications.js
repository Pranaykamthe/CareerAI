import React, { useState, useEffect } from 'react';
import { applicationService } from '../../services/applicationService';
import { jobService } from '../../services/jobService';

const COLUMNS = [
  { key: 'Saved', label: 'Saved', badgeClass: 'bg-secondary' },
  { key: 'Applied', label: 'Applied', badgeClass: 'bg-primary' },
  { key: 'Screening', label: 'Screening', badgeClass: 'bg-info text-dark' },
  { key: 'Interview', label: 'Interview', badgeClass: 'bg-warning text-dark' },
  { key: 'Offer', label: 'Offer', badgeClass: 'bg-success' },
  { key: 'Rejected', label: 'Rejected', badgeClass: 'bg-danger' },
];

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedGap, setSelectedGap] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [initialStatus, setInitialStatus] = useState('Saved');
  const [notesInput, setNotesInput] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [appsData, jobsData] = await Promise.all([
        applicationService.getApplications(),
        jobService.getJobs(),
      ]);
      setApplications(appsData);
      setAvailableJobs(jobsData);
    } catch (err) {
      setError('Failed to load job application tracker data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (appId, nextStatus) => {
    try {
      await applicationService.updateApplicationStatus(appId, nextStatus);
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: nextStatus } : app))
      );
    } catch (err) {
      alert('Failed to update application status.');
    }
  };

  const handleDelete = async (appId) => {
    if (!window.confirm('Remove this application from your tracker?')) return;
    try {
      await applicationService.deleteApplication(appId);
      setApplications((prev) => prev.filter((app) => app.id !== appId));
    } catch (err) {
      alert('Failed to delete application.');
    }
  };

  const handleInspectGap = async (jobId) => {
    setGapLoading(true);
    setSelectedGap(null);
    try {
      const data = await applicationService.getSkillGap(jobId);
      setSelectedGap(data);
    } catch (err) {
      alert('Could not compute skill gap for this position.');
    } finally {
      setGapLoading(false);
    }
  };

  const handleAddApplication = async (e) => {
    e.preventDefault();
    if (!selectedJobId) return;
    try {
      await applicationService.createOrUpdateApplication(
        parseInt(selectedJobId, 10),
        initialStatus,
        notesInput
      );
      setShowAddModal(false);
      setSelectedJobId('');
      setNotesInput('');
      await loadData();
    } catch (err) {
      console.error('Error saving application:', err.response?.data || err.message);
      alert(err.response?.data?.detail || 'Error saving application. Ensure the job exists.');
    }
  };

  const filteredApps = applications.filter((app) => {
    const titleMatch = app.job_details?.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const companyMatch = app.job_details?.company?.toLowerCase().includes(searchQuery.toLowerCase());
    return titleMatch || companyMatch;
  });

  return (
    <div className="min-vh-100 bg-light">

      <div className="container-fluid px-md-5 py-4">
        {/* Header Bar */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h3 className="fw-bold text-dark mb-1">
              <i className="bi bi-kanban text-primary me-2"></i>Job Application Tracker
            </h3>
            <p className="text-muted small mb-0">
                Track candidate application pipelines and analyze mandatory vs. preferred skill gaps.
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className="btn-group" role="group">
              <button
                className={`btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode('kanban')}
              >
                <i className="bi bi-columns-gap me-1"></i> Kanban
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode('table')}
              >
                <i className="bi bi-table me-1"></i> Table
              </button>
            </div>
            <button
              className="btn btn-sm btn-primary-custom"
              onClick={() => setShowAddModal(true)}
            >
              <i className="bi bi-plus-lg me-1"></i> Track New Job
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="card shadow-sm border-0 rounded-3 mb-4 p-3 bg-white">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Filter by job title or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-6 text-md-end text-muted small">
              Total Tracked: <span className="fw-bold text-dark">{applications.length}</span> positions
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <div className="text-muted mt-2">Loading application pipeline...</div>
          </div>
        ) : viewMode === 'kanban' ? (
          /* 6-Column Kanban Board */
          <div className="row g-3 flex-nowrap overflow-auto pb-4" style={{ minHeight: '650px' }}>
            {COLUMNS.map((col) => {
              const colApps = filteredApps.filter((a) => a.status === col.key);
              return (
                <div key={col.key} className="col-12 col-sm-6 col-md-4 col-lg-2" style={{ minWidth: '270px' }}>
                  <div className="card border-0 shadow-sm rounded-3 bg-white h-100 d-flex flex-column">
                    <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                      <span className="fw-bold text-dark small">{col.label}</span>
                      <span className={`badge rounded-pill ${col.badgeClass}`}>{colApps.length}</span>
                    </div>
                    <div className="card-body p-2 bg-light bg-opacity-50 flex-grow-1 overflow-auto">
                      {colApps.length === 0 ? (
                        <div className="text-center py-4 text-muted small">No jobs</div>
                      ) : (
                        colApps.map((app) => (
                          <div
                            key={app.id}
                            className="card border shadow-xs rounded-3 mb-2 p-3 bg-white hover-shadow transition"
                          >
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <h6 className="fw-bold text-dark mb-0 small text-truncate" style={{ maxWidth: '170px' }}>
                                {app.job_details?.title}
                              </h6>
                              <button
                                className="btn btn-link text-danger p-0 ms-1"
                                onClick={() => handleDelete(app.id)}
                                title="Remove application"
                              >
                                <i className="bi bi-x-circle"></i>
                              </button>
                            </div>
                            <div className="text-muted mb-2" style={{ fontSize: '11px' }}>
                              <i className="bi bi-building me-1"></i>
                              {app.job_details?.company}
                            </div>

                            <div className="d-flex flex-wrap gap-1 mb-2">
                              <span className="badge bg-light text-dark border" style={{ fontSize: '10px' }}>
                                {app.job_details?.location || 'Remote'}
                              </span>
                              {app.job_details?.salary_range && (
                                <span className="badge bg-success bg-opacity-10 text-success border border-success" style={{ fontSize: '10px' }}>
                                  {app.job_details?.salary_range}
                                </span>
                              )}
                            </div>

                            {app.notes && (
                              <div className="bg-light p-1 rounded small text-muted mb-2" style={{ fontSize: '11px' }}>
                                <i className="bi bi-sticky me-1"></i>
                                {app.notes}
                              </div>
                            )}

                            {/* Actions & Status Controls */}
                            <div className="pt-2 border-top d-flex justify-content-between align-items-center">
                              <button
                                className="btn btn-outline-info btn-xs py-0 px-1"
                                style={{ fontSize: '11px' }}
                                onClick={() => handleInspectGap(app.job?.id || app.job_details?.id)}
                              >
                                <i className="bi bi-lightning-charge me-1"></i>Skill Gap
                              </button>

                              <select
                                className="form-select form-select-sm py-0 px-1 border-0 bg-light"
                                style={{ width: '95px', fontSize: '11px' }}
                                value={app.status}
                                onChange={(e) => handleStatusChange(app.id, e.target.value)}
                              >
                                {COLUMNS.map((c) => (
                                  <option key={c.key} value={c.key}>
                                    {c.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Synchronized Table View */
          <div className="card border-0 shadow-sm rounded-3 bg-white overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr className="small text-muted">
                    <th>Position & Company</th>
                    <th>Package / Location</th>
                    <th>Status</th>
                    <th>Applied Date</th>
                    <th>Notes</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No applications found.
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <div className="fw-bold text-dark">{app.job_details?.title}</div>
                          <div className="text-muted small">{app.job_details?.company}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border me-1">
                            {app.job_details?.location || 'Remote'}
                          </span>
                          <span className="badge bg-success bg-opacity-10 text-success border border-success">
                            {app.job_details?.salary_range || 'Competitive'}
                          </span>
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            style={{ width: '130px' }}
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          >
                            {COLUMNS.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="small text-muted">
                          {new Date(app.applied_date).toLocaleDateString()}
                        </td>
                        <td className="small text-muted" style={{ maxWidth: '200px' }}>
                          {app.notes || <span className="fst-italic text-secondary">None</span>}
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-outline-info btn-sm me-2"
                            onClick={() => handleInspectGap(app.job?.id || app.job_details?.id)}
                          >
                            <i className="bi bi-lightning-charge me-1"></i>Skill Gap
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDelete(app.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Skill Gap Inspector Modal */}
      {(selectedGap || gapLoading) && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom py-3">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-cpu-fill text-primary me-2"></i>Skill Gap Diagnostics
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedGap(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                {gapLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status"></div>
                    <div className="text-muted mt-2">Analyzing candidate skill match...</div>
                  </div>
                ) : (
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h5 className="fw-bold mb-0 text-dark">{selectedGap?.job_title}</h5>
                        <div className="text-muted small">{selectedGap?.company}</div>
                      </div>
                      <div className="text-end">
                        <span className="badge bg-primary fs-6 px-3 py-2">
                          {selectedGap?.readiness_percentage}% Fit
                        </span>
                      </div>
                    </div>

                    {/* Mandatory Skills Assessment */}
                    <div className="card bg-light border-0 p-3 rounded-3 mb-3">
                      <h6 className="fw-bold text-dark mb-2">
                        <i className="bi bi-check2-circle text-success me-1"></i> Mandatory Requirements
                      </h6>
                      <div className="mb-2">
                        <div className="small fw-semibold text-muted mb-1">Matched Skills:</div>
                        <div className="d-flex flex-wrap gap-1">
                          {selectedGap?.matched_mandatory?.length > 0 ? (
                            selectedGap.matched_mandatory.map((s, idx) => (
                              <span key={idx} className="badge bg-success bg-opacity-10 text-success border border-success">
                                <i className="bi bi-check-lg me-1"></i>{s}
                              </span>
                            ))
                          ) : (
                            <span className="small text-muted fst-italic">No mandatory skills matched yet.</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="small fw-semibold text-danger mb-1">Missing Gaps (Required):</div>
                        <div className="d-flex flex-wrap gap-1">
                          {selectedGap?.missing_mandatory?.length > 0 ? (
                            selectedGap.missing_mandatory.map((s, idx) => (
                              <span key={idx} className="badge bg-danger bg-opacity-10 text-danger border border-danger">
                                <i className="bi bi-exclamation-triangle me-1"></i>{s}
                              </span>
                            ))
                          ) : (
                            <span className="small text-success fst-italic">All mandatory technical skills satisfied!</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Preferred Skills Assessment */}
                    <div className="card bg-light border-0 p-3 rounded-3 mb-3">
                      <h6 className="fw-bold text-dark mb-2">
                        <i className="bi bi-stars text-warning me-1"></i> Preferred & Nice-to-Have Skills
                      </h6>
                      <div className="d-flex flex-wrap gap-1">
                        {selectedGap?.missing_preferred?.length > 0 ? (
                          selectedGap.missing_preferred.map((s, idx) => (
                            <span key={idx} className="badge bg-warning bg-opacity-10 text-dark border border-warning">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="small text-muted fst-italic">No preferred skill gaps identified.</span>
                        )}
                      </div>
                    </div>

                    {/* Targeted Recommendations */}
                    <div className="border rounded-3 p-3 bg-white">
                      <h6 className="fw-bold text-dark mb-2">
                        <i className="bi bi-lightbulb text-primary me-1"></i> Action Recommendations
                      </h6>
                      <ul className="mb-0 ps-3 small text-muted">
                        {selectedGap?.recommendations?.map((rec, i) => (
                          <li key={i} className="mb-1">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-top py-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedGap(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Job To Tracker Modal */}
      {showAddModal && (
        <div className="modal show fade d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <form onSubmit={handleAddApplication}>
                <div className="modal-header border-bottom py-3">
                  <h5 className="modal-title fw-bold text-dark">Track New Position</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAddModal(false)}
                  ></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Select Position</label>
                    <select
                      className="form-select"
                      required
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                    >
                      <option value="">-- Choose a job from catalog --</option>
                      {availableJobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.title} ({j.company} - {j.location})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Initial Stage</label>
                    <select
                      className="form-select"
                      value={initialStatus}
                      onChange={(e) => setInitialStatus(e.target.value)}
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-dark">Personal Notes (Optional)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="e.g. Applied via referral; interview scheduled for next Tuesday."
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top py-2">
                  <button
                    type="button"
                    className="btn btn-light btn-sm"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-custom btn-sm">
                    Add to Tracker
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;