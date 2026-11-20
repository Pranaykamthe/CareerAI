import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'danger', message: string }
  const [skillInput, setSkillInput] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    location: '',
    headline: '',
    target_role: '',
    experience_years: 0,
    linkedin_url: '',
    portfolio_url: '',
    bio: '',
    skills: [],
    education: [],
    experience: [],
    profile_completion: 0,
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      let res;
      try {
        res = await api.get('/auth/profile/');
      } catch (err) {
        if (err.response?.status === 404) {
          res = await api.get('/profile/');
        } else {
          throw err;
        }
      }

      const d = res.data || {};
      const resolvedSkills = Array.isArray(d.skills_list)
        ? d.skills_list
        : Array.isArray(d.skills)
        ? d.skills
        : [];

      const resolvedName =
        d.full_name ||
        [d.first_name, d.last_name].filter(Boolean).join(' ') ||
        d.username ||
        user?.username ||
        '';

      setFormData({
        full_name: resolvedName,
        email: d.email || user?.email || '',
        phone: d.phone || '',
        location: d.location || '',
        headline: d.headline || '',
        target_role: d.target_role || '',
        experience_years: d.experience_years ?? 0,
        linkedin_url: d.linkedin_url || '',
        portfolio_url: d.portfolio_url || '',
        bio: d.bio || d.summary || '',
        skills: resolvedSkills,
        education: Array.isArray(d.education) ? d.education : [],
        experience: Array.isArray(d.experience) ? d.experience : [],
        profile_completion: d.profile_completion ?? 0,
      });
    } catch (err) {
      showToast('danger', 'Unable to load profile details. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'experience_years' ? Number(value) : value,
    }));
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (formData.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setFormData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  // Dynamic Education Items
  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', year: '' }],
    }));
  };

  const updateEducation = (idx, field, value) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    }));
  };

  const removeEducation = (idx) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx),
    }));
  };

  // Dynamic Experience Items
  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [...prev.experience, { role: '', company: '', duration: '', description: '' }],
    }));
  };

  const updateExperience = (idx, field, value) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    }));
  };

  const removeExperience = (idx) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        skills_list: formData.skills,
        skills: formData.skills,
      };
      let res;
      try {
        res = await api.put('/auth/profile/', payload);
      } catch (err) {
        if (err.response?.status === 404) {
          res = await api.put('/profile/', payload);
        } else {
          throw err;
        }
      }
      if (res.data?.profile_completion !== undefined) {
        setFormData((prev) => ({ ...prev, profile_completion: res.data.profile_completion }));
      }
      showToast('success', 'Candidate profile saved and career readiness updated!');
    } catch (err) {
      showToast('danger', err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Local fallback completeness computation if backend returns 0
  const computedCompletion = (() => {
    if (formData.profile_completion > 0) return formData.profile_completion;
    let score = 20;
    if (formData.full_name) score += 15;
    if (formData.headline) score += 15;
    if (formData.target_role) score += 15;
    if (formData.skills.length > 0) score += 20;
    if (formData.bio) score += 15;
    return Math.min(100, score);
  })();

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (computedCompletion / 100) * circumference;

  const cardStyle = {
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="spinner-border" style={{ color: '#4F46E5' }} role="status"></div>
        <p className="text-muted small mt-3">Loading candidate profile...</p>
      </div>
    );
  }

  return (
    <div className="py-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="container">
        {/* Toast Banner */}
        {toast && (
          <div
            className={`alert alert-${toast.type} d-flex align-items-center justify-content-between rounded-4 shadow-sm mb-4`}
            role="alert"
          >
            <div className="small fw-semibold">
              <i className={`bi ${toast.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
              {toast.message}
            </div>
            <button type="button" className="btn-close btn-sm" onClick={() => setToast(null)}></button>
          </div>
        )}

        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <span
              className="badge rounded-pill px-3 py-1 fw-semibold mb-1"
              style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11.5px' }}
            >
              <i className="bi bi-person-badge me-1"></i> Candidate Identity
            </span>
            <h2 className="fw-bold mb-1" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
              Candidate Profile &amp; Skills
            </h2>
            <p className="text-muted small mb-0">
              Keep your target role, skills inventory, and background updated for accurate job matching.
            </p>
          </div>

          <div className="d-flex gap-2">
            <Link
              to="/resume-builder"
              className="btn btn-sm bg-white fw-semibold px-3 py-2"
              style={{ border: '1px solid #CBD5E1', color: '#334155', borderRadius: '10px' }}
            >
              <i className="bi bi-magic me-1" style={{ color: '#4F46E5' }}></i> Open AI Resume Builder
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="btn btn-sm text-white fw-semibold px-4 py-2 shadow-sm"
              style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle me-1"></i> Save Profile
                </>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-4">
            {/* Left Summary Column (4 cols) */}
            <div className="col-lg-4">
              {/* Profile Strength Card */}
              <div className="card bg-white p-4 text-center mb-4" style={cardStyle}>
                <div
                  className="mx-auto rounded-circle d-flex align-items-center justify-content-center fw-bold text-white mb-3 shadow-sm"
                  style={{
                    width: '72px',
                    height: '72px',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                    fontSize: '26px',
                  }}
                >
                  {(formData.full_name || 'C').charAt(0).toUpperCase()}
                </div>

                <h5 className="fw-bold text-dark mb-1">{formData.full_name || 'Candidate User'}</h5>
                <p className="small text-muted mb-3">{formData.headline || 'Add your professional headline'}</p>

                <div
                  className="p-3 rounded-4 d-flex align-items-center justify-content-center gap-3 mb-3"
                  style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                >
                  <div className="position-relative d-inline-flex align-items-center justify-content-center">
                    <svg width="92" height="92" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="46" cy="46" r={radius} stroke="#E2E8F0" strokeWidth="7" fill="transparent" />
                      <circle
                        cx="46"
                        cy="46"
                        r={radius}
                        stroke={computedCompletion >= 80 ? '#10B981' : '#4F46E5'}
                        strokeWidth="7"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeOffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="position-absolute fw-bold fs-6" style={{ color: '#0F172A' }}>
                      {computedCompletion}%
                    </span>
                  </div>
                  <div className="text-start">
                    <div className="fw-bold small text-dark">Profile Strength</div>
                    <div className="text-muted" style={{ fontSize: '12px' }}>
                      {computedCompletion >= 80 ? 'Recruiter Ready' : 'Add skills & bio to reach 100%'}
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-around pt-3 border-top small">
                  <div>
                    <div className="fw-bold fs-5 text-dark">{formData.skills.length}</div>
                    <div className="text-muted" style={{ fontSize: '11.5px' }}>Skills</div>
                  </div>
                  <div className="border-start"></div>
                  <div>
                    <div className="fw-bold fs-5 text-dark">{formData.experience_years} yrs</div>
                    <div className="text-muted" style={{ fontSize: '11.5px' }}>Experience</div>
                  </div>
                </div>
              </div>

              {/* Skills Inventory Card */}
              <div className="card bg-white p-4" style={cardStyle}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold text-dark mb-0">
                    <i className="bi bi-code-slash me-2" style={{ color: '#4F46E5' }}></i>
                    Skills Inventory
                  </h6>
                  <span
                    className="badge rounded-pill"
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                  >
                    {formData.skills.length}
                  </span>
                </div>
                <p className="text-muted small mb-3">
                  Used alongside your resume for weighted job compatibility scoring.
                </p>

                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Python, React, Docker..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSkill(e);
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="btn btn-sm text-white fw-semibold px-3"
                    style={{ backgroundColor: '#4F46E5' }}
                  >
                    Add
                  </button>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  {formData.skills.length === 0 ? (
                    <span className="small text-muted fst-italic">No skills added yet.</span>
                  ) : (
                    formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="badge rounded-pill px-3 py-2 fw-medium d-inline-flex align-items-center gap-2"
                        style={{
                          backgroundColor: '#EEF2FF',
                          color: '#4F46E5',
                          border: '1px solid #C7D2FE',
                          fontSize: '12px',
                        }}
                      >
                        {skill}
                        <i
                          className="bi bi-x-circle-fill"
                          style={{ cursor: 'pointer', opacity: 0.75 }}
                          onClick={() => handleRemoveSkill(skill)}
                        ></i>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Form Column (8 cols) */}
            <div className="col-lg-8">
              {/* Basic & Career Track Information */}
              <div className="card bg-white p-4 mb-4" style={cardStyle}>
                <h6 className="fw-bold text-dark mb-3">
                  <i className="bi bi-person-lines-fill me-2" style={{ color: '#4F46E5' }}></i>
                  Personal &amp; Career Preferences
                </h6>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Full Name</label>
                    <input
                      type="text"
                      name="full_name"
                      className="form-control"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control bg-light"
                      value={formData.email}
                      disabled
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Professional Headline</label>
                    <input
                      type="text"
                      name="headline"
                      className="form-control"
                      value={formData.headline}
                      onChange={handleChange}
                      placeholder="Full-Stack Python & React Developer"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Target Job Role</label>
                    <input
                      type="text"
                      name="target_role"
                      className="form-control"
                      value={formData.target_role}
                      onChange={handleChange}
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-dark">Years of Experience</label>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      name="experience_years"
                      className="form-control"
                      value={formData.experience_years}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-dark">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      className="form-control"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-dark">Current Location</label>
                    <input
                      type="text"
                      name="location"
                      className="form-control"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Bengaluru / Remote"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">LinkedIn URL</label>
                    <input
                      type="url"
                      name="linkedin_url"
                      className="form-control"
                      value={formData.linkedin_url}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Portfolio / GitHub URL</label>
                    <input
                      type="url"
                      name="portfolio_url"
                      className="form-control"
                      value={formData.portfolio_url}
                      onChange={handleChange}
                      placeholder="https://github.com/username"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-dark">Professional Summary / Bio</label>
                    <textarea
                      name="bio"
                      rows="3"
                      className="form-control"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Summarize your core engineering strengths, projects, and career objectives..."
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Work Experience Section */}
              <div className="card bg-white p-4 mb-4" style={cardStyle}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-dark mb-0">
                    <i className="bi bi-briefcase-fill me-2" style={{ color: '#4F46E5' }}></i>
                    Work Experience
                  </h6>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="btn btn-sm fw-semibold"
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '8px' }}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Add Role
                  </button>
                </div>

                {formData.experience.length === 0 ? (
                  <div
                    className="text-center py-4 rounded-4 small text-muted"
                    style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1' }}
                  >
                    No experience entries added yet. Click <strong>Add Role</strong> to include internships or jobs.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {formData.experience.map((exp, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-4"
                        style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="small fw-bold text-dark">Role #{idx + 1}</span>
                          <button
                            type="button"
                            className="btn btn-link text-danger p-0 small"
                            onClick={() => removeExperience(idx)}
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                        <div className="row g-2">
                          <div className="col-md-4">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Job Title"
                              value={exp.role || ''}
                              onChange={(e) => updateExperience(idx, 'role', e.target.value)}
                            />
                          </div>
                          <div className="col-md-4">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Company"
                              value={exp.company || ''}
                              onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                            />
                          </div>
                          <div className="col-md-4">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Duration (e.g. 2024 - Present)"
                              value={exp.duration || ''}
                              onChange={(e) => updateExperience(idx, 'duration', e.target.value)}
                            />
                          </div>
                          <div className="col-12">
                            <textarea
                              rows="2"
                              className="form-control form-control-sm"
                              placeholder="Key responsibilities and measurable impact..."
                              value={exp.description || ''}
                              onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Education Section */}
              <div className="card bg-white p-4" style={cardStyle}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-dark mb-0">
                    <i className="bi bi-mortarboard-fill me-2" style={{ color: '#4F46E5' }}></i>
                    Education
                  </h6>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="btn btn-sm fw-semibold"
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '8px' }}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Add Education
                  </button>
                </div>

                {formData.education.length === 0 ? (
                  <div
                    className="text-center py-4 rounded-4 small text-muted"
                    style={{ backgroundColor: '#F8FAFC', border: '1px dashed #CBD5E1' }}
                  >
                    No education credentials added yet. Click <strong>Add Education</strong> to add your degree.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {formData.education.map((edu, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-4"
                        style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="small fw-bold text-dark">Credential #{idx + 1}</span>
                          <button
                            type="button"
                            className="btn btn-link text-danger p-0 small"
                            onClick={() => removeEducation(idx)}
                          >
                            <i className="bi bi-trash3"></i>
                          </button>
                        </div>
                        <div className="row g-2">
                          <div className="col-md-5">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Degree (e.g. B.Tech Computer Science)"
                              value={edu.degree || ''}
                              onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                            />
                          </div>
                          <div className="col-md-5">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="University / College"
                              value={edu.institution || ''}
                              onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                            />
                          </div>
                          <div className="col-md-2">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Year"
                              value={edu.year || ''}
                              onChange={(e) => updateEducation(idx, 'year', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;