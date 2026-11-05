import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Navbar } from '../../components/layout/Navbar';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // User Identity Data
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    phone: '',
  });

  // Profile Details
  const [profileData, setProfileData] = useState({
    headline: '',
    target_role: '',
    bio: '',
    experience_years: 0,
    location: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    skills_list: [],
    education: [],
    experience: [],
    completion_percentage: 0,
  });

  // Input states for modal/inline items
  const [skillInput, setSkillInput] = useState('');
  const [newEdu, setNewEdu] = useState({ degree: '', institution: '', year: '' });
  const [newExp, setNewExp] = useState({ title: '', company: '', duration: '', description: '' });

  // Fetch initial profile
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/profile/');
      setUserData(res.data.user || {});
      setProfileData(res.data.profile || {});
    } catch (err) {
      setErrorMessage('Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  // Skill Tag Management
  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = skillInput.trim();
    if (trimmed && !profileData.skills_list.includes(trimmed)) {
      setProfileData((prev) => ({
        ...prev,
        skills_list: [...prev.skills_list, trimmed],
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfileData((prev) => ({
      ...prev,
      skills_list: prev.skills_list.filter((s) => s !== skillToRemove),
    }));
  };

  // Education Management
  const handleAddEducation = (e) => {
    e.preventDefault();
    if (!newEdu.degree.trim() || !newEdu.institution.trim()) return;
    setProfileData((prev) => ({
      ...prev,
      education: [...prev.education, { ...newEdu }],
    }));
    setNewEdu({ degree: '', institution: '', year: '' });
  };

  const handleRemoveEducation = (index) => {
    setProfileData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  // Experience Management
  const handleAddExperience = (e) => {
    e.preventDefault();
    if (!newExp.title.trim() || !newExp.company.trim()) return;
    setProfileData((prev) => ({
      ...prev,
      experience: [...prev.experience, { ...newExp }],
    }));
    setNewExp({ title: '', company: '', duration: '', description: '' });
  };

  const handleRemoveExperience = (index) => {
    setProfileData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  // Save full profile
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const payload = {
        user: userData,
        profile: profileData,
      };
      const res = await api.put('/auth/profile/', payload);
      setSuccessMessage('Profile updated successfully!');
      setProfileData(res.data.profile);
      setUserData(res.data.user);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex flex-column bg-light">
        <Navbar />
        <div className="d-flex flex-grow-1 justify-content-center align-items-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light pb-5">
      <Navbar />

      <div className="container py-4">
        {/* Alerts */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i> {successMessage}
            <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
          </div>
        )}
        {errorMessage && (
          <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorMessage}
            <button type="button" className="btn-close" onClick={() => setErrorMessage('')}></button>
          </div>
        )}

        <div className="row g-4">
          {/* Left Column: Summary & Progress */}
          <div className="col-lg-4">
            {/* Profile Overview Card */}
            <div className="card shadow-sm border-0 rounded-3 mb-4 p-4 text-center bg-white">
              <div
                className="mx-auto rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm mb-3"
                style={{ width: '80px', height: '80px', fontSize: '28px' }}
              >
                {(userData.username || 'C')[0].toUpperCase()}
              </div>
              <h5 className="fw-bold mb-1">{userData.username || 'Candidate'}</h5>
              <p className="text-muted small mb-2">{profileData.headline || 'No headline specified'}</p>
              <div className="text-muted small mb-3">
                <i className="bi bi-geo-alt me-1"></i> {profileData.location || 'Location not added'}
              </div>

              <div className="border-top pt-3 text-start">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="small fw-semibold text-muted">Profile Completeness</span>
                  <span className="small fw-bold text-primary">{profileData.completion_percentage}%</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar bg-primary"
                    role="progressbar"
                    style={{ width: `${profileData.completion_percentage}%` }}
                  ></div>
                </div>
                <small className="text-muted d-block mt-2" style={{ fontSize: '11px' }}>
                  Complete all sections to improve AI matching accuracy.
                </small>
              </div>
            </div>

            {/* Social & Contact Links Card */}
            <div className="card shadow-sm border-0 rounded-3 p-4 bg-white">
              <h6 className="fw-bold mb-3">Online Presence</h6>
              <div className="mb-3">
                <label className="form-label small text-muted">LinkedIn URL</label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light text-primary"><i className="bi bi-linkedin"></i></span>
                  <input
                    type="url"
                    name="linkedin_url"
                    className="form-control"
                    placeholder="https://linkedin.com/in/username"
                    value={profileData.linkedin_url}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small text-muted">GitHub URL</label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light text-dark"><i className="bi bi-github"></i></span>
                  <input
                    type="url"
                    name="github_url"
                    className="form-control"
                    placeholder="https://github.com/username"
                    value={profileData.github_url}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="mb-0">
                <label className="form-label small text-muted">Portfolio / Personal Site</label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light text-success"><i className="bi bi-globe"></i></span>
                  <input
                    type="url"
                    name="portfolio_url"
                    className="form-control"
                    placeholder="https://myportfolio.com"
                    value={profileData.portfolio_url}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Editors */}
          <div className="col-lg-8">
            <form onSubmit={handleSave}>
              {/* Personal Information */}
              <div className="card shadow-sm border-0 rounded-3 p-4 mb-4 bg-white">
                <h5 className="fw-bold mb-3 text-dark">
                  <i className="bi bi-person-lines-fill text-primary me-2"></i>Personal Information
                </h5>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-medium">Full Name</label>
                    <input
                      type="text"
                      name="username"
                      className="form-control"
                      value={userData.username}
                      onChange={handleUserChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-medium">Email (Account Primary)</label>
                    <input
                      type="email"
                      className="form-control bg-light"
                      value={userData.email}
                      disabled
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-medium">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      className="form-control"
                      placeholder="+1 (555) 000-0000"
                      value={userData.phone || ''}
                      onChange={handleUserChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-medium">Location</label>
                    <input
                      type="text"
                      name="location"
                      className="form-control"
                      placeholder="e.g. San Francisco, CA"
                      value={profileData.location}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-medium">Target Job Role</label>
                    <input
                      type="text"
                      name="target_role"
                      className="form-control"
                      placeholder="e.g. Full Stack Python Developer"
                      value={profileData.target_role}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-medium">Total Experience (Years)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      name="experience_years"
                      className="form-control"
                      value={profileData.experience_years}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-medium">Professional Headline</label>
                    <input
                      type="text"
                      name="headline"
                      className="form-control"
                      placeholder="e.g. Passionate Software Engineer specializing in Django and React"
                      value={profileData.headline}
                      onChange={handleProfileChange}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label small fw-medium">Professional Summary / Bio</label>
                    <textarea
                      rows="3"
                      name="bio"
                      className="form-control"
                      placeholder="Brief overview of your background, core strengths, and goals..."
                      value={profileData.bio}
                      onChange={handleProfileChange}
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Skills Management */}
              <div className="card shadow-sm border-0 rounded-3 p-4 mb-4 bg-white">
                <h5 className="fw-bold mb-3 text-dark">
                  <i className="bi bi-tools text-primary me-2"></i>Skills & Competencies
                </h5>
                <div className="d-flex gap-2 mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Add a technical skill (e.g. React, Django, Docker, Python)"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill(e);
                      }
                    }}
                  />
                  <button type="button" className="btn btn-outline-primary" onClick={handleAddSkill}>
                    Add Skill
                  </button>
                </div>

                <div className="d-flex flex-wrap gap-2 min-vh-25">
                  {profileData.skills_list.length === 0 ? (
                    <span className="text-muted small">No skills added yet. Type a skill and click Add.</span>
                  ) : (
                    profileData.skills_list.map((skill, idx) => (
                      <span
                        key={idx}
                        className="badge bg-light text-dark border px-3 py-2 d-flex align-items-center gap-2"
                        style={{ fontSize: '13px', borderRadius: '20px' }}
                      >
                        {skill}
                        <i
                          className="bi bi-x-circle-fill text-muted"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleRemoveSkill(skill)}
                        ></i>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Work Experience */}
              <div className="card shadow-sm border-0 rounded-3 p-4 mb-4 bg-white">
                <h5 className="fw-bold mb-3 text-dark">
                  <i className="bi bi-briefcase-fill text-primary me-2"></i>Work Experience
                </h5>

                {/* Existing entries */}
                {profileData.experience.length > 0 && (
                  <div className="mb-4">
                    {profileData.experience.map((exp, index) => (
                      <div key={index} className="p-3 mb-2 rounded bg-light border d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-bold text-dark">{exp.title}</div>
                          <div className="text-primary small">{exp.company} • {exp.duration}</div>
                          {exp.description && <div className="text-muted small mt-1">{exp.description}</div>}
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemoveExperience(index)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new experience */}
                <div className="border rounded p-3 bg-light-subtle">
                  <h6 className="small fw-bold text-muted mb-2">Add New Work Experience</h6>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Job Title (e.g. Frontend Intern)"
                        value={newExp.title}
                        onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Company Name"
                        value={newExp.company}
                        onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Duration (e.g. Jan 2024 - Present)"
                        value={newExp.duration}
                        onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Key responsibilities or summary"
                        value={newExp.description}
                        onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                      />
                    </div>
                    <div className="col-12 text-end mt-2">
                      <button type="button" className="btn btn-sm btn-primary-custom" onClick={handleAddExperience}>
                        + Add Experience
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Education */}
              <div className="card shadow-sm border-0 rounded-3 p-4 mb-4 bg-white">
                <h5 className="fw-bold mb-3 text-dark">
                  <i className="bi bi-mortarboard-fill text-primary me-2"></i>Education History
                </h5>

                {/* Existing entries */}
                {profileData.education.length > 0 && (
                  <div className="mb-4">
                    {profileData.education.map((edu, index) => (
                      <div key={index} className="p-3 mb-2 rounded bg-light border d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold text-dark">{edu.degree}</div>
                          <div className="text-muted small">{edu.institution} {edu.year && `• ${edu.year}`}</div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleRemoveEducation(index)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new education */}
                <div className="border rounded p-3 bg-light-subtle">
                  <h6 className="small fw-bold text-muted mb-2">Add New Education Entry</h6>
                  <div className="row g-2">
                    <div className="col-md-5">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Degree / Major (e.g. B.Tech Computer Science)"
                        value={newEdu.degree}
                        onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                      />
                    </div>
                    <div className="col-md-5">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Institution / University"
                        value={newEdu.institution}
                        onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                      />
                    </div>
                    <div className="col-md-2">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Year (e.g. 2026)"
                        value={newEdu.year}
                        onChange={(e) => setNewEdu({ ...newEdu, year: e.target.value })}
                      />
                    </div>
                    <div className="col-12 text-end mt-2">
                      <button type="button" className="btn btn-sm btn-primary-custom" onClick={handleAddEducation}>
                        + Add Education
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="submit"
                  className="btn btn-primary-custom px-4 py-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Saving Profile...
                    </>
                  ) : (
                    'Save Profile Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;