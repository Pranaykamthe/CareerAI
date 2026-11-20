import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation & Global UI State
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Backend Data States
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [questions, setQuestions] = useState([]);

  // User Management Filters & Drawers
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userConfirmModal, setUserConfirmModal] = useState(null); // { type: 'disable' | 'enable' | 'delete', target: userObj }

  // Job Management Filters & Modals
  const [jobSearch, setJobSearch] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('all');
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobDeleteTarget, setJobDeleteTarget] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    location: 'Remote',
    job_type: 'Full-time',
    experience_level: 'Mid Level',
    min_experience_years: 2,
    salary_range: '',
    required_skills: '',
    preferred_skills: '',
    description: '',
    is_active: true,
  });

  // Question Bank Filters & Modals
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState('All');
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionDeleteTarget, setQuestionDeleteTarget] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    category: 'Technical',
    difficulty: 'Medium',
    role_target: 'Software Engineer',
    question_text: '',
    ideal_points: '',
    sample_answer: '',
  });

  const showToast = useCallback((type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Load All Admin Data
  const fetchAllAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, usersRes, jobsRes, questionsRes] = await Promise.all([
        adminService.getOverview(),
        adminService.getUsers(),
        adminService.getJobs(),
        adminService.getQuestions(),
      ]);
      setOverview(overviewRes);
      setUsers(Array.isArray(usersRes) ? usersRes : usersRes.results || []);
      setJobs(Array.isArray(jobsRes) ? jobsRes : jobsRes.results || []);
      setQuestions(Array.isArray(questionsRes) ? questionsRes : questionsRes.results || []);
    } catch (err) {
      showToast(
        'danger',
        'Failed to load admin metrics',
        err.response?.data?.detail || 'Please verify your administrator session.'
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAllAdminData();
  }, [fetchAllAdminData]);

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  // ==================== USER MANAGEMENT HANDLERS ====================
  const handleConfirmUserAction = async () => {
    if (!userConfirmModal) return;
    const { type, target } = userConfirmModal;
    try {
      if (type === 'delete') {
        await adminService.deleteUser(target.id);
        setUsers((prev) => prev.filter((u) => u.id !== target.id));
        if (selectedUser?.id === target.id) setSelectedUser(null);
        showToast('success', 'User deleted', `${target.email} has been permanently removed.`);
      } else {
        const nextActive = type === 'enable';
        const updated = await adminService.updateUser(target.id, { is_active: nextActive });
        setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));
        if (selectedUser?.id === target.id) setSelectedUser(updated);
        showToast(
          'success',
          'User status updated successfully!',
          `${target.full_name || target.email} has been ${nextActive ? 'activated' : 'disabled'}.`
        );
      }
      const freshOverview = await adminService.getOverview();
      setOverview(freshOverview);
    } catch (err) {
      showToast(
        'danger',
        'Action blocked',
        err.response?.data?.detail || 'Unable to update user account.'
      );
    } finally {
      setUserConfirmModal(null);
    }
  };

  const handleUserRoleChange = async (targetUser, newRole) => {
    if (targetUser.role === newRole) return;
    try {
      const updated = await adminService.updateUser(targetUser.id, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
      if (selectedUser?.id === targetUser.id) setSelectedUser(updated);
      showToast(
        'success',
        'Role updated',
        `${targetUser.full_name || targetUser.email} is now set to ${newRole.toUpperCase()}.`
      );
    } catch (err) {
      showToast(
        'danger',
        'Role change blocked',
        err.response?.data?.detail || 'Unable to modify user role.'
      );
    }
  };

  // ==================== JOB CATALOG HANDLERS ====================
  const openCreateJobModal = () => {
    setEditingJob(null);
    setJobForm({
      title: '',
      company: '',
      location: 'Remote',
      job_type: 'Full-time',
      experience_level: 'Mid Level',
      min_experience_years: 2,
      salary_range: '',
      required_skills: '',
      preferred_skills: '',
      description: '',
      is_active: true,
    });
    setShowJobModal(true);
  };

  const openEditJobModal = (job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title || '',
      company: job.company || '',
      location: job.location || 'Remote',
      job_type: job.job_type || 'Full-time',
      experience_level: job.experience_level || 'Mid Level',
      min_experience_years: job.min_experience_years ?? 1,
      salary_range: job.salary_range || '',
      required_skills: Array.isArray(job.required_skills) ? job.required_skills.join(', ') : '',
      preferred_skills: Array.isArray(job.preferred_skills) ? job.preferred_skills.join(', ') : '',
      description: job.description || '',
      is_active: job.is_active !== false,
    });
    setShowJobModal(true);
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    const payload = {
      ...jobForm,
      min_experience_years: Number(jobForm.min_experience_years) || 0,
      required_skills: jobForm.required_skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      preferred_skills: jobForm.preferred_skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (payload.required_skills.length === 0) {
      showToast('warning', 'Missing skills', 'Please enter at least one required skill.');
      return;
    }

    try {
      if (editingJob) {
        const updated = await adminService.updateJob(editingJob.id, payload);
        setJobs((prev) => prev.map((j) => (j.id === editingJob.id ? updated : j)));
        showToast('success', 'Job updated', `"${updated.title}" has been saved.`);
      } else {
        const created = await adminService.createJob(payload);
        setJobs((prev) => [created, ...prev]);
        showToast('success', 'Job published', `"${created.title}" is now live in the catalog.`);
      }
      setShowJobModal(false);
      const freshOverview = await adminService.getOverview();
      setOverview(freshOverview);
    } catch (err) {
      showToast(
        'danger',
        'Save failed',
        err.response?.data?.detail || 'Please check all required job fields.'
      );
    }
  };

  const handleToggleJobActive = async (job) => {
    try {
      const updated = await adminService.updateJob(job.id, { is_active: !job.is_active });
      setJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
      showToast(
        'success',
        updated.is_active ? 'Job activated' : 'Job archived',
        `"${job.title}" is now ${updated.is_active ? 'active' : 'hidden from candidates'}.`
      );
      const freshOverview = await adminService.getOverview();
      setOverview(freshOverview);
    } catch (err) {
      showToast('danger', 'Update failed', 'Could not toggle job visibility.');
    }
  };

  const handleConfirmDeleteJob = async () => {
    if (!jobDeleteTarget) return;
    try {
      await adminService.deleteJob(jobDeleteTarget.id);
      setJobs((prev) => prev.filter((j) => j.id !== jobDeleteTarget.id));
      showToast('success', 'Job deleted', `"${jobDeleteTarget.title}" removed from catalog.`);
      const freshOverview = await adminService.getOverview();
      setOverview(freshOverview);
    } catch (err) {
      showToast('danger', 'Delete failed', 'Unable to delete this job posting.');
    } finally {
      setJobDeleteTarget(null);
    }
  };

  // ==================== QUESTION BANK HANDLERS ====================
  const openCreateQuestionModal = () => {
    setEditingQuestion(null);
    setQuestionForm({
      category: 'Technical',
      difficulty: 'Medium',
      role_target: 'Software Engineer',
      question_text: '',
      ideal_points: '',
      sample_answer: '',
    });
    setShowQuestionModal(true);
  };

  const openEditQuestionModal = (q) => {
    setEditingQuestion(q);
    setQuestionForm({
      category: q.category || 'Technical',
      difficulty: q.difficulty || 'Medium',
      role_target: q.role_target || 'Software Engineer',
      question_text: q.question_text || '',
      ideal_points: Array.isArray(q.ideal_points)
        ? q.ideal_points.join(', ')
        : q.ideal_points || '',
      sample_answer: q.sample_answer || '',
    });
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    const payload = {
      category: questionForm.category,
      difficulty: questionForm.difficulty,
      role_target: questionForm.role_target,
      question_text: questionForm.question_text,
      ideal_points: questionForm.ideal_points
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
      sample_answer: questionForm.sample_answer,
    };

    try {
      if (editingQuestion) {
        const updated = await adminService.updateQuestion(editingQuestion.id, payload);
        setQuestions((prev) => prev.map((q) => (q.id === editingQuestion.id ? updated : q)));
        showToast('success', 'Question updated', 'Interview prompt changes saved.');
      } else {
        const created = await adminService.createQuestion(payload);
        setQuestions((prev) => [created, ...prev]);
        showToast('success', 'Question added', 'New prompt added to the AI Question Bank.');
      }
      setShowQuestionModal(false);
      const freshOverview = await adminService.getOverview();
      setOverview(freshOverview);
    } catch (err) {
      showToast(
        'danger',
        'Save failed',
        err.response?.data?.detail || 'Please verify all question fields.'
      );
    }
  };

  const handleConfirmDeleteQuestion = async () => {
    if (!questionDeleteTarget) return;
    try {
      await adminService.deleteQuestion(questionDeleteTarget.id);
      setQuestions((prev) => prev.filter((q) => q.id !== questionDeleteTarget.id));
      showToast('success', 'Question removed', 'Prompt deleted from the Question Bank.');
      const freshOverview = await adminService.getOverview();
      setOverview(freshOverview);
    } catch (err) {
      showToast('danger', 'Delete failed', 'Unable to remove interview question.');
    } finally {
      setQuestionDeleteTarget(null);
    }
  };

  // ==================== FILTERED LISTS ====================
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !userSearch ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username?.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesStatus =
      userStatusFilter === 'all' ||
      (userStatusFilter === 'active' && u.is_active) ||
      (userStatusFilter === 'inactive' && !u.is_active);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      !jobSearch ||
      j.title?.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.company?.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.location?.toLowerCase().includes(jobSearch.toLowerCase());
    const matchesStatus =
      jobStatusFilter === 'all' ||
      (jobStatusFilter === 'active' && j.is_active) ||
      (jobStatusFilter === 'inactive' && !j.is_active);
    return matchesSearch && matchesStatus;
  });

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      !questionSearch ||
      q.question_text?.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.role_target?.toLowerCase().includes(questionSearch.toLowerCase());
    const matchesCat =
      questionCategoryFilter === 'All' || q.category === questionCategoryFilter;
    return matchesSearch && matchesCat;
  });

  // ==================== CHART.JS CONFIGS ====================
  const kpis = overview?.kpis || {};
  const health = overview?.system_health || {};
  const appStatuses = overview?.charts?.application_statuses || [];
  const qCategories = overview?.charts?.question_categories || [];

  const applicationBarData = {
    labels: appStatuses.length
      ? appStatuses.map((item) => item.status)
      : ['Saved', 'Applied', 'Screening', 'Interview', 'Offer'],
    datasets: [
      {
        label: 'Candidate Applications',
        data: appStatuses.length ? appStatuses.map((item) => item.count) : [0, 0, 0, 0, 0],
        backgroundColor: '#4F46E5',
        borderRadius: 8,
        barThickness: 28,
      },
    ],
  };

  const questionDoughnutData = {
    labels: qCategories.length
      ? qCategories.map((c) => c.category)
      : ['Technical', 'Behavioral', 'HR', 'Project-based'],
    datasets: [
      {
        data: qCategories.length ? qCategories.map((c) => c.count) : [1, 1, 1, 1],
        backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#0EA5E9', '#8B5CF6'],
        borderWidth: 0,
      },
    ],
  };

  // ==================== SIDEBAR NAVIGATION ITEMS ====================
  const navGroups = [
    {
      label: 'OVERVIEW',
      items: [{ key: 'overview', label: 'Dashboard', icon: 'bi-grid-1x2-fill' }],
    },
    {
      label: 'MANAGEMENT',
      items: [
        { key: 'users', label: 'Users', icon: 'bi-people-fill', count: users.length },
        { key: 'jobs', label: 'Job Listings', icon: 'bi-briefcase-fill', count: jobs.length },
        {
          key: 'questions',
          label: 'Question Bank',
          icon: 'bi-chat-square-quote-fill',
          count: questions.length,
        },
      ],
    },
  ];

  const getInitials = (nameOrEmail = 'A') => {
    const clean = nameOrEmail.trim();
    const parts = clean.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  };

  return (
    <div className="d-flex min-vh-100" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Floating Toast Notification */}
      {toast && (
        <div
          className="position-fixed top-0 end-0 m-4 p-3 bg-white d-flex align-items-start gap-3"
          style={{
            zIndex: 1080,
            minWidth: '320px',
            maxWidth: '400px',
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.12)',
          }}
        >
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: '34px',
              height: '34px',
              backgroundColor:
                toast.type === 'success'
                  ? '#ECFDF5'
                  : toast.type === 'warning'
                  ? '#FFFBEB'
                  : '#FEF2F2',
              color:
                toast.type === 'success'
                  ? '#10B981'
                  : toast.type === 'warning'
                  ? '#F59E0B'
                  : '#EF4444',
            }}
          >
            <i
              className={`bi ${
                toast.type === 'success'
                  ? 'bi-check-circle-fill'
                  : toast.type === 'warning'
                  ? 'bi-exclamation-triangle-fill'
                  : 'bi-x-circle-fill'
              }`}
            ></i>
          </div>
          <div className="flex-grow-1">
            <div className="fw-bold text-dark small">{toast.title}</div>
            <div className="text-muted" style={{ fontSize: '12px' }}>
              {toast.message}
            </div>
          </div>
          <button
            type="button"
            className="btn-close btn-sm"
            onClick={() => setToast(null)}
          ></button>
        </div>
      )}

      {/* Left Sidebar (Viewport-Locked on Desktop + Drawer on Mobile) */}
      <aside
        className={`flex-column justify-content-between text-white p-3 flex-shrink-0 ${
          mobileMenuOpen
            ? 'd-flex position-fixed top-0 start-0 vh-100'
            : 'd-none d-lg-flex sticky-top vh-100'
        }`}
        style={{
          width: '264px',
          minWidth: '264px',
          height: '100vh',
          overflowY: 'auto',
          backgroundColor: '#050A18',
          borderRight: '1px solid #1E293B',
          zIndex: 1040,
        }}
      >
        <div>
          {/* Brand Header */}
          <div className="d-flex align-items-center justify-content-between px-2 py-3 mb-3 border-bottom border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-2">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-3"
                style={{ width: '36px', height: '36px', backgroundColor: '#4F46E5' }}
              >
                <i className="bi bi-layers-fill text-white fs-5"></i>
              </span>
              <div>
                <div className="fw-bold text-white lh-1" style={{ fontSize: '18px' }}>
                  CareerAI
                </div>
                <div className="text-secondary" style={{ fontSize: '11px' }}>
                  Admin Panel
                </div>
              </div>
            </div>
            <button
              className="btn btn-sm btn-outline-secondary d-lg-none text-white border-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* Navigation Sections */}
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <div
                className="px-3 mb-2 fw-semibold text-uppercase"
                style={{ fontSize: '10.5px', letterSpacing: '0.08em', color: '#64748B' }}
              >
                {group.label}
              </div>
              <div className="d-flex flex-column gap-1">
                {group.items.map((item) => {
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.key);
                        setMobileMenuOpen(false);
                      }}
                      className="btn text-start d-flex align-items-center justify-content-between px-3 py-2 border-0"
                      style={{
                        borderRadius: '10px',
                        backgroundColor: isActive ? '#1E1B4B' : 'transparent',
                        color: isActive ? '#FFFFFF' : '#94A3B8',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '14px',
                        borderLeft: isActive ? '3px solid #6366F1' : '3px solid transparent',
                      }}
                    >
                      <span className="d-flex align-items-center gap-2">
                        <i
                          className={`bi ${item.icon}`}
                          style={{ color: isActive ? '#818CF8' : '#64748B' }}
                        ></i>
                        {item.label}
                      </span>
                      {typeof item.count === 'number' && (
                        <span
                          className="badge rounded-pill"
                          style={{
                            backgroundColor: isActive
                              ? 'rgba(99, 102, 241, 0.35)'
                              : 'rgba(148, 163, 184, 0.14)',
                            color: isActive ? '#E0E7FF' : '#94A3B8',
                            fontSize: '11px',
                          }}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom System Status & Admin Profile */}
        <div className="pt-3 border-top border-secondary border-opacity-25">
          {/* System Status Mini-Widget */}
          <div
            className="p-3 mb-3 rounded-3"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid #1E293B',
            }}
          >
            <div className="small fw-semibold text-white mb-1">System Status</div>
            <div className="d-flex align-items-center gap-2" style={{ fontSize: '12px', color: '#10B981' }}>
              <span
                className="rounded-circle d-inline-block"
                style={{ width: '8px', height: '8px', backgroundColor: '#10B981' }}
              ></span>
              {health.database === 'Degraded' ? 'Database Attention' : 'All Systems Operational'}
            </div>
          </div>

          {/* Admin User Card */}
          <div className="d-flex align-items-center gap-2 px-2 py-2 mb-2">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: '#4F46E5',
                fontSize: '13px',
              }}
            >
              {getInitials(user?.username || user?.email || 'AD')}
            </div>
            <div className="overflow-hidden">
              <div className="fw-semibold text-white small text-truncate">
                {user?.username || 'Admin User'}
              </div>
              <div className="text-secondary text-truncate" style={{ fontSize: '11px' }}>
                Super Administrator
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="btn w-100 text-start d-flex align-items-center gap-2 px-3 py-2 text-danger border-0"
            style={{ fontSize: '13.5px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '10px' }}
          >
            <i className="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-grow-1 d-flex flex-column min-w-0">
        {/* Top Admin Header Bar */}
        <header
          className="bg-white px-4 py-3 d-flex flex-wrap align-items-center justify-content-between gap-3 sticky-top"
          style={{ borderBottom: '1px solid #E2E8F0', zIndex: 1020 }}
        >
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm d-lg-none"
              onClick={() => setMobileMenuOpen(true)}
            >
              <i className="bi bi-list fs-5"></i>
            </button>
            <div>
              <h4 className="fw-bold text-dark mb-0">
                {activeTab === 'overview' && 'Dashboard'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'jobs' && 'Job Catalog Management'}
                {activeTab === 'questions' && 'Interview Question Bank'}
              </h4>
              <p className="text-muted small mb-0">
                {activeTab === 'overview' && 'Overview of platform performance, AI usage, and system health'}
                {activeTab === 'users' && 'Manage registered accounts, roles, and platform access'}
                {activeTab === 'jobs' && 'Curate, publish, and manage active job postings for candidates'}
                {activeTab === 'questions' && 'Curate Technical, HR, and Behavioral prompts for AI mock interviews'}
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span
              className="badge d-none sm-inline-flex align-items-center gap-1 px-3 py-2 rounded-pill"
              style={{
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
              <i className="bi bi-cpu"></i>
              {health.ai_provider || 'AI Engine Ready'}
            </span>
            <button
              type="button"
              onClick={fetchAllAdminData}
              className="btn btn-light border btn-sm px-3 py-2 d-inline-flex align-items-center gap-2 fw-medium"
              style={{ borderRadius: '10px' }}
              disabled={loading}
            >
              <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
              Refresh
            </button>
          </div>
        </header>

        {/* Main Workspace Body */}
        <main className="p-4 flex-grow-1">
          {loading && !overview ? (
            <div className="d-flex flex-column align-items-center justify-content-center py-5">
              <div className="spinner-border text-primary mb-3" role="status"></div>
              <p className="text-muted small">Loading CareerAI administrative telemetry...</p>
            </div>
          ) : (
            <>
              {/* ==================== TAB 1: DASHBOARD OVERVIEW ==================== */}
              {activeTab === 'overview' && (
                <div>
                  {/* 4 KPI Metric Cards */}
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-sm-6 col-xl-3">
                      <div
                        className="card bg-white p-4 h-100"
                        style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}
                      >
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <div
                            className="rounded-3 d-flex align-items-center justify-content-center"
                            style={{ width: '42px', height: '42px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                          >
                            <i className="bi bi-people fs-5"></i>
                          </div>
                          <span className="text-muted small fw-medium">Total Users</span>
                        </div>
                        <div className="fs-2 fw-bold text-dark mb-1">{kpis.total_users ?? 0}</div>
                        <div className="small" style={{ color: '#10B981' }}>
                          <i className="bi bi-arrow-up-short"></i>
                          {kpis.active_users ?? 0} active · +{kpis.new_users_week ?? 0} this week
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 col-xl-3">
                      <div
                        className="card bg-white p-4 h-100"
                        style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}
                      >
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <div
                            className="rounded-3 d-flex align-items-center justify-content-center"
                            style={{ width: '42px', height: '42px', backgroundColor: '#ECFDF5', color: '#10B981' }}
                          >
                            <i className="bi bi-file-earmark-check fs-5"></i>
                          </div>
                          <span className="text-muted small fw-medium">Resumes & Avg ATS</span>
                        </div>
                        <div className="fs-2 fw-bold text-dark mb-1">{kpis.total_resumes ?? 0}</div>
                        <div className="small text-muted">
                          Platform Avg ATS Score:{' '}
                          <span className="fw-semibold text-dark">{kpis.avg_ats_score ?? 0}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 col-xl-3">
                      <div
                        className="card bg-white p-4 h-100"
                        style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}
                      >
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <div
                            className="rounded-3 d-flex align-items-center justify-content-center"
                            style={{ width: '42px', height: '42px', backgroundColor: '#FFFBEB', color: '#F59E0B' }}
                          >
                            <i className="bi bi-briefcase fs-5"></i>
                          </div>
                          <span className="text-muted small fw-medium">Active Job Listings</span>
                        </div>
                        <div className="fs-2 fw-bold text-dark mb-1">
                          {kpis.active_jobs ?? 0}
                          <span className="fs-6 fw-normal text-muted"> / {kpis.total_jobs ?? 0}</span>
                        </div>
                        <div className="small text-muted">
                          {kpis.total_applications ?? 0} candidate applications tracked
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-sm-6 col-xl-3">
                      <div
                        className="card bg-white p-4 h-100"
                        style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}
                      >
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <div
                            className="rounded-3 d-flex align-items-center justify-content-center"
                            style={{ width: '42px', height: '42px', backgroundColor: '#F3E8FF', color: '#7C3AED' }}
                          >
                            <i className="bi bi-mic fs-5"></i>
                          </div>
                          <span className="text-muted small fw-medium">AI Interview Sessions</span>
                        </div>
                        <div className="fs-2 fw-bold text-dark mb-1">{kpis.total_sessions ?? 0}</div>
                        <div className="small text-muted">
                          {kpis.completed_sessions ?? 0} completed · Avg Score{' '}
                          <span className="fw-semibold text-dark">{kpis.avg_interview_score ?? 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-lg-7">
                      <div
                        className="card bg-white p-4 h-100"
                        style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <h6 className="fw-bold text-dark mb-0">Application Pipeline Activity</h6>
                            <span className="text-muted small">
                              Distribution of candidate job tracking stages
                            </span>
                          </div>
                          <span className="badge bg-light text-dark border">Live Data</span>
                        </div>
                        <div style={{ height: '260px' }}>
                          <Bar
                            data={applicationBarData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: { legend: { display: false } },
                              scales: {
                                y: { beginAtZero: true, ticks: { precision: 0 } },
                                x: { grid: { display: false } },
                              },
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-lg-5">
                      <div
                        className="card bg-white p-4 h-100"
                        style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <h6 className="fw-bold text-dark mb-0">Question Bank Mix</h6>
                            <span className="text-muted small">
                              {kpis.total_questions ?? questions.length} curated interview prompts
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-decoration-none fw-semibold p-0"
                            style={{ color: '#4F46E5' }}
                            onClick={() => setActiveTab('questions')}
                          >
                            Manage →
                          </button>
                        </div>
                        <div style={{ height: '260px' }} className="d-flex align-items-center justify-content-center">
                          <Doughnut
                            data={questionDoughnutData}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              cutout: '66%',
                              plugins: {
                                legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } },
                              },
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: System Status + Recent Users + Quick Admin Controls */}
                  <div className="row g-3">
                    {/* Recent Users Widget */}
                    <div className="col-12 col-lg-5">
                      <div
                        className="card bg-white p-4 h-100"
                        style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <h6 className="fw-bold text-dark mb-0">Recent Users</h6>
                            <span className="text-muted small">Latest accounts registered on CareerAI</span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-decoration-none fw-semibold p-0"
                            style={{ color: '#4F46E5' }}
                            onClick={() => setActiveTab('users')}
                          >
                            View All
                          </button>
                        </div>
                        <div className="d-flex flex-column gap-3">
                          {users.slice(0, 5).map((u) => (
                            <div
                              key={u.id}
                              className="d-flex align-items-center justify-content-between pb-2 border-bottom"
                            >
                              <div className="d-flex align-items-center gap-2 min-w-0">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    backgroundColor: '#EEF2FF',
                                    color: '#4F46E5',
                                    fontSize: '12px',
                                  }}
                                >
                                  {getInitials(u.full_name || u.email)}
                                </div>
                                <div className="text-truncate">
                                  <div className="fw-semibold text-dark small text-truncate">
                                    {u.full_name || u.username}
                                  </div>
                                  <div className="text-muted text-truncate" style={{ fontSize: '11.5px' }}>
                                    {u.email}
                                  </div>
                                </div>
                              </div>
                              <span
                                className="badge rounded-pill text-capitalize"
                                style={{
                                  backgroundColor: u.role === 'admin' ? '#EEF2FF' : '#F1F5F9',
                                  color: u.role === 'admin' ? '#4F46E5' : '#475569',
                                  fontSize: '11px',
                                }}
                              >
                                {u.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* System Status & Diagnostics Widget */}
                    <div className="col-12 col-lg-4">
                      <div
                        className="card bg-white p-4 h-100"
                        style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}
                      >
                        <div className="mb-3">
                          <h6 className="fw-bold text-dark mb-0">System Status</h6>
                          <span className="small fw-medium" style={{ color: '#10B981' }}>
                            All core services operational
                          </span>
                        </div>
                        <div className="d-flex flex-column gap-3 small">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Web Application (Django REST)</span>
                            <span className="fw-semibold" style={{ color: '#10B981' }}>
                              ● Operational
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Database ({health.database_engine || 'SQLite3'})</span>
                            <span className="fw-semibold" style={{ color: '#10B981' }}>
                              ● {health.database || 'Healthy'}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">AI Evaluation Engine</span>
                            <span className="fw-semibold" style={{ color: '#10B981' }}>
                              ● {health.ai_provider || 'Active'}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted">Heuristic Fallback Engine</span>
                            <span className="fw-semibold" style={{ color: '#10B981' }}>
                              ● Standby Ready
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                            <span className="text-muted">Runtime Environment</span>
                            <span className="fw-semibold text-dark">
                              Python {health.python_version || '3.x'} · Django {health.django_version || '4.2'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Admin Quick Actions Widget */}
                    <div className="col-12 col-lg-3">
                      <div
                        className="card bg-white p-4 h-100"
                        style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}
                      >
                        <h6 className="fw-bold text-dark mb-1">Admin Controls</h6>
                        <p className="text-muted small mb-3">Direct catalog & access actions</p>
                        <div className="d-flex flex-column gap-2">
                          <button
                            type="button"
                            className="btn text-white fw-semibold d-flex align-items-center justify-content-center gap-2 py-2"
                            style={{ backgroundColor: '#4F46E5', borderRadius: '10px', fontSize: '13.5px' }}
                            onClick={() => {
                              setActiveTab('jobs');
                              openCreateJobModal();
                            }}
                          >
                            <i className="bi bi-plus-circle"></i> Post New Job
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-primary fw-semibold d-flex align-items-center justify-content-center gap-2 py-2"
                            style={{ borderRadius: '10px', fontSize: '13.5px' }}
                            onClick={() => {
                              setActiveTab('questions');
                              openCreateQuestionModal();
                            }}
                          >
                            <i className="bi bi-plus-square"></i> Add Interview Question
                          </button>
                          <button
                            type="button"
                            className="btn btn-light border fw-semibold d-flex align-items-center justify-content-center gap-2 py-2"
                            style={{ borderRadius: '10px', fontSize: '13.5px' }}
                            onClick={() => setActiveTab('users')}
                          >
                            <i className="bi bi-person-gear"></i> Manage User Roles
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==================== TAB 2: USER MANAGEMENT ==================== */}
              {activeTab === 'users' && (
                <div>
                  {/* User KPI Strip */}
                  <div className="row g-3 mb-4">
                    <div className="col-6 col-lg-3">
                      <div className="card bg-white p-3" style={{ borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                        <div className="text-muted small">Total Users</div>
                        <div className="fs-3 fw-bold text-dark">{users.length}</div>
                      </div>
                    </div>
                    <div className="col-6 col-lg-3">
                      <div className="card bg-white p-3" style={{ borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                        <div className="text-muted small">Active Accounts</div>
                        <div className="fs-3 fw-bold" style={{ color: '#10B981' }}>
                          {users.filter((u) => u.is_active).length}
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-lg-3">
                      <div className="card bg-white p-3" style={{ borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                        <div className="text-muted small">Administrators</div>
                        <div className="fs-3 fw-bold" style={{ color: '#4F46E5' }}>
                          {users.filter((u) => u.role === 'admin').length}
                        </div>
                      </div>
                    </div>
                    <div className="col-6 col-lg-3">
                      <div className="card bg-white p-3" style={{ borderRadius: '14px', border: '1px solid #E2E8F0' }}>
                        <div className="text-muted small">Suspended / Inactive</div>
                        <div className="fs-3 fw-bold text-danger">
                          {users.filter((u) => !u.is_active).length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filters Bar */}
                  <div
                    className="card bg-white p-3 mb-4"
                    style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}
                  >
                    <div className="row g-2 align-items-center">
                      <div className="col-12 col-md-5">
                        <div className="input-group">
                          <span className="input-group-text bg-white border-end-0 text-muted">
                            <i className="bi bi-search"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control border-start-0 ps-0"
                            placeholder="Search users by name or email..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <select
                          className="form-select"
                          value={userStatusFilter}
                          onChange={(e) => setUserStatusFilter(e.target.value)}
                        >
                          <option value="all">Status: All Users</option>
                          <option value="active">Active Only</option>
                          <option value="inactive">Disabled / Inactive</option>
                        </select>
                      </div>
                      <div className="col-6 col-md-2">
                        <select
                          className="form-select"
                          value={userRoleFilter}
                          onChange={(e) => setUserRoleFilter(e.target.value)}
                        >
                          <option value="all">Role: All</option>
                          <option value="candidate">Candidate</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="col-12 col-md-2">
                        <button
                          type="button"
                          className="btn btn-light border w-100"
                          onClick={() => {
                            setUserSearch('');
                            setUserRoleFilter('all');
                            setUserStatusFilter('all');
                          }}
                        >
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Users Table + Slide-Over Details Panel */}
                  <div className="row g-3">
                    <div className={selectedUser ? 'col-12 col-xl-8' : 'col-12'}>
                      <div
                        className="card bg-white overflow-hidden"
                        style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}
                      >
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0">
                            <thead style={{ backgroundColor: '#F8FAFC' }}>
                              <tr className="text-muted small">
                                <th className="ps-4 py-3">User</th>
                                <th className="py-3">Role</th>
                                <th className="py-3 text-center">Resumes</th>
                                <th className="py-3 text-center">Apps</th>
                                <th className="py-3 text-center">Interviews</th>
                                <th className="py-3">Status</th>
                                <th className="py-3 text-end pe-4">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredUsers.length === 0 ? (
                                <tr>
                                  <td colSpan="7" className="text-center py-5 text-muted">
                                    No users match your current filter criteria.
                                  </td>
                                </tr>
                              ) : (
                                filteredUsers.map((u) => {
                                  const isSelf = u.email === user?.email;
                                  return (
                                    <tr key={u.id}>
                                      <td className="ps-4 py-3">
                                        <div className="d-flex align-items-center gap-2">
                                          <div
                                            className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                            style={{
                                              width: '36px',
                                              height: '36px',
                                              backgroundColor: '#EEF2FF',
                                              color: '#4F46E5',
                                              fontSize: '12px',
                                            }}
                                          >
                                            {getInitials(u.full_name || u.email)}
                                          </div>
                                          <div>
                                            <div className="fw-semibold text-dark small d-flex align-items-center gap-2">
                                              {u.full_name || u.username}
                                              {isSelf && (
                                                <span
                                                  className="badge rounded-pill"
                                                  style={{
                                                    backgroundColor: '#EEF2FF',
                                                    color: '#4F46E5',
                                                    fontSize: '10px',
                                                  }}
                                                >
                                                  You
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-muted" style={{ fontSize: '12px' }}>
                                              {u.email}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td>
                                        <select
                                          className="form-select form-select-sm"
                                          style={{ width: '115px', borderRadius: '8px' }}
                                          value={u.role}
                                          disabled={isSelf}
                                          onChange={(e) => handleUserRoleChange(u, e.target.value)}
                                        >
                                          <option value="candidate">Candidate</option>
                                          <option value="admin">Admin</option>
                                        </select>
                                      </td>
                                      <td className="text-center fw-semibold small">{u.resumes_count ?? 0}</td>
                                      <td className="text-center fw-semibold small">{u.applications_count ?? 0}</td>
                                      <td className="text-center fw-semibold small">{u.interviews_count ?? 0}</td>
                                      <td>
                                        <span
                                          className="badge rounded-pill px-2 py-1"
                                          style={{
                                            backgroundColor: u.is_active ? '#ECFDF5' : '#FEF2F2',
                                            color: u.is_active ? '#10B981' : '#EF4444',
                                            fontSize: '11px',
                                          }}
                                        >
                                          ● {u.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                      </td>
                                      <td className="text-end pe-4">
                                        <div className="d-inline-flex gap-1">
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-light border"
                                            title="View User Details"
                                            onClick={() => setSelectedUser(u)}
                                          >
                                            <i className="bi bi-eye"></i>
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-light border"
                                            disabled={isSelf}
                                            title={u.is_active ? 'Disable User' : 'Enable User'}
                                            onClick={() =>
                                              setUserConfirmModal({
                                                type: u.is_active ? 'disable' : 'enable',
                                                target: u,
                                              })
                                            }
                                          >
                                            <i
                                              className={`bi ${
                                                u.is_active
                                                  ? 'bi-slash-circle text-warning'
                                                  : 'bi-check-circle text-success'
                                              }`}
                                            ></i>
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-light border text-danger"
                                            disabled={isSelf}
                                            title="Delete User"
                                            onClick={() =>
                                              setUserConfirmModal({ type: 'delete', target: u })
                                            }
                                          >
                                            <i className="bi bi-trash"></i>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Slide-Over User Details Card */}
                    {selectedUser && (
                      <div className="col-12 col-xl-4">
                        <div
                          className="card bg-white p-4"
                          style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}
                        >
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold text-dark mb-0">User Details</h6>
                            <button
                              type="button"
                              className="btn-close btn-sm"
                              onClick={() => setSelectedUser(null)}
                            ></button>
                          </div>

                          <div className="d-flex align-items-center gap-3 pb-3 mb-3 border-bottom">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                              style={{
                                width: '52px',
                                height: '52px',
                                backgroundColor: '#4F46E5',
                                fontSize: '18px',
                              }}
                            >
                              {getInitials(selectedUser.full_name || selectedUser.email)}
                            </div>
                            <div>
                              <div className="fw-bold text-dark">
                                {selectedUser.full_name || selectedUser.username}
                              </div>
                              <div className="text-muted small">{selectedUser.email}</div>
                              <span
                                className="badge rounded-pill mt-1"
                                style={{
                                  backgroundColor: selectedUser.is_active ? '#ECFDF5' : '#FEF2F2',
                                  color: selectedUser.is_active ? '#10B981' : '#EF4444',
                                  fontSize: '11px',
                                }}
                              >
                                ● {selectedUser.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>

                          <div className="d-flex flex-column gap-2 small mb-4">
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">User ID</span>
                              <span className="fw-semibold text-dark">USR-{selectedUser.id}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Account Role</span>
                              <span className="fw-semibold text-capitalize text-dark">
                                {selectedUser.role}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Registration Date</span>
                              <span className="fw-semibold text-dark">
                                {selectedUser.date_joined
                                  ? new Date(selectedUser.date_joined).toLocaleDateString()
                                  : 'N/A'}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Last Login</span>
                              <span className="fw-semibold text-dark">
                                {selectedUser.last_login
                                  ? new Date(selectedUser.last_login).toLocaleString()
                                  : 'Never'}
                              </span>
                            </div>
                          </div>

                          <div
                            className="p-3 rounded-3 mb-3"
                            style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                          >
                            <div className="row text-center g-2">
                              <div className="col-4">
                                <div className="text-muted" style={{ fontSize: '11px' }}>
                                  Resumes
                                </div>
                                <div className="fw-bold fs-5 text-dark">
                                  {selectedUser.resumes_count ?? 0}
                                </div>
                              </div>
                              <div className="col-4">
                                <div className="text-muted" style={{ fontSize: '11px' }}>
                                  Applications
                                </div>
                                <div className="fw-bold fs-5 text-dark">
                                  {selectedUser.applications_count ?? 0}
                                </div>
                              </div>
                              <div className="col-4">
                                <div className="text-muted" style={{ fontSize: '11px' }}>
                                  Interviews
                                </div>
                                <div className="fw-bold fs-5 text-dark">
                                  {selectedUser.interviews_count ?? 0}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ==================== TAB 3: JOB CATALOG MANAGEMENT ==================== */}
              {activeTab === 'jobs' && (
                <div>
                  {/* Toolbar */}
                  <div
                    className="card bg-white p-3 mb-4"
                    style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}
                  >
                    <div className="row g-2 align-items-center">
                      <div className="col-12 col-md-5">
                        <div className="input-group">
                          <span className="input-group-text bg-white border-end-0 text-muted">
                            <i className="bi bi-search"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control border-start-0 ps-0"
                            placeholder="Search job title, company, or location..."
                            value={jobSearch}
                            onChange={(e) => setJobSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <select
                          className="form-select"
                          value={jobStatusFilter}
                          onChange={(e) => setJobStatusFilter(e.target.value)}
                        >
                          <option value="all">All Listings ({jobs.length})</option>
                          <option value="active">Active Only</option>
                          <option value="inactive">Archived / Hidden</option>
                        </select>
                      </div>
                      <div className="col-6 col-md-4 text-end">
                        <button
                          type="button"
                          className="btn text-white fw-semibold px-4"
                          style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
                          onClick={openCreateJobModal}
                        >
                          <i className="bi bi-plus-lg me-1"></i> Add Job Posting
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Jobs Table */}
                  <div
                    className="card bg-white overflow-hidden"
                    style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}
                  >
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead style={{ backgroundColor: '#F8FAFC' }}>
                          <tr className="text-muted small">
                            <th className="ps-4 py-3">Role & Company</th>
                            <th className="py-3">Location & Type</th>
                            <th className="py-3">Required Skills</th>
                            <th className="py-3">Status</th>
                            <th className="py-3 text-end pe-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredJobs.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center py-5 text-muted">
                                No job postings found. Click "Add Job Posting" to create one.
                              </td>
                            </tr>
                          ) : (
                            filteredJobs.map((job) => (
                              <tr key={job.id}>
                                <td className="ps-4 py-3">
                                  <div className="fw-bold text-dark small">{job.title}</div>
                                  <div className="text-muted" style={{ fontSize: '12px' }}>
                                    {job.company} {job.salary_range ? `· ${job.salary_range}` : ''}
                                  </div>
                                </td>
                                <td>
                                  <div className="small text-dark">{job.location}</div>
                                  <span className="badge bg-light text-secondary border" style={{ fontSize: '11px' }}>
                                    {job.job_type} · {job.experience_level}
                                  </span>
                                </td>
                                <td>
                                  <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '280px' }}>
                                    {(job.required_skills || []).slice(0, 4).map((skill, idx) => (
                                      <span
                                        key={idx}
                                        className="badge rounded-pill"
                                        style={{
                                          backgroundColor: '#EEF2FF',
                                          color: '#4F46E5',
                                          fontSize: '11px',
                                        }}
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                    {(job.required_skills || []).length > 4 && (
                                      <span className="badge bg-light text-muted border" style={{ fontSize: '11px' }}>
                                        +{job.required_skills.length - 4}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <span
                                    className="badge rounded-pill px-2 py-1"
                                    style={{
                                      backgroundColor: job.is_active ? '#ECFDF5' : '#F1F5F9',
                                      color: job.is_active ? '#10B981' : '#64748B',
                                      fontSize: '11px',
                                    }}
                                  >
                                    ● {job.is_active ? 'Active' : 'Archived'}
                                  </span>
                                </td>
                                <td className="text-end pe-4">
                                  <div className="d-inline-flex gap-1">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-light border"
                                      title="Edit Job"
                                      onClick={() => openEditJobModal(job)}
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-light border"
                                      title={job.is_active ? 'Archive Job' : 'Activate Job'}
                                      onClick={() => handleToggleJobActive(job)}
                                    >
                                      <i
                                        className={`bi ${
                                          job.is_active ? 'bi-eye-slash text-warning' : 'bi-eye text-success'
                                        }`}
                                      ></i>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-light border text-danger"
                                      title="Delete Job"
                                      onClick={() => setJobDeleteTarget(job)}
                                    >
                                      <i className="bi bi-trash"></i>
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
              )}

              {/* ==================== TAB 4: QUESTION BANK MANAGEMENT ==================== */}
              {activeTab === 'questions' && (
                <div>
                  {/* Toolbar */}
                  <div
                    className="card bg-white p-3 mb-4"
                    style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}
                  >
                    <div className="row g-2 align-items-center">
                      <div className="col-12 col-md-5">
                        <div className="input-group">
                          <span className="input-group-text bg-white border-end-0 text-muted">
                            <i className="bi bi-search"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control border-start-0 ps-0"
                            placeholder="Search question text or target role..."
                            value={questionSearch}
                            onChange={(e) => setQuestionSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-6 col-md-3">
                        <select
                          className="form-select"
                          value={questionCategoryFilter}
                          onChange={(e) => setQuestionCategoryFilter(e.target.value)}
                        >
                          <option value="All">Category: All ({questions.length})</option>
                          <option value="Technical">Technical</option>
                          <option value="Behavioral">Behavioral</option>
                          <option value="HR">HR</option>
                          <option value="Project-based">Project-based</option>
                        </select>
                      </div>
                      <div className="col-6 col-md-4 text-end">
                        <button
                          type="button"
                          className="btn text-white fw-semibold px-4"
                          style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
                          onClick={openCreateQuestionModal}
                        >
                          <i className="bi bi-plus-lg me-1"></i> Add Question
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Questions Table */}
                  <div
                    className="card bg-white overflow-hidden"
                    style={{ borderRadius: '16px', border: '1px solid #E2E8F0' }}
                  >
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead style={{ backgroundColor: '#F8FAFC' }}>
                          <tr className="text-muted small">
                            <th className="ps-4 py-3">Interview Question</th>
                            <th className="py-3">Category</th>
                            <th className="py-3">Difficulty</th>
                            <th className="py-3">Target Role</th>
                            <th className="py-3 text-end pe-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredQuestions.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center py-5 text-muted">
                                No questions found matching your filters.
                              </td>
                            </tr>
                          ) : (
                            filteredQuestions.map((q) => (
                              <tr key={q.id}>
                                <td className="ps-4 py-3" style={{ maxWidth: '460px' }}>
                                  <div className="fw-semibold text-dark small">{q.question_text}</div>
                                  {q.sample_answer && (
                                    <div
                                      className="text-muted text-truncate mt-1"
                                      style={{ fontSize: '12px' }}
                                    >
                                      Model Guide: {q.sample_answer}
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <span
                                    className="badge rounded-pill"
                                    style={{
                                      backgroundColor: '#EEF2FF',
                                      color: '#4F46E5',
                                      fontSize: '11px',
                                    }}
                                  >
                                    {q.category}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className="badge rounded-pill"
                                    style={{
                                      backgroundColor:
                                        q.difficulty === 'Hard'
                                          ? '#FEF2F2'
                                          : q.difficulty === 'Medium'
                                          ? '#FFFBEB'
                                          : '#ECFDF5',
                                      color:
                                        q.difficulty === 'Hard'
                                          ? '#EF4444'
                                          : q.difficulty === 'Medium'
                                          ? '#D97706'
                                          : '#10B981',
                                      fontSize: '11px',
                                    }}
                                  >
                                    {q.difficulty}
                                  </span>
                                </td>
                                <td className="small text-muted">{q.role_target}</td>
                                <td className="text-end pe-4">
                                  <div className="d-inline-flex gap-1">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-light border"
                                      title="Edit Question"
                                      onClick={() => openEditQuestionModal(q)}
                                    >
                                      <i className="bi bi-pencil"></i>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-light border text-danger"
                                      title="Delete Question"
                                      onClick={() => setQuestionDeleteTarget(q)}
                                    >
                                      <i className="bi bi-trash"></i>
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
              )}
            </>
          )}
        </main>
      </div>

      {/* ==================== MODAL 1: USER DISABLE / DELETE CONFIRMATION ==================== */}
      {userConfirmModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-2" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="modal-body p-4">
                <div className="d-flex align-items-start gap-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: '44px',
                      height: '44px',
                      backgroundColor:
                        userConfirmModal.type === 'delete'
                          ? '#FEF2F2'
                          : userConfirmModal.type === 'disable'
                          ? '#FFFBEB'
                          : '#ECFDF5',
                      color:
                        userConfirmModal.type === 'delete'
                          ? '#EF4444'
                          : userConfirmModal.type === 'disable'
                          ? '#F59E0B'
                          : '#10B981',
                    }}
                  >
                    <i
                      className={`bi fs-5 ${
                        userConfirmModal.type === 'delete'
                          ? 'bi-exclamation-triangle-fill'
                          : userConfirmModal.type === 'disable'
                          ? 'bi-slash-circle-fill'
                          : 'bi-check-circle-fill'
                      }`}
                    ></i>
                  </div>
                  <div>
                    <h5 className="fw-bold text-dark mb-1">
                      {userConfirmModal.type === 'delete'
                        ? 'Delete User'
                        : userConfirmModal.type === 'disable'
                        ? 'Disable User'
                        : 'Activate User'}
                    </h5>
                    <p className="text-muted small mb-0">
                      {userConfirmModal.type === 'delete' &&
                        `Are you sure you want to permanently delete ${userConfirmModal.target.email}? All user resumes, applications, and interview history will be removed.`}
                      {userConfirmModal.type === 'disable' &&
                        `Are you sure you want to disable ${userConfirmModal.target.email}? They will not be able to sign in until reactivated.`}
                      {userConfirmModal.type === 'enable' &&
                        `Restore platform login access for ${userConfirmModal.target.email}?`}
                    </p>
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-light border px-3"
                    onClick={() => setUserConfirmModal(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`btn px-3 fw-semibold text-white ${
                      userConfirmModal.type === 'delete'
                        ? 'btn-danger'
                        : userConfirmModal.type === 'disable'
                        ? 'btn-warning'
                        : 'btn-success'
                    }`}
                    onClick={handleConfirmUserAction}
                  >
                    {userConfirmModal.type === 'delete'
                      ? 'Yes, Delete User'
                      : userConfirmModal.type === 'disable'
                      ? 'Yes, Disable User'
                      : 'Yes, Activate User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: ADD / EDIT JOB POSTING ==================== */}
      {showJobModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark">
                  {editingJob ? 'Edit Job Posting' : 'Publish New Job Posting'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowJobModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSaveJob}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Job Title *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Senior Backend Engineer"
                        value={jobForm.title}
                        onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Company *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. TechCorp Solutions"
                        value={jobForm.company}
                        onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Location</label>
                      <input
                        type="text"
                        className="form-control"
                        value={jobForm.location}
                        onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Employment Type</label>
                      <select
                        className="form-select"
                        value={jobForm.job_type}
                        onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value })}
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                        <option value="Remote">Remote</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Experience Level</label>
                      <select
                        className="form-select"
                        value={jobForm.experience_level}
                        onChange={(e) =>
                          setJobForm({ ...jobForm, experience_level: e.target.value })
                        }
                      >
                        <option value="Entry Level">Entry Level</option>
                        <option value="Mid Level">Mid Level</option>
                        <option value="Senior Level">Senior Level</option>
                        <option value="Expert Level">Expert Level</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Salary Range</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. ₹12 LPA – ₹18 LPA"
                        value={jobForm.salary_range}
                        onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">
                        Min. Experience (Years)
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="form-control"
                        value={jobForm.min_experience_years}
                        onChange={(e) =>
                          setJobForm({ ...jobForm, min_experience_years: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">
                        Required Skills (comma-separated) *
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Python, Django, REST API, PostgreSQL, Docker"
                        value={jobForm.required_skills}
                        onChange={(e) =>
                          setJobForm({ ...jobForm, required_skills: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">
                        Preferred Skills (comma-separated)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="AWS, Redis, CI/CD"
                        value={jobForm.preferred_skills}
                        onChange={(e) =>
                          setJobForm({ ...jobForm, preferred_skills: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Job Description *</label>
                      <textarea
                        rows="3"
                        className="form-control"
                        placeholder="Describe responsibilities, technical stack, and team impact..."
                        value={jobForm.description}
                        onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                        required
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-light border"
                    onClick={() => setShowJobModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white fw-semibold px-4"
                    style={{ backgroundColor: '#4F46E5' }}
                  >
                    {editingJob ? 'Save Changes' : 'Publish Job'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: DELETE JOB CONFIRMATION ==================== */}
      {jobDeleteTarget && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4" style={{ borderRadius: '16px', border: 'none' }}>
              <h5 className="fw-bold text-dark mb-1">Delete Job Posting</h5>
              <p className="text-muted small mb-4">
                Are you sure you want to delete <strong>{jobDeleteTarget.title}</strong> at{' '}
                {jobDeleteTarget.company}? This action cannot be undone.
              </p>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => setJobDeleteTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger fw-semibold"
                  onClick={handleConfirmDeleteJob}
                >
                  Delete Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 4: ADD / EDIT INTERVIEW QUESTION ==================== */}
      {showQuestionModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '16px', border: 'none' }}>
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark">
                  {editingQuestion ? 'Edit Interview Question' : 'Add Interview Question'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowQuestionModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSaveQuestion}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Category</label>
                      <select
                        className="form-select"
                        value={questionForm.category}
                        onChange={(e) =>
                          setQuestionForm({ ...questionForm, category: e.target.value })
                        }
                      >
                        <option value="Technical">Technical</option>
                        <option value="Behavioral">Behavioral</option>
                        <option value="HR">HR</option>
                        <option value="Project-based">Project-based</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Difficulty</label>
                      <select
                        className="form-select"
                        value={questionForm.difficulty}
                        onChange={(e) =>
                          setQuestionForm({ ...questionForm, difficulty: e.target.value })
                        }
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Target Role</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Full Stack Developer"
                        value={questionForm.role_target}
                        onChange={(e) =>
                          setQuestionForm({ ...questionForm, role_target: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Question Prompt *</label>
                      <textarea
                        rows="3"
                        className="form-control"
                        placeholder="Enter the interview question..."
                        value={questionForm.question_text}
                        onChange={(e) =>
                          setQuestionForm({ ...questionForm, question_text: e.target.value })
                        }
                        required
                      ></textarea>
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">
                        Ideal Key Talking Points (comma-separated)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Database indexing, Query optimization, Caching strategy"
                        value={questionForm.ideal_points}
                        onChange={(e) =>
                          setQuestionForm({ ...questionForm, ideal_points: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Sample / Model Answer</label>
                      <textarea
                        rows="3"
                        className="form-control"
                        placeholder="Provide an exemplary reference answer for candidate study & AI evaluation..."
                        value={questionForm.sample_answer}
                        onChange={(e) =>
                          setQuestionForm({ ...questionForm, sample_answer: e.target.value })
                        }
                      ></textarea>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-light border"
                    onClick={() => setShowQuestionModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn text-white fw-semibold px-4"
                    style={{ backgroundColor: '#4F46E5' }}
                  >
                    {editingQuestion ? 'Save Question' : 'Add to Question Bank'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 5: DELETE QUESTION CONFIRMATION ==================== */}
      {questionDeleteTarget && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content p-4" style={{ borderRadius: '16px', border: 'none' }}>
              <h5 className="fw-bold text-dark mb-1">Delete Interview Question</h5>
              <p className="text-muted small mb-4">
                Are you sure you want to remove this prompt from the Question Bank?
              </p>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={() => setQuestionDeleteTarget(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger fw-semibold"
                  onClick={handleConfirmDeleteQuestion}
                >
                  Delete Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;