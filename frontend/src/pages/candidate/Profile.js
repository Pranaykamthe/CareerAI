import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { resumeService } from '../../services/resumeService';
import ProfilePhotoUploader from '../../components/common/ProfilePhotoUploader';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsingResume, setParsingResume] = useState(false);
  const [aiBadge, setAiBadge] = useState('');
  const [toast, setToast] = useState(null);

  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const fileInputRef = useRef(null);

  const [newSkill, setNewSkill] = useState('');
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    profile_photo_url: '',
    headline: '',
    target_role: '',
    experience_years: 0,
    phone: '',
    location: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    summary: '',
    skills: [],
    education: [],
    experience: [],
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const fetchProfileAndResumes = async () => {
      setLoading(true);
      try {
        const [profileRes, resumesData] = await Promise.all([
          api.get('/auth/profile/'),
          resumeService.getResumes().catch(() => []),
        ]);

        const data = profileRes.data || {};
        const userObj = data.user || {};
        const pObj = data.profile || data;

        const fullName =
          pObj.full_name ||
          [userObj.first_name, userObj.last_name].filter(Boolean).join(' ') ||
          userObj.username ||
          '';

        const skillsArr = Array.isArray(pObj.skills_list)
          ? pObj.skills_list
          : Array.isArray(pObj.skills)
          ? pObj.skills
          : [];

        const eduArr = Array.isArray(pObj.education) ? pObj.education : [];
        const expArr = Array.isArray(pObj.work_experience)
          ? pObj.work_experience
          : Array.isArray(pObj.experience)
          ? pObj.experience
          : [];

        setProfile({
          full_name: fullName,
          email: userObj.email || pObj.email || '',
          profile_photo_url: pObj.profile_photo_url || userObj.profile_photo_url || '',
          headline: pObj.headline || '',
          target_role: pObj.target_role || '',
          experience_years: pObj.experience_years ?? 0,
          phone: pObj.phone || userObj.phone || '',
          location: pObj.location || '',
          linkedin_url: pObj.linkedin_url || pObj.linkedin || '',
          github_url: pObj.github_url || pObj.github || '',
          portfolio_url: pObj.portfolio_url || pObj.portfolio || '',
          summary: pObj.summary || pObj.bio || '',
          skills: skillsArr,
          education: eduArr,
          experience: expArr,
        });

        const resumeList = Array.isArray(resumesData)
          ? resumesData
          : resumesData?.results || [];
        setResumes(resumeList);
        if (resumeList.length > 0) {
          const primary = resumeList.find((r) => r.is_primary) || resumeList[0];
          setSelectedResumeId(String(primary.id));
        }
      } catch (err) {
        showToast('danger', 'Unable to load profile data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndResumes();
  }, []);

  const applyExtractedDataToState = (extracted, providerLabel) => {
    if (!extracted) return;

    setProfile((prev) => {
      const mergedSkills = Array.from(
        new Set([...(prev.skills || []), ...(extracted.skills || [])])
      );

      return {
        ...prev,
        full_name: extracted.full_name || prev.full_name,
        headline: extracted.headline || prev.headline,
        target_role: extracted.target_role || prev.target_role,
        experience_years:
          extracted.experience_years !== undefined && extracted.experience_years !== null
            ? extracted.experience_years
            : prev.experience_years,
        phone: extracted.phone || prev.phone,
        location: extracted.location || prev.location,
        linkedin_url: extracted.linkedin_url || prev.linkedin_url,
        github_url: extracted.github_url || prev.github_url,
        portfolio_url: extracted.portfolio_url || prev.portfolio_url,
        summary: extracted.summary || prev.summary,
        skills: mergedSkills,
        education:
          Array.isArray(extracted.education) && extracted.education.length > 0
            ? extracted.education
            : prev.education,
        experience:
          Array.isArray(extracted.experience) && extracted.experience.length > 0
            ? extracted.experience
            : prev.experience,
      };
    });

    setAiBadge(providerLabel || 'Groq AI');
  };

  const handleDirectResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingResume(true);
    try {
      const res = await resumeService.autofillProfileFromFile(file, true);
      applyExtractedDataToState(res.extracted_profile, res.provider);

      const updatedResumes = await resumeService.getResumes().catch(() => resumes);
      const list = Array.isArray(updatedResumes)
        ? updatedResumes
        : updatedResumes?.results || [];
      setResumes(list);
      if (res.resume_id) setSelectedResumeId(String(res.resume_id));

      showToast(
        'success',
        res.message || 'Resume parsed with Groq AI and profile auto-filled!'
      );
    } catch (err) {
      showToast(
        'danger',
        err.response?.data?.error || 'Failed to parse resume with Groq AI.'
      );
    } finally {
      setParsingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAutofillFromExisting = async () => {
    if (!selectedResumeId) {
      showToast('warning', 'Please select or upload a resume first.');
      return;
    }

    setParsingResume(true);
    try {
      const res = await resumeService.autofillProfileFromExisting(selectedResumeId, true);
      applyExtractedDataToState(res.extracted_profile, res.provider);
      showToast(
        'success',
        res.message || 'Profile auto-filled from your selected resume via Groq AI!'
      );
    } catch (err) {
      showToast(
        'danger',
        err.response?.data?.error || 'Could not auto-fill from the selected resume.'
      );
    } finally {
      setParsingResume(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        full_name: profile.full_name,
        headline: profile.headline,
        target_role: profile.target_role,
        experience_years: Number(profile.experience_years) || 0,
        phone: profile.phone,
        location: profile.location,
        linkedin_url: profile.linkedin_url,
        github_url: profile.github_url,
        portfolio_url: profile.portfolio_url,
        summary: profile.summary,
        bio: profile.summary,
        skills: profile.skills,
        skills_list: profile.skills,
        education: profile.education,
        experience: profile.experience,
        work_experience: profile.experience,
      };
      await api.put('/auth/profile/', payload);
      showToast('success', 'Candidate profile saved successfully!');
    } catch (err) {
      showToast('danger', 'Failed to save profile changes. Please verify your inputs.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (!trimmed || profile.skills.includes(trimmed)) return;
    setProfile((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const addEducation = () => {
    setProfile((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { degree: '', institution: '', year: '', grade: '' },
      ],
    }));
  };

  const updateEducation = (index, field, value) => {
    const updated = [...profile.education];
    updated[index] = { ...updated[index], [field]: value };
    setProfile((prev) => ({ ...prev, education: updated }));
  };

  const removeEducation = (index) => {
    setProfile((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  const addExperience = () => {
    setProfile((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { role: '', company: '', duration: '', location: '', description: '' },
      ],
    }));
  };

  const updateExperience = (index, field, value) => {
    const updated = [...profile.experience];
    updated[index] = { ...updated[index], [field]: value };
    setProfile((prev) => ({ ...prev, experience: updated }));
  };

  const removeExperience = (index) => {
    setProfile((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const calculateCompleteness = () => {
    let score = 0;
    if (profile.profile_photo_url) score += 5;
    if (profile.full_name?.trim()) score += 10;
    if (profile.headline?.trim()) score += 15;
    if (profile.target_role?.trim()) score += 10;
    if (profile.phone?.trim() || profile.location?.trim()) score += 10;
    if (profile.linkedin_url?.trim() || profile.github_url?.trim()) score += 10;
    if (profile.summary?.trim()) score += 15;
    if (profile.skills?.length >= 3) score += 10;
    if (profile.education?.length > 0) score += 10;
    if (profile.experience?.length > 0) score += 5;
    return Math.min(100, score);
  };

  const completeness = calculateCompleteness();
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completeness / 100) * circumference;

  const cardStyle = {
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  };

  if (loading) {
    return (
      <div
        className="min-vh-100 d-flex justify-content-center align-items-center"
        style={{ backgroundColor: '#F8FAFC' }}
      >
        <div className="spinner-border" style={{ color: '#4F46E5' }} role="status"></div>
      </div>
    );
  }

  return (
    <div className="py-4" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '1120px' }}>
        {/* Inline Toast Alert */}
        {toast && (
          <div
            className={`alert alert-${toast.type} d-flex align-items-center justify-content-between rounded-4 shadow-sm mb-4`}
          >
            <div className="d-flex align-items-center gap-2 small fw-semibold">
              <i
                className={`bi ${
                  toast.type === 'success'
                    ? 'bi-check-circle-fill'
                    : 'bi-exclamation-triangle-fill'
                }`}
              ></i>
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              className="btn-close btn-sm"
              onClick={() => setToast(null)}
            ></button>
          </div>
        )}

        {/* Header: Profile Photo Uploader + Name + Completeness Ring */}
        <div
          className="card bg-white p-4 mb-4 d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-4"
          style={cardStyle}
        >
          <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-4">
            <ProfilePhotoUploader
              photoUrl={profile.profile_photo_url}
              fullName={profile.full_name}
              email={profile.email}
              role="candidate"
              size={84}
              onPhotoUpdated={(newUrl) =>
                setProfile((prev) => ({ ...prev, profile_photo_url: newUrl }))
              }
              onNotify={showToast}
            />

            <div>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                <h3 className="fw-bold text-dark mb-0">
                  {profile.full_name || 'Candidate Profile'}
                </h3>
                {aiBadge && (
                  <span
                    className="badge rounded-pill px-2.5 py-1 fw-semibold"
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11px' }}
                  >
                    <i className="bi bi-stars me-1"></i>Auto-Filled by {aiBadge}
                  </span>
                )}
              </div>
              <p className="text-muted small mb-0">
                {profile.headline ||
                  'Upload a profile photo and complete your details or auto-import from your resume.'}
              </p>
            </div>
          </div>

          {/* SVG Completeness Ring */}
          <div className="d-flex align-items-center gap-3 flex-shrink-0">
            <div className="position-relative" style={{ width: '80px', height: '80px' }}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="7"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  fill="none"
                  stroke={completeness >= 80 ? '#10B981' : '#4F46E5'}
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <div
                className="position-absolute top-50 start-50 translate-middle fw-bold text-dark"
                style={{ fontSize: '14px' }}
              >
                {completeness}%
              </div>
            </div>
            <div>
              <div className="fw-bold text-dark small">Profile Readiness</div>
              <div className="text-muted" style={{ fontSize: '12px' }}>
                {completeness >= 80
                  ? 'Ready for AI Job Matching'
                  : 'Add photo & details to boost score'}
              </div>
            </div>
          </div>
        </div>

        {/* Groq AI Resume-to-Profile Auto-Fill Card */}
        <div
          className="card p-4 mb-4"
          style={{
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
            border: '1px solid #C7D2FE',
          }}
        >
          <div className="row align-items-center g-3">
            <div className="col-lg-6">
              <div className="d-flex align-items-start gap-3">
                <div
                  className="d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                  style={{
                    width: '46px',
                    height: '46px',
                    backgroundColor: '#4F46E5',
                    color: '#FFFFFF',
                  }}
                >
                  <i className="bi bi-magic fs-5"></i>
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h6 className="fw-bold text-dark mb-0">
                      Smart Auto-Fill from Resume
                    </h6>
                    <span
                      className="badge rounded-pill px-2 py-0.5 fw-semibold"
                      style={{
                        backgroundColor: '#4F46E5',
                        color: '#FFFFFF',
                        fontSize: '10.5px',
                      }}
                    >
                      Groq AI Parser
                    </span>
                  </div>
                  <p className="text-muted small mb-0">
                    Upload a PDF/DOCX resume or pick an existing one to automatically extract your skills, summary, education, and work experience.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="d-flex flex-column flex-sm-row gap-2 justify-content-lg-end">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="d-none"
                  onChange={handleDirectResumeUpload}
                />
                <button
                  type="button"
                  disabled={parsingResume}
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-sm text-white fw-semibold px-3 py-2 d-inline-flex align-items-center justify-content-center gap-2 shadow-sm"
                  style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
                >
                  {parsingResume ? (
                    <>
                      <span className="spinner-border spinner-border-sm"></span>
                      Parsing with Groq AI...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cloud-arrow-up"></i> Upload & Auto-Fill
                    </>
                  )}
                </button>

                {resumes.length > 0 && (
                  <div className="input-group input-group-sm" style={{ maxWidth: '280px' }}>
                    <select
                      className="form-select bg-white"
                      style={{ borderRadius: '10px 0 0 10px', borderColor: '#CBD5E1' }}
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      disabled={parsingResume}
                    >
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.file_name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={parsingResume}
                      onClick={handleAutofillFromExisting}
                      className="btn bg-white fw-semibold"
                      style={{
                        borderRadius: '0 10px 10px 0',
                        borderColor: '#CBD5E1',
                        color: '#4F46E5',
                      }}
                    >
                      Auto-Fill
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Profile Form */}
        <form onSubmit={handleSaveProfile}>
          <div className="row g-4">
            {/* Left Column */}
            <div className="col-lg-7">
              <div className="card bg-white p-4 mb-4" style={cardStyle}>
                <h5 className="fw-bold text-dark mb-3">
                  <i className="bi bi-person-lines-fill me-2" style={{ color: '#4F46E5' }}></i>
                  Personal & Career Headline
                </h5>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.full_name}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, full_name: e.target.value }))
                      }
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Email Address</label>
                    <input
                      type="email"
                      className="form-control bg-light"
                      value={profile.email}
                      disabled
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold text-dark">
                      Professional Headline
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.headline}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, headline: e.target.value }))
                      }
                      placeholder="Full-Stack Software Engineer | Python, Django & React"
                    />
                  </div>

                  <div className="col-md-7">
                    <label className="form-label small fw-semibold text-dark">Target Job Role</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.target_role}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, target_role: e.target.value }))
                      }
                      placeholder="Software Engineer"
                    />
                  </div>

                  <div className="col-md-5">
                    <label className="form-label small fw-semibold text-dark">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      className="form-control"
                      value={profile.experience_years}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, experience_years: e.target.value }))
                      }
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-dark">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.location}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, location: e.target.value }))
                      }
                      placeholder="Bengaluru, India"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-dark">LinkedIn URL</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.linkedin_url}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, linkedin_url: e.target.value }))
                      }
                      placeholder="linkedin.com/in/username"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-dark">GitHub URL</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.github_url}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, github_url: e.target.value }))
                      }
                      placeholder="github.com/username"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-dark">Portfolio URL</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.portfolio_url}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, portfolio_url: e.target.value }))
                      }
                      placeholder="yourportfolio.dev"
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-semibold text-dark">
                      Professional Summary / Bio
                    </label>
                    <textarea
                      rows="4"
                      className="form-control"
                      value={profile.summary}
                      onChange={(e) =>
                        setProfile((prev) => ({ ...prev, summary: e.target.value }))
                      }
                      placeholder="Summarize your technical background, key projects, and career goals..."
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Work Experience Section */}
              <div className="card bg-white p-4" style={cardStyle}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-dark mb-0">
                    <i className="bi bi-briefcase-fill me-2" style={{ color: '#4F46E5' }}></i>
                    Work Experience
                  </h5>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="btn btn-sm fw-semibold"
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '8px' }}
                  >
                    + Add Role
                  </button>
                </div>

                {profile.experience.length === 0 ? (
                  <p className="text-muted small mb-0">
                    No experience entries added yet. Upload a resume above or click &ldquo;+ Add Role&rdquo;.
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {profile.experience.map((exp, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-3"
                        style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="small fw-bold text-dark">Role #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeExperience(idx)}
                            className="btn btn-sm text-danger p-0"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                        <div className="row g-2">
                          <div className="col-md-6">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Job Title"
                              value={exp.role || ''}
                              onChange={(e) => updateExperience(idx, 'role', e.target.value)}
                            />
                          </div>
                          <div className="col-md-6">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Company Name"
                              value={exp.company || ''}
                              onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                            />
                          </div>
                          <div className="col-md-6">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Duration (e.g. Jan 2024 - Present)"
                              value={exp.duration || ''}
                              onChange={(e) => updateExperience(idx, 'duration', e.target.value)}
                            />
                          </div>
                          <div className="col-md-6">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Location"
                              value={exp.location || ''}
                              onChange={(e) => updateExperience(idx, 'location', e.target.value)}
                            />
                          </div>
                          <div className="col-12">
                            <textarea
                              rows="2"
                              className="form-control form-control-sm"
                              placeholder="Key responsibilities and impact..."
                              value={exp.description || ''}
                              onChange={(e) =>
                                updateExperience(idx, 'description', e.target.value)
                              }
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="col-lg-5">
              {/* Skills Card */}
              <div className="card bg-white p-4 mb-4" style={cardStyle}>
                <h5 className="fw-bold text-dark mb-1">
                  <i className="bi bi-cpu-fill me-2" style={{ color: '#4F46E5' }}></i>
                  Skills & Technologies
                </h5>
                <p className="text-muted small mb-3">
                  Used for weighted job compatibility matching and skill gap diagnostics.
                </p>

                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Add skill (e.g. Python, React, Docker)"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSkill(e);
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="btn text-white fw-semibold"
                    style={{ backgroundColor: '#4F46E5' }}
                  >
                    Add
                  </button>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  {profile.skills.length === 0 ? (
                    <span className="text-muted small">No skills added yet.</span>
                  ) : (
                    profile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="badge rounded-pill px-3 py-2 fw-medium d-inline-flex align-items-center gap-2"
                        style={{
                          backgroundColor: '#EEF2FF',
                          color: '#4F46E5',
                          fontSize: '12px',
                        }}
                      >
                        {skill}
                        <i
                          className="bi bi-x-circle-fill"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleRemoveSkill(skill)}
                        ></i>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Education Card */}
              <div className="card bg-white p-4 mb-4" style={cardStyle}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-dark mb-0">
                    <i className="bi bi-mortarboard-fill me-2" style={{ color: '#4F46E5' }}></i>
                    Education
                  </h5>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="btn btn-sm fw-semibold"
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '8px' }}
                  >
                    + Add Education
                  </button>
                </div>

                {profile.education.length === 0 ? (
                  <p className="text-muted small mb-0">
                    No education entries added yet. Upload a resume or click &ldquo;+ Add Education&rdquo;.
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {profile.education.map((edu, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-3"
                        style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="small fw-bold text-dark">Degree #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeEducation(idx)}
                            className="btn btn-sm text-danger p-0"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                        <div className="row g-2">
                          <div className="col-12">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Degree (e.g. B.Tech in Computer Science)"
                              value={edu.degree || ''}
                              onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                            />
                          </div>
                          <div className="col-12">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Institution / University"
                              value={edu.institution || ''}
                              onChange={(e) =>
                                updateEducation(idx, 'institution', e.target.value)
                              }
                            />
                          </div>
                          <div className="col-6">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Graduation Year"
                              value={edu.year || ''}
                              onChange={(e) => updateEducation(idx, 'year', e.target.value)}
                            />
                          </div>
                          <div className="col-6">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="CGPA / Grade"
                              value={edu.grade || ''}
                              onChange={(e) => updateEducation(idx, 'grade', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Profile Action Button */}
              <button
                type="submit"
                disabled={saving}
                className="btn w-100 py-3 fw-semibold text-white shadow-sm d-flex align-items-center justify-content-center gap-2"
                style={{ backgroundColor: '#4F46E5', borderRadius: '12px' }}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    Saving Profile...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle fs-5"></i> Save Candidate Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;