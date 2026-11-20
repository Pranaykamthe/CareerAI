import React, { useState, useEffect } from 'react';
import { applicationService } from '../../services/applicationService';
import { jobService } from '../../services/jobService';

const COLUMNS = [
  {
    key: 'Saved',
    label: 'Saved',
    columnBg: '#F8FAFC',
    headerBorder: '#CBD5E1',
    accentColor: '#475569',
    badgeBg: '#E2E8F0',
    badgeText: '#334155',
    icon: 'bi-bookmark-fill',
  },
  {
    key: 'Applied',
    label: 'Applied',
    columnBg: '#EFF6FF',
    headerBorder: '#BFDBFE',
    accentColor: '#2563EB',
    badgeBg: '#DBEAFE',
    badgeText: '#1D4ED8',
    icon: 'bi-send-fill',
  },
  {
    key: 'Screening',
    label: 'Screening',
    columnBg: '#FFFBEB',
    headerBorder: '#FDE68A',
    accentColor: '#D97706',
    badgeBg: '#FEF3C7',
    badgeText: '#B45309',
    icon: 'bi-telephone-inbound-fill',
  },
  {
    key: 'Interview',
    label: 'Interview',
    columnBg: '#EEF2FF',
    headerBorder: '#C7D2FE',
    accentColor: '#4F46E5',
    badgeBg: '#E0E7FF',
    badgeText: '#4338CA',
    icon: 'bi-camera-video-fill',
  },
  {
    key: 'Offer',
    label: 'Offer',
    columnBg: '#ECFDF5',
    headerBorder: '#A7F3D0',
    accentColor: '#059669',
    badgeBg: '#D1FAE5',
    badgeText: '#047857',
    icon: 'bi-award-fill',
  },
  {
    key: 'Rejected',
    label: 'Rejected',
    columnBg: '#FEF2F2',
    headerBorder: '#FECACA',
    accentColor: '#DC2626',
    badgeBg: '#FEE2E2',
    badgeText: '#B91C1C',
    icon: 'bi-x-octagon-fill',
  },
];

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
      setApplications(appsData || []);
      setAvailableJobs(jobsData || []);
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

  const openAddModalWithStage = (stage = 'Saved') => {
    setInitialStatus(stage);
    setSelectedJobId('');
    setNotesInput('');
    setShowAddModal(true);
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
    const q = searchQuery.toLowerCase();
    const titleMatch = app.job_details?.title?.toLowerCase().includes(q);
    const companyMatch = app.job_details?.company?.toLowerCase().includes(q);
    const locationMatch = app.job_details?.location?.toLowerCase().includes(q);
    const stageMatch = statusFilter === 'ALL' || app.status === statusFilter;
    return (titleMatch || companyMatch || locationMatch) && stageMatch;
  });

  // Pipeline KPIs
  const totalCount = applications.length;
  const appliedCount = applications.filter((a) => a.status === 'Applied').length;
  const screeningCount = applications.filter((a) => a.status === 'Screening').length;
  const interviewCount = applications.filter((a) => a.status === 'Interview').length;
  const offerCount = applications.filter((a) => a.status === 'Offer').length;
  const activePipelineCount = appliedCount + screeningCount + interviewCount + offerCount;
  const responseRate =
    activePipelineCount > 0
      ? Math.round(((screeningCount + interviewCount + offerCount) / activePipelineCount) * 100)
      : 0;

  const kpiCards = [
    {
      label: 'Total Tracked',
      value: totalCount,
      sub: 'All pipeline stages',
      icon: 'bi-briefcase-fill',
      iconBg: '#EEF2FF',
      iconColor: '#4F46E5',
    },
    {
      label: 'Applied',
      value: appliedCount,
      sub: 'Awaiting review',
      icon: 'bi-send-fill',
      iconBg: '#EFF6FF',
      iconColor: '#2563EB',
    },
    {
      label: 'Screening',
      value: screeningCount,
      sub: 'Recruiter calls',
      icon: 'bi-telephone-fill',
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
    },
    {
      label: 'Interviews',
      value: interviewCount,
      sub: 'Active rounds',
      icon: 'bi-people-fill',
      iconBg: '#F5F3FF',
      iconColor: '#7C3AED',
    },
    {
      label: 'Offers',
      value: offerCount,
      sub: 'Received offers',
      icon: 'bi-award-fill',
      iconBg: '#ECFDF5',
      iconColor: '#10B981',
    },
    {
      label: 'Response Rate',
      value: `${responseRate}%`,
      sub: 'Progression ratio',
      icon: 'bi-graph-up-arrow',
      iconBg: '#FDF2F8',
      iconColor: '#DB2777',
    },
  ];

  const cardStyle = {
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  };

  const getCompanyMonogram = (companyName) => {
    const clean = (companyName || 'CO').trim();
    return clean.slice(0, 2).toUpperCase();
  };

  const getStageMeta = (status) =>
    COLUMNS.find((c) => c.key === status) || COLUMNS[0];

  return (
    <div className="min-vh-100 py-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="container-fluid px-3 px-md-4 px-xl-5">
        {/* Top SaaS Header Bar */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span
                className="badge rounded-pill px-3 py-1 fw-semibold"
                style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11.5px' }}
              >
                <i className="bi bi-kanban me-1"></i> Pipeline Management
              </span>
            </div>
            <h2 className="fw-bold mb-1" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
              Job Application Tracker
            </h2>
            <p className="text-muted small mb-0">
              Track and manage all your job applications across pipeline stages and inspect role skill gaps.
            </p>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Segmented View Switcher */}
            <div
              className="p-1 rounded-3 d-inline-flex align-items-center bg-white"
              style={{ border: '1px solid #E2E8F0' }}
              role="group"
            >
              <button
                type="button"
                className="btn btn-sm fw-semibold px-3 py-1"
                style={{
                  borderRadius: '8px',
                  backgroundColor: viewMode === 'kanban' ? '#EEF2FF' : 'transparent',
                  color: viewMode === 'kanban' ? '#4F46E5' : '#64748B',
                  border: 'none',
                }}
                onClick={() => setViewMode('kanban')}
              >
                <i className="bi bi-columns-gap me-1"></i> Kanban View
              </button>
              <button
                type="button"
                className="btn btn-sm fw-semibold px-3 py-1"
                style={{
                  borderRadius: '8px',
                  backgroundColor: viewMode === 'table' ? '#EEF2FF' : 'transparent',
                  color: viewMode === 'table' ? '#4F46E5' : '#64748B',
                  border: 'none',
                }}
                onClick={() => setViewMode('table')}
              >
                <i className="bi bi-table me-1"></i> Table View
              </button>
            </div>

            <button
              type="button"
              className="btn btn-sm text-white fw-semibold px-3 py-2 shadow-sm d-inline-flex align-items-center gap-1"
              style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
              onClick={() => openAddModalWithStage('Saved')}
            >
              <i className="bi bi-plus-lg"></i> Add Application
            </button>
          </div>
        </div>

        {/* 6 Pipeline KPI Cards */}
        <div className="row g-3 mb-4">
          {kpiCards.map((kpi, idx) => (
            <div key={idx} className="col-6 col-md-4 col-xl-2">
              <div className="card bg-white h-100 p-3 hover-card" style={cardStyle}>
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                    style={{
                      width: '42px',
                      height: '42px',
                      backgroundColor: kpi.iconBg,
                      color: kpi.iconColor,
                    }}
                  >
                    <i className={`bi ${kpi.icon} fs-5`}></i>
                  </div>
                  <div className="min-w-0">
                    <div className="text-muted text-truncate" style={{ fontSize: '11.5px', fontWeight: 600 }}>
                      {kpi.label}
                    </div>
                    <div className="fw-bold fs-4 lh-sm" style={{ color: '#0F172A' }}>
                      {kpi.value}
                    </div>
                    <div className="text-muted text-truncate" style={{ fontSize: '11px' }}>
                      {kpi.sub}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Stage Filter Toolbar */}
        <div className="card bg-white p-3 mb-4" style={cardStyle}>
          <div className="row g-3 align-items-center">
            <div className="col-lg-5">
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
                  placeholder="Search by job title, company, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary border-start-0"
                    style={{ borderColor: '#E2E8F0' }}
                    onClick={() => setSearchQuery('')}
                  >
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-lg-7 d-flex flex-wrap align-items-center justify-content-lg-end gap-1">
              <button
                type="button"
                className="btn btn-sm fw-semibold px-2.5 py-1"
                style={{
                  borderRadius: '8px',
                  fontSize: '12px',
                  backgroundColor: statusFilter === 'ALL' ? '#4F46E5' : '#F8FAFC',
                  color: statusFilter === 'ALL' ? '#FFFFFF' : '#475569',
                  border: '1px solid #E2E8F0',
                }}
                onClick={() => setStatusFilter('ALL')}
              >
                All ({applications.length})
              </button>
              {COLUMNS.map((col) => {
                const count = applications.filter((a) => a.status === col.key).length;
                const active = statusFilter === col.key;
                return (
                  <button
                    key={col.key}
                    type="button"
                    className="btn btn-sm fw-semibold px-2.5 py-1"
                    style={{
                      borderRadius: '8px',
                      fontSize: '12px',
                      backgroundColor: active ? col.accentColor : '#F8FAFC',
                      color: active ? '#FFFFFF' : '#475569',
                      border: '1px solid #E2E8F0',
                    }}
                    onClick={() => setStatusFilter(col.key)}
                  >
                    {col.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger rounded-4 d-flex align-items-center justify-content-between">
            <span>
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
            </span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={loadData}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: '#4F46E5' }} role="status"></div>
            <div className="text-muted small mt-2">Loading application pipeline...</div>
          </div>
        ) : viewMode === 'kanban' ? (
          /* Color-Tinted 6-Column Kanban Board */
          <div className="row g-3 pb-4">
            {COLUMNS.map((col) => {
              const colApps = filteredApps.filter((a) => a.status === col.key);
              return (
                <div key={col.key} className="col-12 col-sm-6 col-md-4 col-xl-2">
                  <div
                    className="h-100 d-flex flex-column rounded-4 p-2.5"
                    style={{
                      backgroundColor: col.columnBg,
                      border: `1px solid ${col.headerBorder}`,
                      minHeight: '540px',
                    }}
                  >
                    {/* Lane Header */}
                    <div className="d-flex justify-content-between align-items-center px-2 py-2 mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="rounded-circle d-inline-block"
                          style={{ width: '8px', height: '8px', backgroundColor: col.accentColor }}
                        ></span>
                        <span className="fw-bold small" style={{ color: '#0F172A' }}>
                          {col.label}
                        </span>
                      </div>
                      <span
                        className="badge rounded-pill fw-bold"
                        style={{
                          backgroundColor: col.badgeBg,
                          color: col.badgeText,
                          fontSize: '11px',
                        }}
                      >
                        {colApps.length}
                      </span>
                    </div>

                    {/* Lane Cards Container */}
                    <div className="flex-grow-1 d-flex flex-column gap-2 overflow-auto px-1">
                      {colApps.length === 0 ? (
                        <div
                          className="text-center py-4 px-2 rounded-3 my-1"
                          style={{
                            border: `1px dashed ${col.headerBorder}`,
                            backgroundColor: 'rgba(255,255,255,0.55)',
                          }}
                        >
                          <div className="text-muted" style={{ fontSize: '12px' }}>
                            No jobs in {col.label}
                          </div>
                        </div>
                      ) : (
                        colApps.map((app) => (
                          <div
                            key={app.id}
                            className="bg-white rounded-3 p-3 hover-card"
                            style={{
                              border: '1px solid #E2E8F0',
                              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                            }}
                          >
                            {/* Card Top Row: Monogram + Company + Delete */}
                            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                              <div className="d-flex align-items-center gap-2 min-w-0">
                                <div
                                  className="d-inline-flex align-items-center justify-content-center rounded-2 fw-bold flex-shrink-0"
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: col.badgeBg,
                                    color: col.badgeText,
                                    fontSize: '11.5px',
                                  }}
                                >
                                  {getCompanyMonogram(app.job_details?.company)}
                                </div>
                                <div className="min-w-0">
                                  <div
                                    className="fw-bold text-dark text-truncate"
                                    style={{ fontSize: '13px' }}
                                    title={app.job_details?.title}
                                  >
                                    {app.job_details?.title}
                                  </div>
                                  <div
                                    className="text-muted text-truncate"
                                    style={{ fontSize: '11.5px' }}
                                  >
                                    {app.job_details?.company}
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                className="btn btn-link text-muted p-0 flex-shrink-0"
                                onClick={() => handleDelete(app.id)}
                                title="Remove application"
                              >
                                <i className="bi bi-trash3" style={{ fontSize: '12px' }}></i>
                              </button>
                            </div>

                            {/* Location & Package Badges */}
                            <div className="d-flex flex-wrap gap-1 mb-2">
                              <span
                                className="badge fw-medium"
                                style={{
                                  backgroundColor: '#F1F5F9',
                                  color: '#475569',
                                  fontSize: '10.5px',
                                }}
                              >
                                <i className="bi bi-geo-alt me-1"></i>
                                {app.job_details?.location || 'Remote'}
                              </span>
                              {app.job_details?.salary_range && (
                                <span
                                  className="badge fw-semibold"
                                  style={{
                                    backgroundColor: '#ECFDF5',
                                    color: '#059669',
                                    fontSize: '10.5px',
                                  }}
                                >
                                  {app.job_details?.salary_range}
                                </span>
                              )}
                            </div>

                            {/* Applied Date */}
                            {app.applied_date && (
                              <div className="text-muted mb-2" style={{ fontSize: '11px' }}>
                                <i className="bi bi-calendar3 me-1"></i>
                                Added {new Date(app.applied_date).toLocaleDateString()}
                              </div>
                            )}

                            {/* Personal Notes */}
                            {app.notes && (
                              <div
                                className="p-2 rounded-2 text-muted mb-2"
                                style={{
                                  backgroundColor: '#F8FAFC',
                                  border: '1px solid #F1F5F9',
                                  fontSize: '11px',
                                  lineHeight: 1.4,
                                }}
                              >
                                <i className="bi bi-sticky me-1 text-primary"></i>
                                {app.notes}
                              </div>
                            )}

                            {/* Footer Controls: Skill Gap Button + Stage Move Dropdown */}
                            <div className="pt-2 border-top d-flex justify-content-between align-items-center gap-1">
                              <button
                                type="button"
                                className="btn btn-sm fw-semibold py-1 px-2"
                                style={{
                                  backgroundColor: '#EEF2FF',
                                  color: '#4F46E5',
                                  borderRadius: '7px',
                                  fontSize: '11px',
                                }}
                                onClick={() => handleInspectGap(app.job?.id || app.job_details?.id)}
                              >
                                <i className="bi bi-lightning-charge-fill me-1"></i>Skill Gap
                              </button>

                              <select
                                className="form-select form-select-sm py-1 px-2 fw-medium"
                                style={{
                                  width: '96px',
                                  fontSize: '11px',
                                  backgroundColor: '#F8FAFC',
                                  borderColor: '#E2E8F0',
                                  color: '#334155',
                                  borderRadius: '7px',
                                }}
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

                    {/* Quick Add to This Stage Button */}
                    <button
                      type="button"
                      onClick={() => openAddModalWithStage(col.key)}
                      className="btn btn-sm w-100 mt-2 fw-semibold py-1.5"
                      style={{
                        color: col.accentColor,
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        border: `1px dashed ${col.headerBorder}`,
                        borderRadius: '10px',
                        fontSize: '12px',
                      }}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Add Application
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Synchronized SaaS Table View */
          <div className="card bg-white overflow-hidden" style={cardStyle}>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <tr className="small text-muted text-uppercase" style={{ fontSize: '11.5px' }}>
                    <th className="py-3 ps-4">Company &amp; Role</th>
                    <th className="py-3">Location &amp; Package</th>
                    <th className="py-3">Pipeline Stage</th>
                    <th className="py-3">Date Added</th>
                    <th className="py-3">Notes</th>
                    <th className="py-3 pe-4 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                        No applications match your current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => {
                      const stageMeta = getStageMeta(app.status);
                      return (
                        <tr key={app.id}>
                          <td className="ps-4 py-3">
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="d-inline-flex align-items-center justify-content-center rounded-3 fw-bold flex-shrink-0"
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  backgroundColor: stageMeta.badgeBg,
                                  color: stageMeta.badgeText,
                                  fontSize: '13px',
                                }}
                              >
                                {getCompanyMonogram(app.job_details?.company)}
                              </div>
                              <div>
                                <div className="fw-bold text-dark small">{app.job_details?.title}</div>
                                <div className="text-muted" style={{ fontSize: '12px' }}>
                                  {app.job_details?.company}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              <span
                                className="badge fw-medium"
                                style={{ backgroundColor: '#F1F5F9', color: '#475569' }}
                              >
                                {app.job_details?.location || 'Remote'}
                              </span>
                              <span
                                className="badge fw-semibold"
                                style={{ backgroundColor: '#ECFDF5', color: '#059669' }}
                              >
                                {app.job_details?.salary_range || 'Competitive'}
                              </span>
                            </div>
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm fw-semibold"
                              style={{
                                width: '135px',
                                backgroundColor: stageMeta.badgeBg,
                                color: stageMeta.badgeText,
                                borderColor: stageMeta.headerBorder,
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
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
                          <td className="small text-muted" style={{ maxWidth: '220px' }}>
                            {app.notes || <span className="fst-italic text-secondary">No notes</span>}
                          </td>
                          <td className="pe-4 text-end">
                            <button
                              type="button"
                              className="btn btn-sm fw-semibold me-2"
                              style={{
                                backgroundColor: '#EEF2FF',
                                color: '#4F46E5',
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
                              onClick={() => handleInspectGap(app.job?.id || app.job_details?.id)}
                            >
                              <i className="bi bi-lightning-charge-fill me-1"></i>Skill Gap
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              style={{ borderRadius: '8px' }}
                              onClick={() => handleDelete(app.id)}
                              title="Delete application"
                            >
                              <i className="bi bi-trash3"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div
              className="px-4 py-3 d-flex justify-content-between align-items-center small text-muted"
              style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}
            >
              <span>
                Showing <strong>{filteredApps.length}</strong> of <strong>{applications.length}</strong> tracked
                applications
              </span>
              <span>Synchronized with Kanban Board</span>
            </div>
          </div>
        )}
      </div>

      {/* Skill Gap Inspector Modal */}
      {(selectedGap || gapLoading) && (
        <div
          className="modal show fade d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-white border-bottom px-4 py-3">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-3"
                    style={{ width: '36px', height: '36px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                  >
                    <i className="bi bi-cpu-fill fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">Skill Gap Diagnostics</h5>
                    <div className="text-muted" style={{ fontSize: '12px' }}>
                      Mandatory vs. preferred skill alignment report
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedGap(null)}
                ></button>
              </div>

              <div className="modal-body p-4" style={{ backgroundColor: '#F8FAFC' }}>
                {gapLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border" style={{ color: '#4F46E5' }} role="status"></div>
                    <div className="text-muted small mt-2">Analyzing candidate skill match...</div>
                  </div>
                ) : (
                  <div>
                    {/* Top Role & Readiness Score Banner */}
                    <div
                      className="bg-white p-3 p-md-4 rounded-4 mb-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3"
                      style={{ border: '1px solid #E2E8F0' }}
                    >
                      <div>
                        <span
                          className="badge rounded-pill px-2 py-1 mb-1 fw-semibold"
                          style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11px' }}
                        >
                          Target Role
                        </span>
                        <h5 className="fw-bold mb-0 text-dark">{selectedGap?.job_title}</h5>
                        <div className="text-muted small">{selectedGap?.company}</div>
                      </div>

                      <div
                        className="px-4 py-2 rounded-4 text-center"
                        style={{ backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE' }}
                      >
                        <div className="fw-bold fs-3 lh-1" style={{ color: '#4F46E5' }}>
                          {selectedGap?.readiness_percentage}%
                        </div>
                        <div className="fw-semibold small" style={{ color: '#4338CA' }}>
                          Role Fit Score
                        </div>
                      </div>
                    </div>

                    {/* Mandatory Skills Assessment */}
                    <div className="bg-white p-4 rounded-4 mb-3" style={{ border: '1px solid #E2E8F0' }}>
                      <h6 className="fw-bold text-dark mb-3">
                        <i className="bi bi-check2-circle text-success me-2"></i>
                        Mandatory Requirements
                      </h6>
                      <div className="mb-3">
                        <div className="small fw-semibold text-muted mb-2">Matched Skills:</div>
                        <div className="d-flex flex-wrap gap-2">
                          {selectedGap?.matched_mandatory?.length > 0 ? (
                            selectedGap.matched_mandatory.map((s, idx) => (
                              <span
                                key={idx}
                                className="badge rounded-pill px-3 py-1.5 fw-medium"
                                style={{
                                  backgroundColor: '#ECFDF5',
                                  color: '#059669',
                                  border: '1px solid #A7F3D0',
                                }}
                              >
                                <i className="bi bi-check-lg me-1"></i>
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="small text-muted fst-italic">No mandatory skills matched yet.</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="small fw-semibold text-danger mb-2">Missing Gaps (Required):</div>
                        <div className="d-flex flex-wrap gap-2">
                          {selectedGap?.missing_mandatory?.length > 0 ? (
                            selectedGap.missing_mandatory.map((s, idx) => (
                              <span
                                key={idx}
                                className="badge rounded-pill px-3 py-1.5 fw-medium"
                                style={{
                                  backgroundColor: '#FEF2F2',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                }}
                              >
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="small text-success fw-medium">
                              All mandatory technical skills satisfied!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Preferred Skills Assessment */}
                    <div className="bg-white p-4 rounded-4 mb-3" style={{ border: '1px solid #E2E8F0' }}>
                      <h6 className="fw-bold text-dark mb-2">
                        <i className="bi bi-stars text-warning me-2"></i>
                        Preferred &amp; Nice-to-Have Skills
                      </h6>
                      <div className="d-flex flex-wrap gap-2">
                        {selectedGap?.missing_preferred?.length > 0 ? (
                          selectedGap.missing_preferred.map((s, idx) => (
                            <span
                              key={idx}
                              className="badge rounded-pill px-3 py-1.5 fw-medium"
                              style={{
                                backgroundColor: '#FFFBEB',
                                color: '#B45309',
                                border: '1px solid #FDE68A',
                              }}
                            >
                              + {s}
                            </span>
                          ))
                        ) : (
                          <span className="small text-muted fst-italic">No preferred skill gaps identified.</span>
                        )}
                      </div>
                    </div>

                    {/* Targeted Recommendations */}
                    <div className="bg-white p-4 rounded-4" style={{ border: '1px solid #E2E8F0' }}>
                      <h6 className="fw-bold text-dark mb-2">
                        <i className="bi bi-lightbulb-fill me-2" style={{ color: '#4F46E5' }}></i>
                        Action Recommendations
                      </h6>
                      <ul className="mb-0 ps-3 small text-muted">
                        {selectedGap?.recommendations?.map((rec, i) => (
                          <li key={i} className="mb-1">
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-white border-top px-4 py-3">
                <button
                  type="button"
                  className="btn btn-sm fw-semibold px-4"
                  style={{ backgroundColor: '#F1F5F9', color: '#334155', borderRadius: '8px' }}
                  onClick={() => setSelectedGap(null)}
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Job To Tracker Modal */}
      {showAddModal && (
        <div
          className="modal show fade d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <form onSubmit={handleAddApplication}>
                <div className="modal-header bg-white border-bottom px-4 py-3">
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-3"
                      style={{ width: '34px', height: '34px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                    >
                      <i className="bi bi-plus-circle-fill"></i>
                    </div>
                    <h5 className="modal-title fw-bold text-dark mb-0">Track New Position</h5>
                  </div>
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
                    <label className="form-label small fw-semibold text-dark">Initial Pipeline Stage</label>
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

                  <div className="mb-0">
                    <label className="form-label small fw-semibold text-dark">
                      Personal Notes (Optional)
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="e.g. Applied via referral; technical interview scheduled for next Tuesday."
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light border-top px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-sm bg-white fw-semibold px-3"
                    style={{ border: '1px solid #CBD5E1', color: '#475569', borderRadius: '8px' }}
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-sm text-white fw-semibold px-4"
                    style={{ backgroundColor: '#4F46E5', borderRadius: '8px' }}
                  >
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