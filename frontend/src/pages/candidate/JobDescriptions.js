import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { applicationService } from '../../services/applicationService';

const EXPERIENCE_LEVELS = ['All', 'Entry Level', 'Mid Level', 'Senior Level', 'Lead'];

const JobDescriptions = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');

  // Modals
  const [selectedJob, setSelectedJob] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalTab, setModalTab] = useState('parser'); // 'parser' | 'manual'
  const [rawJobText, setRawJobText] = useState('');
  const [parsingText, setParsingText] = useState(false);
  const [submittingJob, setSubmittingJob] = useState(false);

  const [newJobForm, setNewJobForm] = useState({
    title: '',
    company: '',
    location: 'Bengaluru / Hybrid',
    salary_range: '8 - 14 LPA',
    experience_level: 'Entry Level',
    min_experience: 1,
    required_skills: '',
    preferred_skills: '',
    description: '',
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/jobs/');
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setJobs(list);
    } catch (err) {
      showToast('danger', 'Unable to load job descriptions from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSeedSampleJobs = async () => {
    setSeeding(true);
    try {
      await api.post('/jobs/seed/');
      await fetchJobs();
      showToast('success', 'Sample industry roles seeded successfully!');
    } catch (err) {
      showToast('danger', err.response?.data?.detail || 'Could not seed sample jobs.');
    } finally {
      setSeeding(false);
    }
  };

  const handleParseRawText = async () => {
    if (!rawJobText.trim()) {
      showToast('danger', 'Please paste a job description first.');
      return;
    }
    setParsingText(true);
    try {
      const res = await api.post('/jobs/parse/', {
        raw_text: rawJobText,
        description: rawJobText,
      });
      const parsed = res.data?.parsed_data || res.data || {};
      const extractedSkills = Array.isArray(parsed.required_skills)
        ? parsed.required_skills.join(', ')
        : parsed.required_skills || '';
      const extractedPref = Array.isArray(parsed.preferred_skills)
        ? parsed.preferred_skills.join(', ')
        : parsed.preferred_skills || '';

      setNewJobForm((prev) => ({
        ...prev,
        title: parsed.title || prev.title || 'Software Engineer',
        company: parsed.company || prev.company || 'Tech Enterprise',
        location: parsed.location || prev.location,
        salary_range: parsed.salary_range || prev.salary_range,
        experience_level: parsed.experience_level || prev.experience_level,
        min_experience: parsed.min_experience ?? prev.min_experience,
        required_skills: extractedSkills,
        preferred_skills: extractedPref,
        description: rawJobText,
      }));
      setModalTab('manual');
      showToast('success', 'Job requirements extracted! Review and save below.');
    } catch (err) {
      // Lightweight client-side fallback extraction if endpoint differs
      const commonSkills = [
        'Python', 'Django', 'React', 'JavaScript', 'SQL', 'PostgreSQL', 'Docker',
        'AWS', 'Git', 'REST API', 'Node.js', 'TypeScript', 'Java', 'HTML', 'CSS',
      ];
      const detected = commonSkills.filter((skill) =>
        rawJobText.toLowerCase().includes(skill.toLowerCase())
      );
      setNewJobForm((prev) => ({
        ...prev,
        required_skills: detected.join(', '),
        description: rawJobText,
      }));
      setModalTab('manual');
      showToast('success', 'Extracted matching skills into form. Please review before saving.');
    } finally {
      setParsingText(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setSubmittingJob(true);
    try {
      const reqSkillsArr = newJobForm.required_skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const prefSkillsArr = newJobForm.preferred_skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await api.post('/jobs/', {
        ...newJobForm,
        min_experience: Number(newJobForm.min_experience) || 0,
        required_skills: reqSkillsArr,
        preferred_skills: prefSkillsArr,
      });

      setShowCreateModal(false);
      setRawJobText('');
      setNewJobForm({
        title: '',
        company: '',
        location: 'Bengaluru / Hybrid',
        salary_range: '8 - 14 LPA',
        experience_level: 'Entry Level',
        min_experience: 1,
        required_skills: '',
        preferred_skills: '',
        description: '',
      });
      await fetchJobs();
      showToast('success', 'New job posting added to the catalog!');
    } catch (err) {
      showToast('danger', err.response?.data?.detail || 'Failed to save job posting.');
    } finally {
      setSubmittingJob(false);
    }
  };

  const handleSaveToTracker = async (job) => {
    setSavingId(job.id);
    try {
      await applicationService.createOrUpdateApplication(job.id, 'Saved', '');
      showToast('success', `"${job.title}" saved to your Application Tracker!`);
    } catch (err) {
      showToast('danger', 'Could not save job to Application Tracker.');
    } finally {
      setSavingId(null);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase();
    const skillsStr = Array.isArray(job.required_skills)
      ? job.required_skills.join(' ').toLowerCase()
      : String(job.required_skills || '').toLowerCase();

    const matchesQuery =
      !q ||
      job.title?.toLowerCase().includes(q) ||
      job.company?.toLowerCase().includes(q) ||
      skillsStr.includes(q);

    const matchesExp =
      experienceFilter === 'All' ||
      (job.experience_level || '').toLowerCase().includes(experienceFilter.toLowerCase());

    const matchesLoc =
      !locationFilter.trim() ||
      (job.location || '').toLowerCase().includes(locationFilter.toLowerCase());

    return matchesQuery && matchesExp && matchesLoc;
  });

  const cardStyle = {
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  };

  const getSkillsArray = (skillsField) => {
    if (Array.isArray(skillsField)) return skillsField;
    if (typeof skillsField === 'string') {
      return skillsField.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  return (
    <div className="py-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="container">
        {/* Inline Toast Notification */}
        {toast && (
          <div
            className={`alert alert-${toast.type} d-flex align-items-center justify-content-between rounded-4 shadow-sm mb-4`}
            role="alert"
          >
            <div className="small fw-semibold">
              <i
                className={`bi ${
                  toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'
                } me-2`}
              ></i>
              {toast.message}
            </div>
            <button type="button" className="btn-close btn-sm" onClick={() => setToast(null)}></button>
          </div>
        )}

        {/* Top SaaS Header */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <span
              className="badge rounded-pill px-3 py-1 fw-semibold mb-1"
              style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11.5px' }}
            >
              <i className="bi bi-briefcase-fill me-1"></i> Opportunities Catalog
            </span>
            <h2 className="fw-bold mb-1" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
              Job Descriptions &amp; Role Explorer
            </h2>
            <p className="text-muted small mb-0">
              Browse curated job openings or paste any external job description to extract skills and check fit.
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              disabled={seeding}
              onClick={handleSeedSampleJobs}
              className="btn btn-sm bg-white fw-semibold px-3 py-2"
              style={{ border: '1px solid #CBD5E1', color: '#334155', borderRadius: '10px' }}
            >
              <i className="bi bi-database-add me-1 text-primary"></i>
              {seeding ? 'Seeding...' : 'Seed Sample Jobs'}
            </button>
            <button
              type="button"
              onClick={() => {
                setModalTab('parser');
                setShowCreateModal(true);
              }}
              className="btn btn-sm text-white fw-semibold px-3 py-2 shadow-sm"
              style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
            >
              <i className="bi bi-plus-lg me-1"></i> Add / Parse Job
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="card bg-white p-3 p-md-4 mb-4" style={cardStyle}>
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
                  placeholder="Search by job title, company, or skill (e.g. Python, React)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-6 col-lg-3">
              <div className="input-group">
                <span
                  className="input-group-text border-end-0"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}
                >
                  <i className="bi bi-geo-alt text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', fontSize: '13.5px' }}
                  placeholder="Location (e.g. Remote, Bengaluru)"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-6 col-lg-4 d-flex flex-wrap justify-content-lg-end gap-1">
              {EXPERIENCE_LEVELS.map((lvl) => {
                const active = experienceFilter === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setExperienceFilter(lvl)}
                    className="btn btn-sm fw-semibold px-2.5 py-1"
                    style={{
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      backgroundColor: active ? '#4F46E5' : '#F8FAFC',
                      color: active ? '#FFFFFF' : '#475569',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Job Cards Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: '#4F46E5' }} role="status"></div>
            <div className="text-muted small mt-2">Loading job descriptions...</div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="card bg-white p-5 text-center" style={cardStyle}>
            <i className="bi bi-briefcase fs-1 text-muted"></i>
            <h5 className="fw-bold text-dark mt-3">No Matching Job Descriptions Found</h5>
            <p className="text-muted small mb-3">
              Clear your search filters, seed sample roles, or paste a custom job description to get started.
            </p>
            <div className="d-flex justify-content-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setExperienceFilter('All');
                  setLocationFilter('');
                }}
                className="btn btn-sm bg-white fw-semibold px-3"
                style={{ border: '1px solid #CBD5E1', color: '#334155', borderRadius: '10px' }}
              >
                Reset Filters
              </button>
              <button
                type="button"
                onClick={handleSeedSampleJobs}
                className="btn btn-sm text-white fw-semibold px-3"
                style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
              >
                Seed Sample Jobs
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {filteredJobs.map((job) => {
              const reqSkills = getSkillsArray(job.required_skills);
              return (
                <div key={job.id} className="col-lg-6">
                  <div className="card bg-white p-4 h-100 d-flex flex-column justify-content-between hover-card" style={cardStyle}>
                    <div>
                      {/* Card Header */}
                      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                        <div className="d-flex align-items-start gap-3">
                          <div
                            className="d-inline-flex align-items-center justify-content-center rounded-3 fw-bold flex-shrink-0"
                            style={{
                              width: '48px',
                              height: '48px',
                              backgroundColor: '#EEF2FF',
                              color: '#4F46E5',
                              fontSize: '16px',
                            }}
                          >
                            {(job.company || 'CO').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h5 className="fw-bold text-dark mb-1">{job.title}</h5>
                            <div className="text-muted small">
                              <strong className="text-dark fw-semibold">{job.company}</strong> •{' '}
                              <i className="bi bi-geo-alt me-1"></i>
                              {job.location || 'Remote'}
                            </div>
                          </div>
                        </div>

                        {job.salary_range && (
                          <span
                            className="badge rounded-pill px-3 py-2 fw-semibold flex-shrink-0"
                            style={{
                              backgroundColor: '#ECFDF5',
                              color: '#059669',
                              border: '1px solid #A7F3D0',
                              fontSize: '12px',
                            }}
                          >
                            {job.salary_range}
                          </span>
                        )}
                      </div>

                      {/* Experience & Metadata Badges */}
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <span
                          className="badge rounded-pill px-2.5 py-1 fw-medium"
                          style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '11.5px' }}
                        >
                          <i className="bi bi-award me-1"></i>
                          {job.experience_level || 'Entry Level'} ({job.min_experience ?? 0}+ yrs)
                        </span>
                        <span
                          className="badge rounded-pill px-2.5 py-1 fw-medium"
                          style={{ backgroundColor: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', fontSize: '11.5px' }}
                        >
                          Full-Time
                        </span>
                      </div>

                      {/* Description Excerpt */}
                      <p
                        className="text-muted small mb-3"
                        style={{
                          lineHeight: 1.6,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {job.description}
                      </p>

                      {/* Required Skills Chips */}
                      <div className="d-flex flex-wrap gap-1 mb-3">
                        {reqSkills.slice(0, 6).map((skill, i) => (
                          <span
                            key={i}
                            className="badge fw-medium"
                            style={{
                              backgroundColor: '#EEF2FF',
                              color: '#4F46E5',
                              fontSize: '11px',
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                        {reqSkills.length > 6 && (
                          <span
                            className="badge fw-medium"
                            style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '11px' }}
                          >
                            +{reqSkills.length - 6} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-3 border-top d-flex flex-wrap justify-content-between align-items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedJob(job)}
                        className="btn btn-sm fw-semibold px-3"
                        style={{ backgroundColor: '#F1F5F9', color: '#334155', borderRadius: '8px' }}
                      >
                        View Details
                      </button>

                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          disabled={savingId === job.id}
                          onClick={() => handleSaveToTracker(job)}
                          className="btn btn-sm bg-white fw-semibold px-3"
                          style={{ border: '1px solid #CBD5E1', color: '#334155', borderRadius: '8px' }}
                        >
                          <i className="bi bi-bookmark-plus me-1"></i>
                          {savingId === job.id ? 'Saving...' : 'Save Job'}
                        </button>
                        <Link
                          to={`/job-matching?jobId=${job.id}`}
                          className="btn btn-sm text-white fw-semibold px-3"
                          style={{ backgroundColor: '#4F46E5', borderRadius: '8px' }}
                        >
                          Check Match <i className="bi bi-arrow-right ms-1"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div
          className="modal show fade d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-white border-bottom px-4 py-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-3 fw-bold"
                    style={{ width: '44px', height: '44px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                  >
                    {(selectedJob.company || 'CO').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark mb-0">{selectedJob.title}</h5>
                    <div className="text-muted small">
                      {selectedJob.company} • {selectedJob.location} •{' '}
                      <strong className="text-success">{selectedJob.salary_range}</strong>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedJob(null)}
                ></button>
              </div>

              <div className="modal-body p-4" style={{ backgroundColor: '#F8FAFC' }}>
                <div className="bg-white p-4 rounded-4 mb-3" style={{ border: '1px solid #E2E8F0' }}>
                  <h6 className="fw-bold text-dark mb-2">Role Overview &amp; Responsibilities</h6>
                  <p className="small text-muted mb-0" style={{ whiteSpace: 'pre-line', lineHeight: 1.65 }}>
                    {selectedJob.description}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-4" style={{ border: '1px solid #E2E8F0' }}>
                  <h6 className="fw-bold text-dark mb-2">Required Technical &amp; Core Skills</h6>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {getSkillsArray(selectedJob.required_skills).map((s, idx) => (
                      <span
                        key={idx}
                        className="badge rounded-pill px-3 py-1.5 fw-medium"
                        style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {getSkillsArray(selectedJob.preferred_skills).length > 0 && (
                    <>
                      <h6 className="fw-bold text-dark mb-2">Preferred / Nice-to-Have Skills</h6>
                      <div className="d-flex flex-wrap gap-2">
                        {getSkillsArray(selectedJob.preferred_skills).map((s, idx) => (
                          <span
                            key={idx}
                            className="badge rounded-pill px-3 py-1.5 fw-medium"
                            style={{ backgroundColor: '#F1F5F9', color: '#475569' }}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="modal-footer bg-white border-top px-4 py-3 d-flex justify-content-between">
                <button
                  type="button"
                  onClick={() => handleSaveToTracker(selectedJob)}
                  className="btn btn-sm bg-white fw-semibold px-3"
                  style={{ border: '1px solid #CBD5E1', color: '#334155', borderRadius: '8px' }}
                >
                  <i className="bi bi-bookmark-plus me-1"></i> Save to Tracker
                </button>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-sm fw-semibold px-3"
                    style={{ backgroundColor: '#F1F5F9', color: '#334155', borderRadius: '8px' }}
                    onClick={() => setSelectedJob(null)}
                  >
                    Close
                  </button>
                  <Link
                    to={`/job-matching?jobId=${selectedJob.id}`}
                    className="btn btn-sm text-white fw-semibold px-4"
                    style={{ backgroundColor: '#4F46E5', borderRadius: '8px' }}
                  >
                    Match With My Resume
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Parse Job Description Modal */}
      {showCreateModal && (
        <div
          className="modal show fade d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-white border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark mb-0">
                  <i className="bi bi-file-earmark-plus me-2" style={{ color: '#4F46E5' }}></i>
                  Add or Parse External Job Description
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>

              <div className="modal-body p-4">
                {/* Tab Switcher */}
                <div className="d-flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setModalTab('parser')}
                    className="btn btn-sm fw-semibold px-3 py-2"
                    style={{
                      borderRadius: '10px',
                      backgroundColor: modalTab === 'parser' ? '#4F46E5' : '#F1F5F9',
                      color: modalTab === 'parser' ? '#FFFFFF' : '#475569',
                    }}
                  >
                    <i className="bi bi-cpu me-1"></i> AI / Text Parser
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('manual')}
                    className="btn btn-sm fw-semibold px-3 py-2"
                    style={{
                      borderRadius: '10px',
                      backgroundColor: modalTab === 'manual' ? '#4F46E5' : '#F1F5F9',
                      color: modalTab === 'manual' ? '#FFFFFF' : '#475569',
                    }}
                  >
                    <i className="bi bi-pencil-square me-1"></i> Structured Form
                  </button>
                </div>

                {modalTab === 'parser' ? (
                  <div>
                    <label className="form-label small fw-semibold text-dark">
                      Paste Raw Job Description Text
                    </label>
                    <textarea
                      rows="7"
                      className="form-control mb-3"
                      placeholder="Paste the full job posting from LinkedIn, Naukri, or company careers page..."
                      value={rawJobText}
                      onChange={(e) => setRawJobText(e.target.value)}
                    ></textarea>
                    <div className="d-flex justify-content-end">
                      <button
                        type="button"
                        disabled={parsingText}
                        onClick={handleParseRawText}
                        className="btn text-white fw-semibold px-4"
                        style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
                      >
                        <i className="bi bi-stars me-1"></i>
                        {parsingText ? 'Extracting Requirements...' : 'Extract & Autofill Form'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleCreateJob}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark">Job Title *</label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          value={newJobForm.title}
                          onChange={(e) => setNewJobForm({ ...newJobForm, title: e.target.value })}
                          placeholder="Full-Stack Python Developer"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark">Company *</label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          value={newJobForm.company}
                          onChange={(e) => setNewJobForm({ ...newJobForm, company: e.target.value })}
                          placeholder="Infosys / TechCorp"
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-dark">Location</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newJobForm.location}
                          onChange={(e) => setNewJobForm({ ...newJobForm, location: e.target.value })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-dark">Compensation (LPA)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newJobForm.salary_range}
                          onChange={(e) => setNewJobForm({ ...newJobForm, salary_range: e.target.value })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-semibold text-dark">Min Experience (Yrs)</label>
                        <input
                          type="number"
                          min="0"
                          max="30"
                          className="form-control"
                          value={newJobForm.min_experience}
                          onChange={(e) => setNewJobForm({ ...newJobForm, min_experience: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark">
                          Required Skills (comma-separated) *
                        </label>
                        <input
                          type="text"
                          required
                          className="form-control"
                          value={newJobForm.required_skills}
                          onChange={(e) => setNewJobForm({ ...newJobForm, required_skills: e.target.value })}
                          placeholder="Python, Django, React, SQL"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-dark">
                          Preferred Skills (optional)
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={newJobForm.preferred_skills}
                          onChange={(e) => setNewJobForm({ ...newJobForm, preferred_skills: e.target.value })}
                          placeholder="Docker, AWS, Redis"
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-dark">Job Description *</label>
                        <textarea
                          rows="4"
                          required
                          className="form-control"
                          value={newJobForm.description}
                          onChange={(e) => setNewJobForm({ ...newJobForm, description: e.target.value })}
                        ></textarea>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="btn btn-sm bg-white fw-semibold px-3"
                        style={{ border: '1px solid #CBD5E1', color: '#475569', borderRadius: '8px' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingJob}
                        className="btn btn-sm text-white fw-semibold px-4"
                        style={{ backgroundColor: '#4F46E5', borderRadius: '8px' }}
                      >
                        {submittingJob ? 'Saving...' : 'Save Job Posting'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDescriptions;