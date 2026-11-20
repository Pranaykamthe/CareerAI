import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AI_ACTIONS = [
  { id: 'improve', label: 'Improve Sentence', desc: 'Enhance clarity & impact', icon: 'bi-stars' },
  { id: 'professional', label: 'Make Professional', desc: 'Executive tone & polish', icon: 'bi-briefcase' },
  { id: 'action_verbs', label: 'Add Action Verbs', desc: 'Stronger opening verbs', icon: 'bi-lightning-charge' },
  { id: 'add_measurable', label: 'Quantify Achievement', desc: 'Add metrics & results', icon: 'bi-graph-up-arrow' },
  { id: 'concise', label: 'Shorten Content', desc: 'Tighter, punchier phrasing', icon: 'bi-scissors' },
];

const ResumeBuilder = () => {
  const [draftId, setDraftId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [newSkill, setNewSkill] = useState('');

  // Structured Resume State
  const [resumeData, setResumeData] = useState({
    title: 'Software Engineer Resume',
    personal_info: {
      full_name: 'John Doe',
      role_title: 'Full-Stack Software Engineer',
      email: 'john.doe@example.com',
      phone: '+91 98765 43210',
      location: 'Bengaluru, India',
      linkedin: 'linkedin.com/in/johndoe',
      portfolio: 'github.com/johndoe',
    },
    summary:
      'Results-driven Software Engineer with experience building scalable full-stack web applications using Python, Django REST Framework, and React. Passionate about clean architecture and measurable product impact.',
    skills: ['Python', 'Django REST', 'React.js', 'JavaScript', 'SQLite', 'Bootstrap 5', 'Git'],
    work_experience: [
      {
        role: 'Software Developer',
        company: 'TechCorp Solutions',
        duration: '2024 – Present',
        bullets: [
          'Developed RESTful APIs and responsive React dashboards serving internal analytics workflows.',
          'Optimized database queries and reduced page load latency across core user modules.',
        ],
      },
    ],
    education: [
      {
        degree: 'B.Tech in Computer Science & Engineering',
        institution: 'National Institute of Technology',
        year: '2024',
      },
    ],
    projects: [
      {
        title: 'CareerAI — AI Resume & Job Matching Platform',
        link: 'github.com/johndoe/careerai',
        bullets: [
          'Built an end-to-end ATS resume parser, weighted job matching engine, and Groq-powered mock interview simulator.',
        ],
      },
    ],
  });

  // AI Assistant State
  const [aiSection, setAiSection] = useState('summary');
  const [aiInputText, setAiInputText] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const loadDraft = async () => {
      setLoading(true);
      try {
        const res = await api.get('/resumes/builder/');
        const drafts = Array.isArray(res.data) ? res.data : res.data?.results || [];
        if (drafts.length > 0) {
          const latest = drafts[0];
          setDraftId(latest.id);
          const normalizedSkills = Array.isArray(latest.skills)
            ? latest.skills
            : latest.skills && typeof latest.skills === 'object'
            ? Object.values(latest.skills)
                .flatMap((v) => (typeof v === 'string' ? v.split(',') : v))
                .map((s) => s.trim())
                .filter(Boolean)
            : resumeData.skills;

          setResumeData((prev) => ({
            ...prev,
            title: latest.title || prev.title,
            personal_info: { ...prev.personal_info, ...(latest.personal_info || {}) },
            summary: latest.summary || prev.summary,
            skills: normalizedSkills.length ? normalizedSkills : prev.skills,
            work_experience:
              Array.isArray(latest.work_experience) && latest.work_experience.length
                ? latest.work_experience
                : prev.work_experience,
            education:
              Array.isArray(latest.education) && latest.education.length ? latest.education : prev.education,
            projects:
              Array.isArray(latest.projects) && latest.projects.length ? latest.projects : prev.projects,
          }));
          setAiInputText(latest.summary || '');
        } else {
          setAiInputText(resumeData.summary);
        }
      } catch (err) {
        setAiInputText(resumeData.summary);
      } finally {
        setLoading(false);
      }
    };
    loadDraft();
  }, []);

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      let currentId = draftId;
      if (currentId) {
        await api.put(`/resumes/builder/${currentId}/`, resumeData);
      } else {
        const res = await api.post('/resumes/builder/', resumeData);
        currentId = res.data?.id;
        setDraftId(currentId);
      }
      showToast('success', 'Resume draft saved successfully!');
      return currentId;
    } catch (err) {
      showToast('danger', 'Unable to save draft to server.');
      return draftId;
    } finally {
      setSaving(false);
    }
  };

  const handleRunAiImprove = async (actionLabel) => {
    const targetText =
      aiInputText.trim() ||
      (aiSection === 'summary'
        ? resumeData.summary
        : resumeData.work_experience[0]?.bullets?.[0] || '');

    if (!targetText) {
      showToast('danger', 'Enter or select a sentence to improve first.');
      return;
    }

    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const res = await api.post('/resumes/builder/ai-improve/', {
        section: aiSection,
        action: actionLabel,
        content: targetText,
        target_role: resumeData.personal_info.role_title || 'Software Engineer',
      });
      setAiSuggestion({
        original_text: targetText,
        improved_text: res.data?.improved_text || targetText,
        explanation: res.data?.explanation || 'Enhanced action verbs and ATS keyword alignment.',
        score_increase: res.data?.score_increase || res.data?.estimated_score_boost || 6,
      });
    } catch (err) {
      const errMsg = err.response?.data?.error || 'AI rewrite request failed. Please try again.';
      showToast('danger', errMsg);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    if (aiSection === 'summary') {
      setResumeData((prev) => ({ ...prev, summary: aiSuggestion.improved_text }));
    } else if (aiSection === 'experience' && resumeData.work_experience.length > 0) {
      const updated = [...resumeData.work_experience];
      const bullets = [...(updated[0].bullets || [])];
      if (bullets.length > 0) bullets[0] = aiSuggestion.improved_text;
      else bullets.push(aiSuggestion.improved_text);
      updated[0] = { ...updated[0], bullets };
      setResumeData((prev) => ({ ...prev, work_experience: updated }));
    }
    setAiInputText(aiSuggestion.improved_text);
    setAiSuggestion(null);
    showToast('success', 'AI improvement applied to your live resume!');
  };

  const handleExportDocx = async () => {
    try {
      const payload = {
        ...resumeData,
        skills: Array.isArray(resumeData.skills)
          ? { 'Technical Skills': resumeData.skills.join(', ') }
          : resumeData.skills,
      };
      const res = await api.post('/resumes/builder/export-docx/', payload, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${resumeData.title.replace(/\s+/g, '_')}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('success', 'ATS-formatted DOCX downloaded!');
    } catch (err) {
      showToast('danger', 'DOCX export failed. Please try again.');
    }
  };

  const updatePersonal = (field, value) => {
    setResumeData((prev) => ({
      ...prev,
      personal_info: { ...prev.personal_info, [field]: value },
    }));
  };

  const addSkill = (e) => {
    e.preventDefault();
    const s = newSkill.trim();
    if (!s || resumeData.skills.includes(s)) return;
    setResumeData((prev) => ({ ...prev, skills: [...prev.skills, s] }));
    setNewSkill('');
  };

  const cardStyle = {
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  };

  if (loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="spinner-border" style={{ color: '#4F46E5' }} role="status"></div>
      </div>
    );
  }

  return (
    <div className="py-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="container-fluid px-3 px-xl-4">
        {toast && (
          <div
            className={`alert alert-${toast.type} d-flex align-items-center justify-content-between rounded-4 shadow-sm mb-3`}
          >
            <span className="small fw-semibold">{toast.message}</span>
            <button type="button" className="btn-close btn-sm" onClick={() => setToast(null)}></button>
          </div>
        )}

        {/* Top Studio Toolbar */}
        <div
          className="bg-white p-3 rounded-4 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3"
          style={cardStyle}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-3"
              style={{ width: '40px', height: '40px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}
            >
              <i className="bi bi-magic fs-5"></i>
            </div>
            <div>
              <input
                type="text"
                className="form-control form-control-sm fw-bold border-0 p-0 fs-5 text-dark"
                value={resumeData.title}
                onChange={(e) => setResumeData((prev) => ({ ...prev, title: e.target.value }))}
              />
              <div className="text-muted" style={{ fontSize: '12px' }}>
                3-Column AI Resume Studio • Live A4 ATS Preview
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="btn btn-sm bg-white fw-semibold px-3 py-2"
              style={{ border: '1px solid #CBD5E1', color: '#334155', borderRadius: '10px' }}
            >
              <i className="bi bi-cloud-check me-1 text-success"></i>
              {saving ? 'Saving...' : 'Save Progress'}
            </button>
            <button
              type="button"
              onClick={handleExportDocx}
              className="btn btn-sm fw-semibold px-3 py-2"
              style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '10px' }}
            >
              <i className="bi bi-file-earmark-word me-1"></i> Export DOCX
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-sm text-white fw-semibold px-3 py-2 shadow-sm"
              style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
            >
              <i className="bi bi-printer me-1"></i> Download PDF
            </button>
          </div>
        </div>

        {/* 3-Column Studio Grid */}
        <div className="row g-4">
          {/* Column 1 (4 cols): Structured Section Editors */}
          <div className="col-xl-4">
            <div className="d-flex flex-column gap-3">
              {/* Personal Info */}
              <div className="card bg-white p-4" style={cardStyle}>
                <h6 className="fw-bold text-dark mb-3">
                  <i className="bi bi-person-vcard me-2" style={{ color: '#4F46E5' }}></i>
                  Personal Information
                </h6>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="small text-muted">Full Name</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={resumeData.personal_info.full_name}
                      onChange={(e) => updatePersonal('full_name', e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="small text-muted">Target Title</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={resumeData.personal_info.role_title}
                      onChange={(e) => updatePersonal('role_title', e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="small text-muted">Email</label>
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      value={resumeData.personal_info.email}
                      onChange={(e) => updatePersonal('email', e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="small text-muted">Phone</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={resumeData.personal_info.phone}
                      onChange={(e) => updatePersonal('phone', e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="small text-muted">Location</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={resumeData.personal_info.location}
                      onChange={(e) => updatePersonal('location', e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="small text-muted">LinkedIn / GitHub</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={resumeData.personal_info.portfolio}
                      onChange={(e) => updatePersonal('portfolio', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Professional Summary */}
              <div className="card bg-white p-4" style={cardStyle}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold text-dark mb-0">
                    <i className="bi bi-card-text me-2" style={{ color: '#4F46E5' }}></i>
                    Professional Summary
                  </h6>
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 text-decoration-none fw-semibold"
                    style={{ color: '#4F46E5', fontSize: '12px' }}
                    onClick={() => {
                      setAiSection('summary');
                      setAiInputText(resumeData.summary);
                    }}
                  >
                    Send to AI <i className="bi bi-arrow-right"></i>
                  </button>
                </div>
                <textarea
                  rows="3"
                  className="form-control form-control-sm"
                  value={resumeData.summary}
                  onChange={(e) => setResumeData((prev) => ({ ...prev, summary: e.target.value }))}
                ></textarea>
              </div>

              {/* Skills Chips */}
              <div className="card bg-white p-4" style={cardStyle}>
                <h6 className="fw-bold text-dark mb-2">
                  <i className="bi bi-tools me-2" style={{ color: '#4F46E5' }}></i>
                  Technical Skills
                </h6>
                <div className="input-group input-group-sm mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Add skill..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="btn text-white fw-semibold"
                    style={{ backgroundColor: '#4F46E5' }}
                  >
                    Add
                  </button>
                </div>
                <div className="d-flex flex-wrap gap-1">
                  {resumeData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="badge rounded-pill px-2.5 py-1 fw-medium d-inline-flex align-items-center gap-1"
                      style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11.5px' }}
                    >
                      {skill}
                      <i
                        className="bi bi-x"
                        style={{ cursor: 'pointer' }}
                        onClick={() =>
                          setResumeData((prev) => ({
                            ...prev,
                            skills: prev.skills.filter((s) => s !== skill),
                          }))
                        }
                      ></i>
                    </span>
                  ))}
                </div>
              </div>

              {/* Work Experience Editor */}
              <div className="card bg-white p-4" style={cardStyle}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold text-dark mb-0">
                    <i className="bi bi-briefcase me-2" style={{ color: '#4F46E5' }}></i>
                    Work Experience
                  </h6>
                  <button
                    type="button"
                    className="btn btn-sm fw-semibold py-0 px-2"
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '12px' }}
                    onClick={() =>
                      setResumeData((prev) => ({
                        ...prev,
                        work_experience: [
                          ...prev.work_experience,
                          { role: 'Role Title', company: 'Company', duration: '2025', bullets: ['Delivered key project outcomes.'] },
                        ],
                      }))
                    }
                  >
                    + Add
                  </button>
                </div>

                {resumeData.work_experience.map((exp, idx) => (
                  <div key={idx} className="p-2.5 rounded-3 mb-2" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <div className="row g-1 mb-2">
                      <div className="col-6">
                        <input
                          type="text"
                          className="form-control form-control-sm fw-semibold"
                          value={exp.role}
                          onChange={(e) => {
                            const updated = [...resumeData.work_experience];
                            updated[idx].role = e.target.value;
                            setResumeData((prev) => ({ ...prev, work_experience: updated }));
                          }}
                        />
                      </div>
                      <div className="col-6">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={exp.company}
                          onChange={(e) => {
                            const updated = [...resumeData.work_experience];
                            updated[idx].company = e.target.value;
                            setResumeData((prev) => ({ ...prev, work_experience: updated }));
                          }}
                        />
                      </div>
                    </div>
                    <textarea
                      rows="2"
                      className="form-control form-control-sm"
                      value={(exp.bullets || []).join('\n')}
                      onChange={(e) => {
                        const updated = [...resumeData.work_experience];
                        updated[idx].bullets = e.target.value.split('\n');
                        setResumeData((prev) => ({ ...prev, work_experience: updated }));
                      }}
                    ></textarea>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2 (3 cols): AI Writing Assistant & Side-by-Side Diff */}
          <div className="col-xl-3">
            <div className="card bg-white p-4 h-100" style={cardStyle}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold text-dark">AI Assistant</span>
                  <span
                    className="badge rounded-pill px-2 py-0.5 fw-semibold"
                    style={{ backgroundColor: '#F5F3FF', color: '#7C3AED', fontSize: '10.5px' }}
                  >
                    Groq AI
                  </span>
                </div>
              </div>

              <label className="small fw-semibold text-muted mb-1">Target Section</label>
              <select
                className="form-select form-select-sm mb-3"
                value={aiSection}
                onChange={(e) => {
                  setAiSection(e.target.value);
                  if (e.target.value === 'summary') setAiInputText(resumeData.summary);
                  else setAiInputText(resumeData.work_experience[0]?.bullets?.[0] || '');
                }}
              >
                <option value="summary">Professional Summary</option>
                <option value="experience">Work Experience Bullet</option>
              </select>

              <label className="small fw-semibold text-muted mb-1">Text to Optimize</label>
              <textarea
                rows="3"
                className="form-control form-control-sm mb-3"
                placeholder="Paste a bullet point or summary sentence..."
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
              ></textarea>

              <div className="small fw-semibold text-muted mb-2">Improve with AI</div>
              <div className="d-flex flex-column gap-2 mb-3">
                {AI_ACTIONS.map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    disabled={aiLoading}
                    onClick={() => handleRunAiImprove(act.label)}
                    className="btn text-start p-2.5 rounded-3 d-flex align-items-center justify-content-between hover-card"
                    style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-2"
                        style={{ width: '30px', height: '30px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                      >
                        <i className={`bi ${act.icon}`}></i>
                      </div>
                      <div>
                        <div className="fw-semibold text-dark" style={{ fontSize: '12.5px' }}>{act.label}</div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>{act.desc}</div>
                      </div>
                    </div>
                    <i className="bi bi-chevron-right text-muted small"></i>
                  </button>
                ))}
              </div>

              {aiLoading && (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm" style={{ color: '#4F46E5' }}></div>
                  <div className="small text-muted mt-1">Rewriting with Groq AI...</div>
                </div>
              )}

              {/* Diff Suggestion Card */}
              {aiSuggestion && (
                <div
                  className="p-3 rounded-4 mt-2"
                  style={{ backgroundColor: '#F8FAFF', border: '1px solid #C7D2FE' }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-success-subtle text-success">
                      +{aiSuggestion.score_increase} ATS pts
                    </span>
                    <button
                      type="button"
                      className="btn-close btn-sm"
                      onClick={() => setAiSuggestion(null)}
                    ></button>
                  </div>

                  <div className="small fw-semibold text-success mb-1">Improved Suggestion:</div>
                  <p className="small text-dark bg-white p-2 rounded-2 border mb-2" style={{ lineHeight: 1.5 }}>
                    {aiSuggestion.improved_text}
                  </p>
                  <div className="text-muted mb-3" style={{ fontSize: '11px' }}>
                    {aiSuggestion.explanation}
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      onClick={applyAiSuggestion}
                      className="btn btn-sm text-white fw-semibold flex-grow-1"
                      style={{ backgroundColor: '#4F46E5', borderRadius: '8px' }}
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiSuggestion(null)}
                      className="btn btn-sm bg-white fw-semibold"
                      style={{ border: '1px solid #CBD5E1', color: '#475569', borderRadius: '8px' }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Column 3 (5 cols): Live A4 Resume Sheet Preview */}
          <div className="col-xl-5">
            <div
              className="bg-white p-4 p-md-5 rounded-4 shadow-sm"
              style={{
                border: '1px solid #CBD5E1',
                minHeight: '780px',
                fontFamily: "'Inter', Georgia, serif",
              }}
            >
              {/* A4 Header */}
              <div className="text-center pb-3 mb-3 border-bottom border-2">
                <h3 className="fw-bold text-uppercase mb-1" style={{ letterSpacing: '0.04em', color: '#0F172A' }}>
                  {resumeData.personal_info.full_name}
                </h3>
                <div className="fw-semibold small mb-2" style={{ color: '#4F46E5' }}>
                  {resumeData.personal_info.role_title}
                </div>
                <div className="d-flex flex-wrap justify-content-center gap-3 text-muted" style={{ fontSize: '11.5px' }}>
                  <span>
                    <i className="bi bi-envelope me-1"></i>
                    {resumeData.personal_info.email}
                  </span>
                  <span>
                    <i className="bi bi-telephone me-1"></i>
                    {resumeData.personal_info.phone}
                  </span>
                  <span>
                    <i className="bi bi-geo-alt me-1"></i>
                    {resumeData.personal_info.location}
                  </span>
                  {resumeData.personal_info.portfolio && (
                    <span>
                      <i className="bi bi-link-45deg me-1"></i>
                      {resumeData.personal_info.portfolio}
                    </span>
                  )}
                </div>
              </div>

              {/* A4 Summary */}
              {resumeData.summary && (
                <div className="mb-3">
                  <div
                    className="fw-bold text-uppercase small pb-1 mb-2 border-bottom"
                    style={{ color: '#4F46E5', letterSpacing: '0.05em', fontSize: '11.5px' }}
                  >
                    Professional Summary
                  </div>
                  <p className="small text-dark mb-0" style={{ lineHeight: 1.55, fontSize: '12.5px' }}>
                    {resumeData.summary}
                  </p>
                </div>
              )}

              {/* A4 Skills */}
              {resumeData.skills.length > 0 && (
                <div className="mb-3">
                  <div
                    className="fw-bold text-uppercase small pb-1 mb-2 border-bottom"
                    style={{ color: '#4F46E5', letterSpacing: '0.05em', fontSize: '11.5px' }}
                  >
                    Technical Skills
                  </div>
                  <p className="small text-dark mb-0" style={{ fontSize: '12.5px' }}>
                    {resumeData.skills.join(' • ')}
                  </p>
                </div>
              )}

              {/* A4 Work Experience */}
              {resumeData.work_experience.length > 0 && (
                <div className="mb-3">
                  <div
                    className="fw-bold text-uppercase small pb-1 mb-2 border-bottom"
                    style={{ color: '#4F46E5', letterSpacing: '0.05em', fontSize: '11.5px' }}
                  >
                    Work Experience
                  </div>
                  {resumeData.work_experience.map((exp, idx) => (
                    <div key={idx} className="mb-2">
                      <div className="d-flex justify-content-between align-items-baseline">
                        <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>
                          {exp.role}
                        </span>
                        <span className="text-muted" style={{ fontSize: '11.5px' }}>
                          {exp.duration}
                        </span>
                      </div>
                      <div className="fw-semibold mb-1" style={{ fontSize: '12px', color: '#4F46E5' }}>
                        {exp.company}
                      </div>
                      <ul className="ps-3 mb-0 small text-dark" style={{ fontSize: '12px', lineHeight: 1.5 }}>
                        {(exp.bullets || [])
                          .filter((b) => b.trim())
                          .map((bullet, bIdx) => (
                            <li key={bIdx}>{bullet}</li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* A4 Projects */}
              {resumeData.projects.length > 0 && (
                <div className="mb-3">
                  <div
                    className="fw-bold text-uppercase small pb-1 mb-2 border-bottom"
                    style={{ color: '#4F46E5', letterSpacing: '0.05em', fontSize: '11.5px' }}
                  >
                    Key Projects
                  </div>
                  {resumeData.projects.map((proj, idx) => (
                    <div key={idx} className="mb-2">
                      <div className="d-flex justify-content-between align-items-baseline">
                        <span className="fw-bold text-dark" style={{ fontSize: '13px' }}>
                          {proj.title}
                        </span>
                        <span className="text-muted" style={{ fontSize: '11px' }}>
                          {proj.link}
                        </span>
                      </div>
                      <ul className="ps-3 mb-0 small text-dark" style={{ fontSize: '12px', lineHeight: 1.5 }}>
                        {(proj.bullets || []).map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* A4 Education */}
              {resumeData.education.length > 0 && (
                <div>
                  <div
                    className="fw-bold text-uppercase small pb-1 mb-2 border-bottom"
                    style={{ color: '#4F46E5', letterSpacing: '0.05em', fontSize: '11.5px' }}
                  >
                    Education
                  </div>
                  {resumeData.education.map((edu, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-baseline mb-1">
                      <div>
                        <div className="fw-bold text-dark" style={{ fontSize: '12.5px' }}>
                          {edu.degree}
                        </div>
                        <div className="text-muted" style={{ fontSize: '11.5px' }}>
                          {edu.institution}
                        </div>
                      </div>
                      <span className="text-muted" style={{ fontSize: '11.5px' }}>
                        {edu.year}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;