import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { interviewService } from '../../services/interviewService';

const InterviewHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    total_sessions: 0,
    completed_sessions: 0,
    average_score: 0,
    highest_score: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deletingId, setDeletingId] = useState(null);

  const fetchHistoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [historyRes, statsRes] = await Promise.all([
        interviewService.getHistory({
          search: searchTerm,
          type: typeFilter,
          status: statusFilter,
        }),
        interviewService.getHistoryStats(),
      ]);

      setSessions(historyRes.data || []);
      setStats(statsRes.data || {});
    } catch (err) {
      console.error('Failed to load interview history:', err);
      setError('Unable to load your interview history. Please refresh or try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, typeFilter, statusFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchHistoryData();
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchHistoryData]);

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to remove this interview session from your history?')) {
      return;
    }

    try {
      setDeletingId(sessionId);
      await interviewService.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      const statsRes = await interviewService.getHistoryStats();
      setStats(statsRes.data || {});
    } catch (err) {
      console.error('Failed to delete session:', err);
      alert('Could not delete session. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'bg-success text-white';
    if (score >= 65) return 'bg-primary text-white';
    if (score >= 50) return 'bg-warning text-dark';
    return 'bg-danger text-white';
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container-fluid py-4 px-lg-5" style={{ minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      {/* Header Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: '#0f172a' }}>
            <i className="bi bi-clock-history me-2 text-primary"></i> Interview Practice History
          </h2>
          <p className="text-muted mb-0">
            Track past mock interviews, review performance diagnostics, and monitor your progress over time.
          </p>
        </div>
        <div className="mt-3 mt-md-0 d-flex gap-2">
          <Link to="/interview-prep" className="btn btn-outline-secondary">
            <i className="bi bi-stars me-1"></i> Prep Hub
          </Link>
          <Link to="/mock-interview" className="btn btn-primary px-3 shadow-sm">
            <i className="bi bi-play-circle me-1"></i> Start New Interview
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>{error}</div>
        </div>
      )}

      {/* KPI Trend Strip */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Total Sessions</span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{stats.total_sessions || 0}</h3>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', backgroundColor: '#e0e7ff', color: '#4f46e5' }}
              >
                <i className="bi bi-camera-video fs-5"></i>
              </div>
            </div>
            <div className="mt-2 text-muted small">
              <span className="text-success fw-semibold">{stats.completed_sessions || 0}</span> completed
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Average Score</span>
                <h3 className="fw-bold text-primary mt-1 mb-0">
                  {stats.average_score ? `${stats.average_score}%` : '—'}
                </h3>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', backgroundColor: '#dbeafe', color: '#2563eb' }}
              >
                <i className="bi bi-graph-up-arrow fs-5"></i>
              </div>
            </div>
            <div className="mt-2 text-muted small">Across all completed evaluations</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Highest Score</span>
                <h3 className="fw-bold text-success mt-1 mb-0">
                  {stats.highest_score ? `${stats.highest_score}%` : '—'}
                </h3>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', backgroundColor: '#dcfce7', color: '#16a34a' }}
              >
                <i className="bi bi-trophy fs-5"></i>
              </div>
            </div>
            <div className="mt-2 text-muted small">Personal record score</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100 p-3 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold text-uppercase">Readiness Level</span>
                <h5 className="fw-bold text-dark mt-2 mb-0">
                  {stats.average_score >= 80
                    ? 'Interview Ready'
                    : stats.average_score >= 60
                    ? 'Progressing Well'
                    : 'Practice Needed'}
                </h5>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', backgroundColor: '#fef3c7', color: '#d97706' }}
              >
                <i className="bi bi-bullseye fs-5"></i>
              </div>
            </div>
            <div className="mt-2 text-muted small">Automated readiness evaluation</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 p-3 bg-white">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search by role or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select bg-light"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Technical">Technical</option>
              <option value="HR">HR & Culture</option>
              <option value="Behavioral">Behavioral (STAR)</option>
              <option value="Mixed">Mixed Practice</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select
              className="form-select bg-light"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
            </select>
          </div>

          <div className="col-12 col-md-1 text-md-end">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={fetchHistoryData}
              title="Refresh History"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Sessions Table Card */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        <div className="card-header bg-transparent py-3 px-4 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold" style={{ color: '#1e293b' }}>
            Previous Sessions ({sessions.length})
          </h5>
          <span className="badge bg-light text-secondary border">Ordered by most recent</span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-muted small text-uppercase">
              <tr>
                <th className="ps-4">Target Role & Category</th>
                <th>Difficulty</th>
                <th>Date / Time</th>
                <th>Questions</th>
                <th>Score</th>
                <th>Status</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading history...</span>
                    </div>
                    <p className="text-muted mt-2 mb-0">Retrieving session records...</p>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    <div className="my-3">
                      <i className="bi bi-journal-x fs-1 text-muted"></i>
                    </div>
                    <h5 className="fw-semibold text-secondary">No Interview Records Found</h5>
                    <p className="text-muted small">
                      {searchTerm || typeFilter !== 'All'
                        ? 'Try clearing your filters or search keywords.'
                        : "You haven't conducted any mock interviews yet."}
                    </p>
                    <Link to="/mock-interview" className="btn btn-primary btn-sm px-3 mt-1">
                      Start Your First Session
                    </Link>
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="ps-4">
                      <div className="fw-semibold text-dark">{session.role_target}</div>
                      <div className="small text-muted">
                        <span className="badge bg-light text-dark border me-1">
                          {session.session_type || 'Mixed'}
                        </span>
                        <span>{session.duration_minutes || 5} mins</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge rounded-pill ${
                          session.difficulty === 'Hard'
                            ? 'bg-danger-subtle text-danger border border-danger-subtle'
                            : session.difficulty === 'Medium'
                            ? 'bg-primary-subtle text-primary border border-primary-subtle'
                            : 'bg-success-subtle text-success border border-success-subtle'
                        }`}
                      >
                        {session.difficulty || 'Medium'}
                      </span>
                    </td>
                    <td className="small text-muted">{formatDate(session.created_at)}</td>
                    <td>
                      <span className="fw-medium text-dark">
                        {session.completed_turns_count || session.turns_count || 0}
                      </span>
                      <span className="text-muted"> / {session.turns_count || 3}</span>
                    </td>
                    <td>
                      {session.overall_score !== null && session.overall_score !== undefined ? (
                        <span className={`badge px-2 py-1 rounded-pill ${getScoreBadgeClass(session.overall_score)}`}>
                          {session.overall_score}%
                        </span>
                      ) : (
                        <span className="text-muted small">Pending</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          session.status === 'Completed'
                            ? 'bg-success-subtle text-success'
                            : 'bg-warning-subtle text-warning'
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-inline-flex gap-2">
                        {session.status === 'Completed' ? (
                          <Link
                            to={`/interview-report/${session.id}`}
                            className="btn btn-sm btn-outline-primary"
                            title="View Detailed Performance Report"
                          >
                            <i className="bi bi-file-earmark-text me-1"></i> Report
                          </Link>
                        ) : (
                          <Link
                            to="/mock-interview"
                            className="btn btn-sm btn-outline-warning"
                            title="Resume or Start Fresh Session"
                          >
                            <i className="bi bi-arrow-repeat me-1"></i> Resume
                          </Link>
                        )}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteSession(session.id)}
                          disabled={deletingId === session.id}
                          title="Delete Record"
                        >
                          {deletingId === session.id ? (
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          ) : (
                            <i className="bi bi-trash"></i>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InterviewHistory;