import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Data States
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  const [jobs, setJobs] = useState([]);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: 'Remote',
    job_type: 'Full-time',
    experience_level: 'Entry Level',
    min_experience_years: 1,
    salary_range: '6 - 10 LPA',
    description: '',
    required_skills: '',
  });

  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({
    category: 'Technical',
    role_target: 'Software Engineer',
    difficulty: 'Medium',
    question_text: '',
    ideal_points: '',
    sample_answer: '',
  });

  const handleSignOut = () => {
    logout();
    navigate('/admin-login');
  };

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [overviewData, usersData, jobsData, questionsData] = await Promise.all([
        adminService.getOverview(),
        adminService.getUsers(),
        adminService.getJobs(),
        adminService.getQuestions(),
      ]);
      setOverview(overviewData);
      setUsers(usersData);
      setJobs(jobsData);
      setQuestions(questionsData);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to load administrator telemetry. Ensure your account has Admin privileges.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // --- User Management Handlers ---
  const handleToggleUserStatus = async (targetUser) => {
    try {
      const updated = await adminService.updateUser(targetUser.id, {
        is_active: !targetUser.is_active,
      });
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
      showToast(`User ${targetUser.email} is now ${updated.is_active ? 'Active' : 'Suspended'}.`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update user status.');
    }
  };

  const handleToggleUserRole = async (targetUser) => {
    const nextRole = targetUser.role === 'admin' ? 'candidate' : 'admin';
    try {
      const updated = await adminService.updateUser(targetUser.id, { role: nextRole });
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
      showToast(`Updated ${targetUser.email} role to ${nextRole.toUpperCase()}.`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update user role.');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Permanently delete user ${targetUser.email}?`)) return;
    try {
      await adminService.deleteUser(targetUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      showToast(`Deleted user ${targetUser.email}.`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to delete user.');
    }
  };

  // --- Job Management Handlers ---
  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newJob,
        min_experience_years: Number(newJob.min_experience_years) || 0,
        required_skills: newJob.required_skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const created = await adminService.createJob(payload);
      setJobs((prev) => [created, ...prev]);
      setNewJob({
        title: '',
        company: '',
        location: 'Remote',
        job_type: 'Full-time',
        experience_level: 'Entry Level',
        min_experience_years: 1,
        salary_range: '6 - 10 LPA',
        description: '',
        required_skills: '',
      });
      showToast(`Job "${created.title}" published.`);
    } catch (err) {
      setError('Failed to create job posting. Verify all fields.');
    }
  };

  const handleToggleJobActive = async (job) => {
    try {
      const updated = await adminService.updateJob(job.id, { is_active: !job.is_active });
      setJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
      showToast(`Job "${job.title}" marked ${updated.is_active ? 'Active' : 'Archived'}.`);
    } catch (err) {
      setError('Failed to update job status.');
    }
  };

  const handleDeleteJob = async (job) => {
    if (!window.confirm(`Delete job "${job.title}"?`)) return;
    try {
      await adminService.deleteJob(job.id);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      showToast(`Deleted job "${job.title}".`);
    } catch (err) {
      setError('Failed to delete job.');
    }
  };

  // --- Question Bank Management Handlers ---
  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newQuestion,
        ideal_points: newQuestion.ideal_points
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean),
      };
      const created = await adminService.createQuestion(payload);
      setQuestions((prev) => [created, ...prev]);
      setNewQuestion({
        category: 'Technical',
        role_target: 'Software Engineer',
        difficulty: 'Medium',
        question_text: '',
        ideal_points: '',
        sample_answer: '',
      });
      showToast('Interview question added to Question Bank.');
    } catch (err) {
      setError('Failed to add question.');
    }
  };

  const handleDeleteQuestion = async (q) => {
    if (!window.confirm('Delete this question from the Question Bank?')) return;
    try {
      await adminService.deleteQuestion(q.id);
      setQuestions((prev) => prev.filter((item) => item.id !== q.id));
      showToast('Question removed.');
    } catch (err) {
      setError('Failed to delete question.');
    }
  };

  if (loading) {
    return (
      <div
        className="min-vh-100 d-flex flex-column justify-content-center align-items-center"
        style={{ backgroundColor: '#F8FAFC' }}
      >
        <div className="spinner-border" style={{ color: '#4F46E5' }} role="status" />
        <p className="text-muted small mt-3">Loading CareerAI Admin Control Panel...</p>
      </div>
    );
  }

  const kpis = overview?.kpis || {};
  const health = overview?.system_health || {};

  // Chart configurations
  const questionChartData = {
    labels: (overview?.charts?.question_categories || []).map((c) => c.category),
    datasets: [
      {
        data: (overview?.charts?.question_categories || []).map((c) => c.count),
        backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#06B6D4'],
        borderWidth: 0,
      },
    ],
  };

  const applicationChartData = {
    labels: (overview?.charts?.application_statuses || []).map((s) => s.status),
    datasets: [
      {
        label: 'Applications',
        data: (overview?.charts?.application_statuses || []).map((s) => s.count),
        backgroundColor: '#4F46E5',
        borderRadius: 8,
      },
    ],
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter ? u.role === userRoleFilter : true;
    return matchesSearch && matchesRole;
  });

  const cardStyle = {
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  };

  return (
    <div className="d-flex min-vh-100" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Dedicated Sticky Dark Admin Sidebar (Desktop >= 992px) */}
      <aside
        className="d-none d-lg-flex flex-column justify-content-between p-3 text-white flex-shrink-0 sticky-top vh-100"
        style={{ width: '260px', backgroundColor: '#0B0F19', borderRight: '1px solid #1E293B' }}
      >
        <div>
          {/* Admin Brand Header */}
          <div className="d-flex align-items-center gap-2 px-2 py-3 mb-3 border-bottom border-secondary border-opacity-25">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-3"
              style={{ width: '36px', height: '36px', backgroundColor: '#4F46E5' }}
            >
              <i className="bi bi-shield-lock-fill text-white"></i>
            </div>
            <div>
              <div className="fw-bold lh-1">CareerAI</div>
              <small className="text-secondary" style={{ fontSize: '11px' }}>
                Admin Control Panel
              </small>
            </div>
          </div>

          {/* Admin-Only Navigation */}
          <div
            className="text-uppercase text-secondary fw-semibold px-2 mb-2"
            style={{ fontSize: '11px', letterSpacing: '0.05em' }}
          >
            Platform Control
          </div>
          <ul className="nav flex-column gap-1">
            <li className="nav-item">
              <button
                className={`btn w-100 text-start d-flex align-items-center gap-2 px-3 py-2 ${
                  activeTab === 'overview' ? 'text-white fw-semibold' : 'text-secondary'
                }`}
                style={{
                  backgroundColor: activeTab === 'overview' ? '#1E1B4B' : 'transparent',
                  borderRadius: '10px',
                }}
                onClick={() => setActiveTab('overview')}
              >
                <i
                  className="bi bi-speedometer2"
                  style={{ color: activeTab === 'overview' ? '#6366F1' : undefined }}
                ></i>
                Dashboard & Health
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`btn w-100 text-start d-flex align-items-center justify-content-between px-3 py-2 ${
                  activeTab === 'users' ? 'text-white fw-semibold' : 'text-secondary'
                }`}
                style={{
                  backgroundColor: activeTab === 'users' ? '#1E1B4B' : 'transparent',
                  borderRadius: '10px',
                }}
                onClick={() => setActiveTab('users')}
              >
                <span>
                  <i
                    className="bi bi-people me-2"
                    style={{ color: activeTab === 'users' ? '#6366F1' : undefined }}
                  ></i>
                  User Management
                </span>
                <span className="badge bg-secondary bg-opacity-25 text-light">{users.length}</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`btn w-100 text-start d-flex align-items-center justify-content-between px-3 py-2 ${
                  activeTab === 'jobs' ? 'text-white fw-semibold' : 'text-secondary'
                }`}
                style={{
                  backgroundColor: activeTab === 'jobs' ? '#1E1B4B' : 'transparent',
                  borderRadius: '10px',
                }}
                onClick={() => setActiveTab('jobs')}
              >
                <span>
                  <i
                    className="bi bi-briefcase me-2"
                    style={{ color: activeTab === 'jobs' ? '#6366F1' : undefined }}
                  ></i>
                  Job Catalog
                </span>
                <span className="badge bg-secondary bg-opacity-25 text-light">{jobs.length}</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`btn w-100 text-start d-flex align-items-center justify-content-between px-3 py-2 ${
                  activeTab === 'questions' ? 'text-white fw-semibold' : 'text-secondary'
                }`}
                style={{
                  backgroundColor: activeTab === 'questions' ? '#1E1B4B' : 'transparent',
                  borderRadius: '10px',
                }}
                onClick={() => setActiveTab('questions')}
              >
                <span>
                  <i
                    className="bi bi-chat-square-quote me-2"
                    style={{ color: activeTab === 'questions' ? '#6366F1' : undefined }}
                  ></i>
                  Question Bank
                </span>
                <span className="badge bg-secondary bg-opacity-25 text-light">
                  {questions.length}
                </span>
              </button>
            </li>
          </ul>
        </div>

        {/* Sticky Sidebar Account Footer & Sign Out (Desktop Only) */}
        <div className="border-top border-secondary border-opacity-25 pt-3">
          <div className="px-2 mb-3">
            <div className="small fw-semibold text-white text-truncate">
              {user?.email || 'admin@careerai.com'}
            </div>
            <div className="text-secondary" style={{ fontSize: '11px' }}>
              Super Administrator
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
            onClick={handleSignOut}
          >
            <i className="bi bi-box-arrow-right"></i> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <div className="flex-grow-1 d-flex flex-column min-w-0">
        {/* Persistent Top Admin Header Bar */}
        <header className="bg-white border-bottom px-4 py-3 d-flex flex-wrap justify-content-between align-items-center gap-2 sticky-top">
          <div>
            <h5 className="fw-bold text-dark mb-0">
              {activeTab === 'overview' && 'Platform Overview & Telemetry'}
              {activeTab === 'users' && 'User Account Management'}
              {activeTab === 'jobs' && 'Platform Job Catalog'}
              {activeTab === 'questions' && 'Interview Question Bank'}
            </h5>
            <small className="text-muted">Administrator Control Center</small>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm text-white fw-semibold d-inline-flex align-items-center gap-2 px-3 py-2"
              style={{ backgroundColor: '#4F46E5', borderRadius: '8px' }}
              onClick={loadAllData}
            >
              <i className="bi bi-arrow-clockwise"></i> Refresh Data
            </button>
            {/* Responsive Sign Out Button (Visible Only on Mobile/Tablet < 992px) */}
            <button
              type="button"
              className="btn btn-sm btn-outline-danger fw-semibold d-inline-flex d-lg-none align-items-center gap-2 px-3 py-2"
              style={{ borderRadius: '8px' }}
              onClick={handleSignOut}
            >
              <i className="bi bi-box-arrow-right"></i> Sign Out
            </button>
          </div>
        </header>

        {/* Mobile/Tablet Tab Switcher */}
        <div className="d-flex d-lg-none gap-2 overflow-auto bg-white border-bottom px-4 py-2">
          <button
            className={`btn btn-sm ${
              activeTab === 'overview' ? 'text-white' : 'btn-outline-secondary'
            }`}
            style={{ backgroundColor: activeTab === 'overview' ? '#4F46E5' : undefined }}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`btn btn-sm ${
              activeTab === 'users' ? 'text-white' : 'btn-outline-secondary'
            }`}
            style={{ backgroundColor: activeTab === 'users' ? '#4F46E5' : undefined }}
            onClick={() => setActiveTab('users')}
          >
            Users ({users.length})
          </button>
          <button
            className={`btn btn-sm ${
              activeTab === 'jobs' ? 'text-white' : 'btn-outline-secondary'
            }`}
            style={{ backgroundColor: activeTab === 'jobs' ? '#4F46E5' : undefined }}
            onClick={() => setActiveTab('jobs')}
          >
            Jobs ({jobs.length})
          </button>
          <button
            className={`btn btn-sm ${
              activeTab === 'questions' ? 'text-white' : 'btn-outline-secondary'
            }`}
            style={{ backgroundColor: activeTab === 'questions' ? '#4F46E5' : undefined }}
            onClick={() => setActiveTab('questions')}
          >
            Questions ({questions.length})
          </button>
        </div>

        {/* Main Content Body */}
        <main className="p-4 flex-grow-1">
          {error && (
            <div className="alert alert-danger alert-dismissible fade show rounded-3" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

          {successMsg && (
            <div className="alert alert-success fade show rounded-3" role="alert">
              <i className="bi bi-check-circle-fill me-2"></i>
              {successMsg}
            </div>
          )}

          {/* TAB 1: OVERVIEW & SYSTEM HEALTH */}
          {activeTab === 'overview' && (
            <>
              {/* Welcome Banner Card */}
              <div className="card bg-white p-4 mb-4" style={cardStyle}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                      style={{
                        width: '54px',
                        height: '54px',
                        backgroundColor: '#EEF2FF',
                        color: '#4F46E5',
                      }}
                    >
                      <i className="bi bi-shield-check fs-3"></i>
                    </div>
                    <div>
                      <h4 className="fw-bold text-dark mb-1">
                        Welcome back, {user?.username || 'Administrator'}!
                      </h4>
                      <p className="text-muted small mb-0">
                        Monitor platform metrics, manage registered accounts, curate job listings,
                        and maintain the AI interview question bank.
                      </p>
                    </div>
                  </div>
                  <span
                    className="badge bg-success-subtle text-success rounded-pill px-3 py-2 align-self-start align-self-md-center"
                    style={{ fontSize: '12px' }}
                  >
                    <i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i>
                    {health.database || 'System Healthy'}
                  </span>
                </div>
              </div>

              {/* 4-Card KPI Strip */}
              <div className="row g-3 mb-4">
                <div className="col-md-3 col-sm-6">
                  <div className="card bg-white h-100 p-3" style={cardStyle}>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-3"
                        style={{
                          width: '42px',
                          height: '42px',
                          backgroundColor: '#EEF2FF',
                          color: '#4F46E5',
                        }}
                      >
                        <i className="bi bi-people-fill fs-5"></i>
                      </div>
                      <span
                        className="badge rounded-pill"
                        style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                      >
                        +{kpis.new_users_week || 0} this week
                      </span>
                    </div>
                    <div className="text-muted small fw-semibold mb-1">Registered Users</div>
                    <h3 className="fw-bold text-dark mb-1">{kpis.total_users ?? users.length}</h3>
                    <small className="text-success fw-medium">
                      <i className="bi bi-check-circle me-1"></i>
                      {kpis.active_users ?? users.filter((u) => u.is_active).length} active accounts
                    </small>
                  </div>
                </div>

                <div className="col-md-3 col-sm-6">
                  <div className="card bg-white h-100 p-3" style={cardStyle}>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-3"
                        style={{
                          width: '42px',
                          height: '42px',
                          backgroundColor: '#ECFDF5',
                          color: '#10B981',
                        }}
                      >
                        <i className="bi bi-file-earmark-check-fill fs-5"></i>
                      </div>
                      <span className="badge bg-success-subtle text-success rounded-pill">
                        ATS Engine
                      </span>
                    </div>
                    <div className="text-muted small fw-semibold mb-1">Resumes Analyzed</div>
                    <h3 className="fw-bold text-dark mb-1">{kpis.total_resumes || 0}</h3>
                    <small className="text-muted">Avg ATS Score: {kpis.avg_ats_score || 0}%</small>
                  </div>
                </div>

                <div className="col-md-3 col-sm-6">
                  <div className="card bg-white h-100 p-3" style={cardStyle}>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-3"
                        style={{
                          width: '42px',
                          height: '42px',
                          backgroundColor: '#EFF6FF',
                          color: '#2563EB',
                        }}
                      >
                        <i className="bi bi-briefcase-fill fs-5"></i>
                      </div>
                      <span className="badge bg-primary-subtle text-primary rounded-pill">
                        Job Board
                      </span>
                    </div>
                    <div className="text-muted small fw-semibold mb-1">Active Job Listings</div>
                    <h3 className="fw-bold text-dark mb-1">{kpis.active_jobs ?? jobs.length}</h3>
                    <small className="text-muted">
                      {kpis.total_applications || 0} candidate applications
                    </small>
                  </div>
                </div>

                <div className="col-md-3 col-sm-6">
                  <div className="card bg-white h-100 p-3" style={cardStyle}>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-3"
                        style={{
                          width: '42px',
                          height: '42px',
                          backgroundColor: '#FFFBEB',
                          color: '#F59E0B',
                        }}
                      >
                        <i className="bi bi-mic-fill fs-5"></i>
                      </div>
                      <span className="badge bg-warning-subtle text-warning-emphasis rounded-pill">
                        AI Coach
                      </span>
                    </div>
                    <div className="text-muted small fw-semibold mb-1">Mock Interviews</div>
                    <h3 className="fw-bold text-dark mb-1">{kpis.completed_sessions || 0}</h3>
                    <small className="text-muted">
                      Avg Score: {kpis.avg_interview_score || 0} / 100
                    </small>
                  </div>
                </div>
              </div>

              {/* Charts & System Health Row */}
              <div className="row g-4 mb-4">
                <div className="col-lg-5">
                  <div className="card bg-white h-100 p-4" style={cardStyle}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="fw-bold text-dark mb-0">Application Funnel Distribution</h5>
                      <span className="text-muted small">Pipeline Stages</span>
                    </div>
                    {(overview?.charts?.application_statuses || []).length > 0 ? (
                      <Bar
                        data={applicationChartData}
                        options={{ responsive: true, plugins: { legend: { display: false } } }}
                      />
                    ) : (
                      <div className="text-center py-5 my-auto">
                        <div
                          className="d-inline-flex align-items-center justify-content-center rounded-circle bg-light text-muted mb-2"
                          style={{ width: '48px', height: '48px' }}
                        >
                          <i className="bi bi-bar-chart fs-5"></i>
                        </div>
                        <p className="text-muted small mb-0">No application data recorded yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-lg-3">
                  <div className="card bg-white h-100 p-4" style={cardStyle}>
                    <h5 className="fw-bold text-dark mb-3">Question Bank Mix</h5>
                    {(overview?.charts?.question_categories || []).length > 0 ? (
                      <Doughnut data={questionChartData} />
                    ) : (
                      <div className="text-center py-5 my-auto">
                        <div
                          className="d-inline-flex align-items-center justify-content-center rounded-circle bg-light text-muted mb-2"
                          style={{ width: '48px', height: '48px' }}
                        >
                          <i className="bi bi-pie-chart fs-5"></i>
                        </div>
                        <p className="text-muted small mb-0">No questions seeded yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-lg-4">
                  <div className="card bg-white h-100 p-4" style={cardStyle}>
                    <h5 className="fw-bold text-dark mb-3 d-flex align-items-center">
                      <i className="bi bi-activity text-success me-2"></i>System Health Monitor
                    </h5>
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                        <span className="text-muted small">Database Status</span>
                        <span
                          className={`badge rounded-pill ${
                            health.database === 'Healthy' || !health.database
                              ? 'bg-success-subtle text-success'
                              : 'bg-danger-subtle text-danger'
                          }`}
                        >
                          {health.database || 'Healthy'}
                        </span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                        <span className="text-muted small">Storage Engine</span>
                        <span className="fw-semibold small text-dark">
                          {health.database_engine || 'SQLite / PostgreSQL'}
                        </span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                        <span className="text-muted small">Active AI Engine</span>
                        <span
                          className="badge rounded-pill"
                          style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                        >
                          {health.ai_provider || 'Groq / LLM Active'}
                        </span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                        <span className="text-muted small">Fallback Evaluator</span>
                        <span className="text-success small fw-semibold">Standby Ready</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2 border-bottom-0">
                        <span className="text-muted small">Runtime Stack</span>
                        <span className="small text-muted">
                          Python {health.python_version || ''} / Django{' '}
                          {health.django_version || ''}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Admin Quick-Action Cards */}
              <div className="row g-3">
                <div className="col-md-4">
                  <div
                    className="card bg-white p-4 h-100"
                    style={{ ...cardStyle, cursor: 'pointer' }}
                    onClick={() => setActiveTab('users')}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-dark">Manage Platform Users</span>
                      <i className="bi bi-arrow-right" style={{ color: '#4F46E5' }}></i>
                    </div>
                    <p className="text-muted small mb-0">
                      Review registered candidates, assign admin roles, or suspend accounts.
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div
                    className="card bg-white p-4 h-100"
                    style={{ ...cardStyle, cursor: 'pointer' }}
                    onClick={() => setActiveTab('jobs')}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-dark">Curate Job Board</span>
                      <i className="bi bi-arrow-right" style={{ color: '#4F46E5' }}></i>
                    </div>
                    <p className="text-muted small mb-0">
                      Publish new roles with required skill tags for AI job matching.
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div
                    className="card bg-white p-4 h-100"
                    style={{ ...cardStyle, cursor: 'pointer' }}
                    onClick={() => setActiveTab('questions')}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-dark">Maintain Question Bank</span>
                      <i className="bi bi-arrow-right" style={{ color: '#4F46E5' }}></i>
                    </div>
                    <p className="text-muted small mb-0">
                      Add technical, behavioral, and project-based prompts for mock interviews.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="card bg-white p-4" style={cardStyle}>
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                <h5 className="fw-bold text-dark mb-0">Platform Users</h5>
                <div className="d-flex flex-wrap gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    style={{ width: '240px' }}
                    placeholder="Search by email or name..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <select
                    className="form-select form-select-sm"
                    style={{ width: '160px' }}
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                  >
                    <option value="">All Roles</option>
                    <option value="candidate">Candidates</option>
                    <option value="admin">Administrators</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>User</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Activity</th>
                      <th>Joined</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="fw-semibold text-dark">{u.full_name || 'User'}</div>
                          <small className="text-muted">{u.email}</small>
                        </td>
                        <td>
                          <span
                            className={`badge rounded-pill ${
                              u.role === 'admin' ? 'bg-dark' : 'bg-info-subtle text-info-emphasis'
                            }`}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge rounded-pill ${
                              u.is_active
                                ? 'bg-success-subtle text-success'
                                : 'bg-secondary-subtle text-secondary'
                            }`}
                          >
                            {u.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border me-1">
                            {u.resumes_count || 0} Resumes
                          </span>
                          <span className="badge bg-light text-dark border me-1">
                            {u.applications_count || 0} Apps
                          </span>
                          <span className="badge bg-light text-dark border">
                            {u.interviews_count || 0} Interviews
                          </span>
                        </td>
                        <td className="small text-muted">
                          {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '—'}
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-secondary me-1"
                            onClick={() => handleToggleUserRole(u)}
                          >
                            {u.role === 'admin' ? 'Make Candidate' : 'Make Admin'}
                          </button>
                          <button
                            className={`btn btn-sm me-1 ${
                              u.is_active ? 'btn-outline-warning' : 'btn-outline-success'
                            }`}
                            onClick={() => handleToggleUserStatus(u)}
                          >
                            {u.is_active ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteUser(u)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: JOB MANAGEMENT */}
          {activeTab === 'jobs' && (
            <div className="row g-4">
              <div className="col-lg-4">
                <div className="card bg-white p-4" style={cardStyle}>
                  <h5 className="fw-bold text-dark mb-3">Post New Job</h5>
                  <form onSubmit={handleCreateJob}>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold">Job Title</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={newJob.title}
                        onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold">Company</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={newJob.company}
                        onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                      />
                    </div>
                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="form-label small fw-semibold">Location</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={newJob.location}
                          onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold">Salary (LPA)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={newJob.salary_range}
                          onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold">
                        Required Skills (comma-separated)
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Python, Django, React, SQL"
                        required
                        value={newJob.required_skills}
                        onChange={(e) =>
                          setNewJob({ ...newJob, required_skills: e.target.value })
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Description</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="3"
                        required
                        value={newJob.description}
                        onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-sm w-100 text-white fw-semibold py-2"
                      style={{ backgroundColor: '#4F46E5', borderRadius: '8px' }}
                    >
                      <i className="bi bi-plus-circle me-1"></i> Publish Job
                    </button>
                  </form>
                </div>
              </div>

              <div className="col-lg-8">
                <div className="card bg-white p-4" style={cardStyle}>
                  <h5 className="fw-bold text-dark mb-3">All Job Listings</h5>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Role & Company</th>
                          <th>Skills</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobs.map((job) => (
                          <tr key={job.id}>
                            <td>
                              <div className="fw-semibold text-dark">{job.title}</div>
                              <small className="text-muted">
                                {job.company} • {job.location} ({job.salary_range})
                              </small>
                            </td>
                            <td>
                              {(job.required_skills || []).slice(0, 4).map((skill, idx) => (
                                <span key={idx} className="badge bg-light text-dark border me-1">
                                  {skill}
                                </span>
                              ))}
                            </td>
                            <td>
                              <span
                                className={`badge rounded-pill ${
                                  job.is_active
                                    ? 'bg-success-subtle text-success'
                                    : 'bg-secondary-subtle text-secondary'
                                }`}
                              >
                                {job.is_active ? 'Active' : 'Archived'}
                              </span>
                            </td>
                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-outline-secondary me-1"
                                onClick={() => handleToggleJobActive(job)}
                              >
                                {job.is_active ? 'Archive' : 'Activate'}
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteJob(job)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QUESTION BANK MANAGEMENT */}
          {activeTab === 'questions' && (
            <div className="row g-4">
              <div className="col-lg-4">
                <div className="card bg-white p-4" style={cardStyle}>
                  <h5 className="fw-bold text-dark mb-3">Add Interview Question</h5>
                  <form onSubmit={handleCreateQuestion}>
                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="form-label small fw-semibold">Category</label>
                        <select
                          className="form-select form-select-sm"
                          value={newQuestion.category}
                          onChange={(e) =>
                            setNewQuestion({ ...newQuestion, category: e.target.value })
                          }
                        >
                          <option value="Technical">Technical</option>
                          <option value="HR">HR</option>
                          <option value="Behavioral">Behavioral</option>
                          <option value="Project-based">Project-based</option>
                        </select>
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold">Difficulty</label>
                        <select
                          className="form-select form-select-sm"
                          value={newQuestion.difficulty}
                          onChange={(e) =>
                            setNewQuestion({ ...newQuestion, difficulty: e.target.value })
                          }
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold">Question Prompt</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="3"
                        required
                        value={newQuestion.question_text}
                        onChange={(e) =>
                          setNewQuestion({ ...newQuestion, question_text: e.target.value })
                        }
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label small fw-semibold">
                        Ideal Talking Points (comma-separated)
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Scalability, Indexing, Caching"
                        value={newQuestion.ideal_points}
                        onChange={(e) =>
                          setNewQuestion({ ...newQuestion, ideal_points: e.target.value })
                        }
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Sample Benchmark Answer</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows="2"
                        value={newQuestion.sample_answer}
                        onChange={(e) =>
                          setNewQuestion({ ...newQuestion, sample_answer: e.target.value })
                        }
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-sm w-100 text-white fw-semibold py-2"
                      style={{ backgroundColor: '#4F46E5', borderRadius: '8px' }}
                    >
                      <i className="bi bi-plus-circle me-1"></i> Add Question
                    </button>
                  </form>
                </div>
              </div>

              <div className="col-lg-8">
                <div className="card bg-white p-4" style={cardStyle}>
                  <h5 className="fw-bold text-dark mb-3">Question Bank Repository</h5>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Category</th>
                          <th>Difficulty</th>
                          <th>Question</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {questions.map((q) => (
                          <tr key={q.id}>
                            <td>
                              <span
                                className="badge rounded-pill"
                                style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                              >
                                {q.category}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge rounded-pill ${
                                  q.difficulty === 'Hard'
                                    ? 'bg-danger-subtle text-danger'
                                    : q.difficulty === 'Medium'
                                    ? 'bg-warning-subtle text-warning-emphasis'
                                    : 'bg-success-subtle text-success'
                                }`}
                              >
                                {q.difficulty}
                              </span>
                            </td>
                            <td className="small text-dark">{q.question_text}</td>
                            <td className="text-end">
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDeleteQuestion(q)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;