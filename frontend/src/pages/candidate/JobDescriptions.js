import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/layout/Navbar';
import { jobService } from '../../services/jobService';

const JobDescriptions = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // New Job / Parser Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const [parseInputText, setParseInputText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: 'Bengaluru, Karnataka',
    job_type: 'Full-time',
    experience_level: 'Mid Level',
    min_experience_years: 2,
    salary_range: '14 - 20 LPA',
    description: '',
    required_skills: '',
    preferred_skills: '',
    responsibilities: '',
  });

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedType) params.job_type = selectedType;
      if (selectedLevel) params.experience_level = selectedLevel;

      const data = await jobService.getJobs(params);
      setJobs(data);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedType, selectedLevel]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleSeedJobs = async () => {
    try {
      setSeeding(true);
      await jobService.seedDefaultJobs();
      await fetchJobs();
    } catch (err) {
      alert('Failed to reset sample jobs.');
    } finally {
      setSeeding(false);
    }
  };

  const handleParseText = async () => {
    if (!parseInputText.trim()) return;
    try {
      setParsing(true);
      const result = await jobService.parseJobText(parseInputText);
      setFormData((prev) => ({
        ...prev,
        required_skills: result.extracted_skills?.join(', ') || '',
        experience_level: result.experience_level || 'Mid Level',
        min_experience_years: result.min_experience_years || 2,
        responsibilities: result.responsibilities?.join('\n') || '',
        description: parseInputText,
      }));
      setActiveTab('manual');
    } catch (err) {
      alert('Failed to parse text.');
    } finally {
      setParsing(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        min_experience_years: parseInt(formData.min_experience_years, 10) || 1,
        required_skills: formData.required_skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        preferred_skills: formData.preferred_skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        responsibilities: formData.responsibilities
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await jobService.createJob(payload);
      setShowCreateModal(false);
      setFormData({
        title: '',
        company: '',
        location: 'Bengaluru, Karnataka',
        job_type: 'Full-time',
        experience_level: 'Mid Level',
        min_experience_years: 2,
        salary_range: '14 - 20 LPA',
        description: '',
        required_skills: '',
        preferred_skills: '',
        responsibilities: '',
      });
      fetchJobs();
    } catch (err) {
      alert('Failed to create job.');
    }
  };

  const cleanSalary = (val) => {
    if (!val) return 'Undisclosed';
    return val.replace(/^[₹$]\s*/, '').trim();
  };

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />

      <div className="container py-4">
        {/* Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h3 className="fw-bold text-dark mb-1">Job Opportunities</h3>
            <p className="text-muted small mb-0">
              Browse positions, explore skill requirements, or parse descriptions into actionable criteria.
            </p>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={handleSeedJobs}
              disabled={seeding}
            >
              {seeding ? 'Updating...' : 'Reset / Seed LPA Jobs'}
            </button>
            <button
              className="btn btn-primary-custom btn-sm"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="bi bi-plus-lg me-1"></i> Add / Parse Job
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="card shadow-sm border-0 rounded-3 p-3 mb-4 bg-white">
          <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
            <div className="col-12 col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Search by role, company, or skill..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-6 col-md-3">
              <select
                className="form-select bg-light"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="">All Job Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
              </select>
            </div>
            <div className="col-6 col-md-2">
              <select
                className="form-select bg-light"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                <option value="">All Levels</option>
                <option value="Entry Level">Entry Level</option>
                <option value="Mid Level">Mid Level</option>
                <option value="Senior Level">Senior Level</option>
                <option value="Expert Level">Expert Level</option>
              </select>
            </div>
            <div className="col-12 col-md-2 d-grid">
              <button type="submit" className="btn btn-primary-custom">
                Filter
              </button>
            </div>
          </form>
        </div>

        {/* Job Cards */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted small mt-2">Loading positions...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="card shadow-sm border-0 p-5 text-center bg-white rounded-3">
            <i className="bi bi-briefcase text-muted fs-1 mb-2"></i>
            <h5 className="fw-bold text-dark">No Jobs Found</h5>
            <p className="text-muted small">
              Click &quot;Reset / Seed LPA Jobs&quot; above to populate positions.
            </p>
          </div>
        ) : (
          <div className="row g-4">
            {jobs.map((job) => (
              <div key={job.id} className="col-12 col-md-6">
                <div className="card shadow-sm border-0 rounded-3 p-4 bg-white h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h5 className="fw-bold text-dark mb-0">{job.title}</h5>
                        <p className="text-primary fw-semibold mb-0">{job.company}</p>
                      </div>
                      <span className="badge bg-light text-dark border">
                        {job.job_type}
                      </span>
                    </div>

                    <div className="d-flex flex-wrap gap-2 text-muted small mb-3">
                      <span>
                        <i className="bi bi-geo-alt me-1"></i>
                        {job.location}
                      </span>
                      <span>•</span>
                      <span>
                        <i className="bi bi-briefcase me-1"></i>
                        {job.experience_level}
                      </span>
                      {job.salary_range && (
                        <>
                          <span>•</span>
                          <span className="text-success fw-bold">
                            <i className="bi bi-currency-rupee"></i>
                            {cleanSalary(job.salary_range)}
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-secondary small mb-3" style={{ minHeight: '40px' }}>
                      {job.description.length > 120
                        ? `${job.description.substring(0, 120)}...`
                        : job.description}
                    </p>

                    <div className="mb-3">
                      <span className="text-dark small fw-semibold d-block mb-1">
                        Required Skills:
                      </span>
                      <div className="d-flex flex-wrap gap-1">
                        {job.required_skills?.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10 fw-normal"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.required_skills?.length > 5 && (
                          <span className="badge bg-light text-muted border fw-normal">
                            +{job.required_skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-3 border-top mt-2">
                    <span className="text-muted" style={{ fontSize: '11px' }}>
                      Posted {new Date(job.created_at).toLocaleDateString()}
                    </span>
                    <button
                      className="btn btn-outline-primary btn-sm px-3"
                      onClick={() => {
                        setSelectedJob(job);
                        setShowDetailModal(true);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {showDetailModal && selectedJob && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom">
                <div>
                  <h5 className="modal-title fw-bold text-dark">{selectedJob.title}</h5>
                  <p className="text-primary mb-0 fw-semibold">{selectedJob.company}</p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDetailModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-6 col-md-3">
                    <span className="text-muted small d-block">Location</span>
                    <span className="fw-semibold small text-dark">{selectedJob.location}</span>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted small d-block">Job Type</span>
                    <span className="fw-semibold small text-dark">{selectedJob.job_type}</span>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted small d-block">Experience</span>
                    <span className="fw-semibold small text-dark">{selectedJob.experience_level}</span>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted small d-block">Package (LPA)</span>
                    <span className="fw-bold small text-success">
                      <i className="bi bi-currency-rupee"></i>
                      {cleanSalary(selectedJob.salary_range)}
                    </span>
                  </div>
                </div>

                <h6 className="fw-bold text-dark mb-2">Role Overview</h6>
                <p className="text-secondary small mb-4">{selectedJob.description}</p>

                <h6 className="fw-bold text-dark mb-2">Required Skills</h6>
                <div className="d-flex flex-wrap gap-1 mb-4">
                  {selectedJob.required_skills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {selectedJob.preferred_skills?.length > 0 && (
                  <>
                    <h6 className="fw-bold text-dark mb-2">Preferred / Nice-to-Have</h6>
                    <div className="d-flex flex-wrap gap-1 mb-4">
                      {selectedJob.preferred_skills.map((skill, idx) => (
                        <span key={idx} className="badge bg-light text-dark border">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {selectedJob.responsibilities?.length > 0 && (
                  <>
                    <h6 className="fw-bold text-dark mb-2">Key Responsibilities</h6>
                    <ul className="small text-secondary ps-3 mb-0">
                      {selectedJob.responsibilities.map((resp, idx) => (
                        <li key={idx} className="mb-1">
                          {resp}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowDetailModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Parse Job Modal */}
      {showCreateModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark">Add New Job Description</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <ul className="nav nav-pills mb-3 border-bottom pb-2">
                  <li className="nav-item">
                    <button
                      className={`nav-link btn-sm ${activeTab === 'manual' ? 'active' : ''}`}
                      onClick={() => setActiveTab('manual')}
                    >
                      <i className="bi bi-pencil-square me-1"></i> Job Details
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link btn-sm ${activeTab === 'parser' ? 'active' : ''}`}
                      onClick={() => setActiveTab('parser')}
                    >
                      <i className="bi bi-cpu me-1"></i> AI / Text Parser
                    </button>
                  </li>
                </ul>

                {activeTab === 'parser' ? (
                  <div>
                    <p className="text-muted small">
                      Paste a raw job description below. The system will automatically extract skills,
                      experience years, and bullet points.
                    </p>
                    <textarea
                      className="form-control mb-3"
                      rows="8"
                      placeholder="Paste job posting text here..."
                      value={parseInputText}
                      onChange={(e) => setParseInputText(e.target.value)}
                    ></textarea>
                    <button
                      className="btn btn-primary-custom btn-sm"
                      onClick={handleParseText}
                      disabled={parsing || !parseInputText.trim()}
                    >
                      {parsing ? 'Extracting...' : 'Extract & Autofill Form'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSaveJob}>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Job Title *</label>
                        <input
                          type="text"
                          name="title"
                          required
                          className="form-control"
                          placeholder="e.g. Backend Developer"
                          value={formData.title}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold">Company *</label>
                        <input
                          type="text"
                          name="company"
                          required
                          className="form-control"
                          placeholder="e.g. Swiggy, TCS, Infosys"
                          value={formData.company}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label small fw-semibold">Location</label>
                        <input
                          type="text"
                          name="location"
                          className="form-control"
                          placeholder="e.g. Bengaluru, Karnataka"
                          value={formData.location}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="col-6 col-md-4">
                        <label className="form-label small fw-semibold">Job Type</label>
                        <select
                          name="job_type"
                          className="form-select"
                          value={formData.job_type}
                          onChange={handleFormChange}
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Internship">Internship</option>
                          <option value="Remote">Remote</option>
                        </select>
                      </div>
                      <div className="col-6 col-md-4">
                        <label className="form-label small fw-semibold">Experience Level</label>
                        <select
                          name="experience_level"
                          className="form-select"
                          value={formData.experience_level}
                          onChange={handleFormChange}
                        >
                          <option value="Entry Level">Entry Level</option>
                          <option value="Mid Level">Mid Level</option>
                          <option value="Senior Level">Senior Level</option>
                          <option value="Expert Level">Expert Level</option>
                        </select>
                      </div>
                      <div className="col-6 col-md-4">
                        <label className="form-label small fw-semibold">Min Experience (Years)</label>
                        <input
                          type="number"
                          name="min_experience_years"
                          className="form-control"
                          value={formData.min_experience_years}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="col-6 col-md-8">
                        <label className="form-label small fw-semibold">Compensation (LPA)</label>
                        <input
                          type="text"
                          name="salary_range"
                          className="form-control"
                          placeholder="e.g. 14 - 20 LPA"
                          value={formData.salary_range}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold">
                          Required Skills (comma separated) *
                        </label>
                        <input
                          type="text"
                          name="required_skills"
                          required
                          className="form-control"
                          placeholder="Python, Django, PostgreSQL, Docker"
                          value={formData.required_skills}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold">Job Description *</label>
                        <textarea
                          name="description"
                          required
                          rows="4"
                          className="form-control"
                          placeholder="Detailed role description..."
                          value={formData.description}
                          onChange={handleFormChange}
                        ></textarea>
                      </div>
                    </div>
                    <div className="d-flex justify-content-end gap-2 mt-4">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setShowCreateModal(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary-custom btn-sm">
                        Save Job Posting
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