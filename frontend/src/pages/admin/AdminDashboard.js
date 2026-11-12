import React, { useState, useEffect, useCallback } from 'react';
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
import adminService from '../../services/adminService';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const AdminDashboard = () => {
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
  const handleToggleUserStatus = async (user) => {
    try {
      const updated = await adminService.updateUser(user.id, { is_active: !user.is_active });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      showToast(`User ${user.email} is now ${updated.is_active ? 'Active' : 'Suspended'}.`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update user status.');
    }
  };

  const handleToggleUserRole = async (user) => {
    const nextRole = user.role === 'admin' ? 'candidate' : 'admin';
    try {
      const updated = await adminService.updateUser(user.id, { role: nextRole });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      showToast(`Updated ${user.email} role to ${nextRole.toUpperCase()}.`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update user role.');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Permanently delete user ${user.email}?`)) return;
    try {
      await adminService.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      showToast(`Deleted user ${user.email}.`);
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
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="text-muted mt-3">Loading Administrator Control Center...</p>
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
        backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#06b6d4'],
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
        backgroundColor: '#4f46e5',
        borderRadius: 6,
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

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <span className="badge bg-primary-subtle text-primary mb-1 px-3 py-2 rounded-pill">
            <i className="bi bi-shield-lock me-1"></i> System Administration
          </span>
          <h2 className="fw-bold mb-0">CareerAI Admin Control Center</h2>
          <p className="text-muted mb-0">
            Monitor platform metrics, manage users, curate jobs, and maintain question banks.
          </p>
        </div>
        <button className="btn btn-outline-primary" onClick={loadAllData}>
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh Telemetry
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {successMsg}
        </div>
      )}

      {/* Navigation Tabs */}
      <ul className="nav nav-pills mb-4 gap-2 bg-white p-2 rounded-3 shadow-sm border">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="bi bi-speedometer2 me-1"></i> Overview & System Health
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="bi bi-people me-1"></i> Users ({users.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            <i className="bi bi-briefcase me-1"></i> Jobs ({jobs.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            <i className="bi bi-chat-square-quote me-1"></i> Question Bank ({questions.length})
          </button>
        </li>
      </ul>

      {/* TAB 1: OVERVIEW & SYSTEM HEALTH */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Strip */}
          <div className="row g-3 mb-4">
            <div className="col-md-3 col-sm-6">
              <div className="card border-0 shadow-sm h-100 rounded-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small fw-semibold">REGISTERED USERS</span>
                    <span className="badge bg-primary-subtle text-primary">
                      +{kpis.new_users_week || 0} this week
                    </span>
                  </div>
                  <h3 className="fw-bold mb-1">{kpis.total_users || 0}</h3>
                  <small className="text-success">{kpis.active_users || 0} active accounts</small>
                </div>
              </div>
            </div>

            <div className="col-md-3 col-sm-6">
              <div className="card border-0 shadow-sm h-100 rounded-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small fw-semibold">RESUMES ANALYZED</span>
                    <i className="bi bi-file-earmark-check text-success fs-5"></i>
                  </div>
                  <h3 className="fw-bold mb-1">{kpis.total_resumes || 0}</h3>
                  <small className="text-muted">Avg ATS Score: {kpis.avg_ats_score || 0}%</small>
                </div>
              </div>
            </div>

            <div className="col-md-3 col-sm-6">
              <div className="card border-0 shadow-sm h-100 rounded-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small fw-semibold">ACTIVE JOB LISTINGS</span>
                    <i className="bi bi-briefcase text-info fs-5"></i>
                  </div>
                  <h3 className="fw-bold mb-1">{kpis.active_jobs || 0}</h3>
                  <small className="text-muted">
                    {kpis.total_applications || 0} candidate applications
                  </small>
                </div>
              </div>
            </div>

            <div className="col-md-3 col-sm-6">
              <div className="card border-0 shadow-sm h-100 rounded-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted small fw-semibold">MOCK INTERVIEWS</span>
                    <i className="bi bi-robot text-warning fs-5"></i>
                  </div>
                  <h3 className="fw-bold mb-1">{kpis.completed_sessions || 0}</h3>
                  <small className="text-muted">
                    Avg Score: {kpis.avg_interview_score || 0} / 100
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* Charts + System Health */}
          <div className="row g-4">
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <h5 className="fw-bold mb-3">Application Funnel Distribution</h5>
                  {(overview?.charts?.application_statuses || []).length > 0 ? (
                    <Bar
                      data={applicationChartData}
                      options={{ responsive: true, plugins: { legend: { display: false } } }}
                    />
                  ) : (
                    <p className="text-muted py-5 text-center">No application data recorded yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-3">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <h5 className="fw-bold mb-3">Question Bank Mix</h5>
                  {(overview?.charts?.question_categories || []).length > 0 ? (
                    <Doughnut data={questionChartData} />
                  ) : (
                    <p className="text-muted py-5 text-center">No questions seeded.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body">
                  <h5 className="fw-bold mb-3">
                    <i className="bi bi-activity text-success me-2"></i>System Health Monitor
                  </h5>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Database Status</span>
                      <span
                        className={`badge ${
                          health.database === 'Healthy' ? 'bg-success' : 'bg-danger'
                        }`}
                      >
                        {health.database || 'Healthy'}
                      </span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Storage Engine</span>
                      <span className="fw-medium">{health.database_engine}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Active AI Engine</span>
                      <span className="badge bg-primary-subtle text-primary">
                        {health.ai_provider}
                      </span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Fallback Evaluator</span>
                      <span className="text-success fw-semibold">Standby Ready</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Runtime Stack</span>
                      <span className="small text-muted">
                        Python {health.python_version} / Django {health.django_version}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="card border-0 shadow-sm rounded-4">
          <div className="card-body">
            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search users by email or name..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
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
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Activity (Resumes / Jobs / Interviews)</th>
                    <th>Joined</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="fw-semibold">{u.full_name}</div>
                        <small className="text-muted">{u.email}</small>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === 'admin' ? 'bg-dark' : 'bg-info-subtle text-info'
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border me-1">
                          {u.resumes_count} Resumes
                        </span>
                        <span className="badge bg-light text-dark border me-1">
                          {u.applications_count} Apps
                        </span>
                        <span className="badge bg-light text-dark border">
                          {u.interviews_count} Interviews
                        </span>
                      </td>
                      <td className="small text-muted">
                        {new Date(u.date_joined).toLocaleDateString()}
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-secondary me-1"
                          onClick={() => handleToggleUserRole(u)}
                          title="Switch Role"
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
        </div>
      )}

      {/* TAB 3: JOB MANAGEMENT */}
      {activeTab === 'jobs' && (
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Post New Job</h5>
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
                      onChange={(e) => setNewJob({ ...newJob, required_skills: e.target.value })}
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
                  <button type="submit" className="btn btn-primary btn-sm w-100">
                    <i className="bi bi-plus-circle me-1"></i> Publish Job
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">All Job Listings</h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
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
                            <div className="fw-semibold">{job.title}</div>
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
                              className={`badge ${job.is_active ? 'bg-success' : 'bg-secondary'}`}
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
        </div>
      )}

      {/* TAB 4: QUESTION BANK MANAGEMENT */}
      {activeTab === 'questions' && (
        <div className="row g-4">
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Add Interview Question</h5>
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
                  <button type="submit" className="btn btn-primary btn-sm w-100">
                    <i className="bi bi-plus-circle me-1"></i> Add Question
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Question Bank Repository</h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
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
                            <span className="badge bg-primary-subtle text-primary">
                              {q.category}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                q.difficulty === 'Hard'
                                  ? 'bg-danger'
                                  : q.difficulty === 'Medium'
                                  ? 'bg-warning text-dark'
                                  : 'bg-success'
                              }`}
                            >
                              {q.difficulty}
                            </span>
                          </td>
                          <td className="small">{q.question_text}</td>
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
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;