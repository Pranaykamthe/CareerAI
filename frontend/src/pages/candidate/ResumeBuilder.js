import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumeService } from '../../services/resumeService';

const ResumeBuilder = () => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(null);
  const [uploadedResumes, setUploadedResumes] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [atsReport, setAtsReport] = useState(null);

  const [selectedSection, setSelectedSection] = useState('summary');
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [autoFixResult, setAutoFixResult] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    initBuilder();
  }, []);

  const initBuilder = async () => {
    try {
      const [drafts, resumes] = await Promise.all([
        resumeService.getDrafts(),
        resumeService.getResumes(),
      ]);
      setUploadedResumes(resumes);

      if (drafts.length > 0) {
        setDraft(drafts[0]);
      } else {
        const newDraft = await resumeService.createDraft();
        setDraft(newDraft);
      }

      if (resumes.length > 0) {
        const primary = resumes.find((r) => r.is_primary) || resumes[0];
        setSelectedSourceId(primary.id);
        const analysis = await resumeService.getAnalysis(primary.id);
        setAtsReport(analysis);
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'Failed to load Resume Builder.' });
    }
  };

  const handleSourceResumeChange = async (e) => {
    const id = e.target.value;
    setSelectedSourceId(id);
    if (!id) {
      setAtsReport(null);
      return;
    }
    try {
      const analysis = await resumeService.getAnalysis(id);
      setAtsReport(analysis);
    } catch {
      setAtsReport(null);
    }
  };

  // Auto-populate form fields from an uploaded parsed resume
  const handleImportParsedData = () => {
    const resObj = uploadedResumes.find((r) => String(r.id) === String(selectedSourceId));
    if (!resObj || !resObj.parsed_data) return;

    const parsed = resObj.parsed_data;
    const contact = parsed.contact || {};
    const skillsList = parsed.skills || [];

    setDraft((prev) => ({
      ...prev,
      source_resume: resObj.id,
      personal_info: {
        ...prev.personal_info,
        email: contact.email || prev.personal_info.email,
        phone: contact.phone || prev.personal_info.phone,
        linkedin: contact.linkedin || prev.personal_info.linkedin,
        portfolio: contact.github || prev.personal_info.portfolio,
      },
      skills: {
        ...prev.skills,
        Languages: skillsList.join(', ') || prev.skills.Languages,
      },
    }));
    setMessage({
      type: 'success',
      text: `Imported contact & ${skillsList.length} skills from ${resObj.file_name}`,
    });
  };

  const handleSaveDraft = async () => {
    if (!draft?.id) return;
    setSaving(true);
    try {
      const updated = await resumeService.updateDraft(draft.id, draft);
      setDraft(updated);
      setMessage({ type: 'success', text: 'Resume draft saved successfully!' });
    } catch {
      setMessage({ type: 'danger', text: 'Failed to save draft.' });
    } finally {
      setSaving(false);
    }
  };

  const getSectionContent = (section) => {
    if (section === 'summary') return draft.summary || '';
    if (section === 'work_experience') {
      return (draft.work_experience || [])
        .map((e) => `${e.role} at ${e.company}:\n- ${(e.bullets || []).join('\n- ')}`)
        .join('\n\n');
    }
    if (section === 'projects') {
      return (draft.projects || [])
        .map((p) => `${p.title}:\n- ${(p.bullets || []).join('\n- ')}`)
        .join('\n\n');
    }
    return draft.summary || '';
  };

  // Groq AI: Improve Summary, Work Experience, or Projects
  const handleImproveSection = async (section, action) => {
    const content = getSectionContent(section);
    if (!content.trim()) {
      setMessage({ type: 'warning', text: 'Add content to the selected section first.' });
      return;
    }

    setAiLoading(true);
    setAiSuggestion(null);
    setAutoFixResult(null);
    try {
      const res = await resumeService.aiImproveSection({
        section,
        action,
        content,
        target_role: draft.target_role,
        ats_issues: atsReport?.weaknesses || [],
      });
      setAiSuggestion({ section, action, original: content, ...res });
    } catch {
      setMessage({
        type: 'danger',
        text: 'Groq AI request failed. Check backend/.env GROQ_API_KEY.',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const applySingleSuggestion = () => {
    if (!aiSuggestion?.improved_text) return;

    if (aiSuggestion.section === 'summary') {
      setDraft((prev) => ({ ...prev, summary: aiSuggestion.improved_text }));
    } else if (
      aiSuggestion.section === 'work_experience' &&
      draft.work_experience?.length > 0
    ) {
      const bullets = aiSuggestion.improved_text
        .split('\n')
        .map((b) => b.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean);
      const copy = [...draft.work_experience];
      copy[0] = { ...copy[0], bullets };
      setDraft((prev) => ({ ...prev, work_experience: copy }));
    } else if (aiSuggestion.section === 'projects' && draft.projects?.length > 0) {
      const bullets = aiSuggestion.improved_text
        .split('\n')
        .map((b) => b.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean);
      const copy = [...draft.projects];
      copy[0] = { ...copy[0], bullets };
      setDraft((prev) => ({ ...prev, projects: copy }));
    }

    setAiSuggestion(null);
    setMessage({ type: 'success', text: 'Applied Groq AI improvement!' });
  };

  // Groq AI: One-Click Fix All ATS Analyzer Problems
  const handleAutoFixATS = async () => {
    setAiLoading(true);
    setAutoFixResult(null);
    setAiSuggestion(null);
    try {
      const res = await resumeService.autoFixATS({
        resume_id: selectedSourceId || null,
        draft_data: draft,
        target_role: draft.target_role,
        weaknesses: atsReport?.weaknesses || [
          'Lack of quantified metrics',
          'Weak action verbs',
        ],
        recommendations: atsReport?.recommendations || [],
      });
      setAutoFixResult(res);
    } catch {
      setMessage({ type: 'danger', text: 'Failed to run Groq ATS Auto-Fix.' });
    } finally {
      setAiLoading(false);
    }
  };

  const applyAllATSFixes = () => {
    if (!autoFixResult?.improved_sections) return;
    const imp = autoFixResult.improved_sections;
    setDraft((prev) => ({
      ...prev,
      summary: imp.summary || prev.summary,
      skills: imp.skills || prev.skills,
      work_experience: imp.work_experience?.length
        ? imp.work_experience
        : prev.work_experience,
      projects: imp.projects?.length ? imp.projects : prev.projects,
    }));
    setAutoFixResult(null);
    setMessage({
      type: 'success',
      text: 'All ATS Analyzer improvements applied to your resume!',
    });
  };

  if (!draft) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary"></div>
        <p className="mt-2 text-muted">Initializing AI Resume Builder...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3 px-lg-4">
      {/* Print-only CSS so Download PDF outputs only the clean A4 Sample Resume */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #resume-a4-preview, #resume-a4-preview * { visibility: visible; }
          #resume-a4-preview {
            position: absolute; left: 0; top: 0; width: 100%;
            box-shadow: none !important; border: none !important; padding: 0 !important;
          }
        }
        .resume-section-heading {
          color: #2563EB;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          border-bottom: 1px solid #CBD5E1;
          padding-bottom: 3px;
          margin-top: 14px;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
      `}</style>

      {/* Top Action Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center bg-white p-3 rounded-4 shadow-sm mb-3 gap-2">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate('/resumes')}
          >
            <i className="bi bi-arrow-left me-1"></i>Back
          </button>
          <input
            type="text"
            className="form-control form-control-sm fw-bold border-0 bg-light"
            style={{ width: '240px' }}
            value={draft.title || ''}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <span className="badge bg-success-subtle text-success border border-success-subtle">
            Sample ATS Template
          </span>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={handleSaveDraft}
            disabled={saving}
          >
            <i className="bi bi-cloud-check me-1"></i>
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => resumeService.exportDocx(draft)}
          >
            <i className="bi bi-file-earmark-word me-1"></i>Download DOCX
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
            <i className="bi bi-printer me-1"></i>Print / Save PDF
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type} alert-dismissible fade show py-2 small`}>
          {message.text}
          <button
            type="button"
            className="btn-close py-2"
            onClick={() => setMessage(null)}
          ></button>
        </div>
      )}

      <div className="row g-3">
        {/* LEFT COLUMN: Structured Form Sections */}
        <div className="col-lg-4" style={{ maxHeight: '82vh', overflowY: 'auto' }}>
          {/* Personal Info */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
            <h6 className="fw-bold text-primary mb-3">
              <i className="bi bi-person-badge me-2"></i>Personal Information
            </h6>
            <div className="row g-2">
              <div className="col-6">
                <label className="form-label small fw-semibold mb-0">Full Name</label>
                <input
                  className="form-control form-control-sm"
                  value={draft.personal_info?.full_name || ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      personal_info: { ...draft.personal_info, full_name: e.target.value },
                    })
                  }
                />
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold mb-0">Role Headline</label>
                <input
                  className="form-control form-control-sm"
                  value={draft.personal_info?.role_title || ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      personal_info: { ...draft.personal_info, role_title: e.target.value },
                    })
                  }
                />
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold mb-0">Email</label>
                <input
                  className="form-control form-control-sm"
                  value={draft.personal_info?.email || ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      personal_info: { ...draft.personal_info, email: e.target.value },
                    })
                  }
                />
              </div>
              <div className="col-6">
                <label className="form-label small fw-semibold mb-0">Phone</label>
                <input
                  className="form-control form-control-sm"
                  value={draft.personal_info?.phone || ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      personal_info: { ...draft.personal_info, phone: e.target.value },
                    })
                  }
                />
              </div>
              <div className="col-4">
                <label className="form-label small fw-semibold mb-0">Location</label>
                <input
                  className="form-control form-control-sm"
                  value={draft.personal_info?.location || ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      personal_info: { ...draft.personal_info, location: e.target.value },
                    })
                  }
                />
              </div>
              <div className="col-4">
                <label className="form-label small fw-semibold mb-0">LinkedIn</label>
                <input
                  className="form-control form-control-sm"
                  value={draft.personal_info?.linkedin || ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      personal_info: { ...draft.personal_info, linkedin: e.target.value },
                    })
                  }
                />
              </div>
              <div className="col-4">
                <label className="form-label small fw-semibold mb-0">Portfolio / GitHub</label>
                <input
                  className="form-control form-control-sm"
                  value={draft.personal_info?.portfolio || ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      personal_info: { ...draft.personal_info, portfolio: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold text-primary mb-0">
                <i className="bi bi-card-text me-2"></i>Professional Summary
              </h6>
              <button
                className="btn btn-outline-primary btn-sm py-0 px-2"
                onClick={() => setSelectedSection('summary')}
              >
                Select for AI
              </button>
            </div>
            <textarea
              className="form-control form-control-sm"
              rows="3"
              value={draft.summary || ''}
              onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
            />
          </div>

          {/* Categorized Skills */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
            <h6 className="fw-bold text-primary mb-2">
              <i className="bi bi-tools me-2"></i>Skills (Grouped)
            </h6>
            {Object.entries(draft.skills || {}).map(([cat, val]) => (
              <div className="mb-2" key={cat}>
                <label className="form-label small fw-semibold mb-0">{cat}</label>
                <input
                  className="form-control form-control-sm"
                  value={val}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      skills: { ...draft.skills, [cat]: e.target.value },
                    })
                  }
                />
              </div>
            ))}
          </div>

          {/* Work Experience */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold text-primary mb-0">
                <i className="bi bi-briefcase me-2"></i>Work Experience
              </h6>
              <button
                className="btn btn-outline-primary btn-sm py-0"
                onClick={() =>
                  setDraft({
                    ...draft,
                    work_experience: [
                      ...(draft.work_experience || []),
                      {
                        role: 'Software Engineer',
                        company: 'Company Name',
                        location: 'City',
                        duration: '2024 - Present',
                        bullets: ['Built scalable feature using React and Django'],
                      },
                    ],
                  })
                }
              >
                + Add
              </button>
            </div>
            {(draft.work_experience || []).map((exp, idx) => (
              <div key={idx} className="border rounded-3 p-2 mb-2 bg-light">
                <div className="row g-1 mb-1">
                  <div className="col-6">
                    <input
                      className="form-control form-control-sm fw-semibold"
                      placeholder="Role"
                      value={exp.role || ''}
                      onChange={(e) => {
                        const copy = [...draft.work_experience];
                        copy[idx].role = e.target.value;
                        setDraft({ ...draft, work_experience: copy });
                      }}
                    />
                  </div>
                  <div className="col-6">
                    <input
                      className="form-control form-control-sm"
                      placeholder="Company"
                      value={exp.company || ''}
                      onChange={(e) => {
                        const copy = [...draft.work_experience];
                        copy[idx].company = e.target.value;
                        setDraft({ ...draft, work_experience: copy });
                      }}
                    />
                  </div>
                  <div className="col-6">
                    <input
                      className="form-control form-control-sm"
                      placeholder="Duration"
                      value={exp.duration || ''}
                      onChange={(e) => {
                        const copy = [...draft.work_experience];
                        copy[idx].duration = e.target.value;
                        setDraft({ ...draft, work_experience: copy });
                      }}
                    />
                  </div>
                  <div className="col-6">
                    <input
                      className="form-control form-control-sm"
                      placeholder="Location"
                      value={exp.location || ''}
                      onChange={(e) => {
                        const copy = [...draft.work_experience];
                        copy[idx].location = e.target.value;
                        setDraft({ ...draft, work_experience: copy });
                      }}
                    />
                  </div>
                </div>
                <textarea
                  className="form-control form-control-sm"
                  rows="3"
                  placeholder="One bullet per line"
                  value={(exp.bullets || []).join('\n')}
                  onChange={(e) => {
                    const copy = [...draft.work_experience];
                    copy[idx].bullets = e.target.value.split('\n');
                    setDraft({ ...draft, work_experience: copy });
                  }}
                />
              </div>
            ))}
          </div>

          {/* Education */}
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
            <h6 className="fw-bold text-primary mb-2">
              <i className="bi bi-mortarboard me-2"></i>Education
            </h6>
            {(draft.education || []).map((edu, idx) => (
              <div key={idx} className="row g-1 mb-2">
                <div className="col-12">
                  <input
                    className="form-control form-control-sm fw-semibold"
                    placeholder="Degree"
                    value={edu.degree || ''}
                    onChange={(e) => {
                      const copy = [...draft.education];
                      copy[idx].degree = e.target.value;
                      setDraft({ ...draft, education: copy });
                    }}
                  />
                </div>
                <div className="col-7">
                  <input
                    className="form-control form-control-sm"
                    placeholder="Institution"
                    value={edu.institution || ''}
                    onChange={(e) => {
                      const copy = [...draft.education];
                      copy[idx].institution = e.target.value;
                      setDraft({ ...draft, education: copy });
                    }}
                  />
                </div>
                <div className="col-5">
                  <input
                    className="form-control form-control-sm"
                    placeholder="Graduation Date"
                    value={edu.graduation_date || ''}
                    onChange={(e) => {
                      const copy = [...draft.education];
                      copy[idx].graduation_date = e.target.value;
                      setDraft({ ...draft, education: copy });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Projects */}
          <div className="card border-0 shadow-sm rounded-4 p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold text-primary mb-0">
                <i className="bi bi-code-square me-2"></i>Projects
              </h6>
              <button
                className="btn btn-outline-primary btn-sm py-0"
                onClick={() =>
                  setDraft({
                    ...draft,
                    projects: [
                      ...(draft.projects || []),
                      { title: 'Project Title', link: '', bullets: ['Built project feature'] },
                    ],
                  })
                }
              >
                + Add
              </button>
            </div>
            {(draft.projects || []).map((proj, idx) => (
              <div key={idx} className="border rounded-3 p-2 mb-2 bg-light">
                <div className="row g-1 mb-1">
                  <div className="col-7">
                    <input
                      className="form-control form-control-sm fw-semibold"
                      placeholder="Project Title"
                      value={proj.title || ''}
                      onChange={(e) => {
                        const copy = [...draft.projects];
                        copy[idx].title = e.target.value;
                        setDraft({ ...draft, projects: copy });
                      }}
                    />
                  </div>
                  <div className="col-5">
                    <input
                      className="form-control form-control-sm"
                      placeholder="GitHub / Link"
                      value={proj.link || ''}
                      onChange={(e) => {
                        const copy = [...draft.projects];
                        copy[idx].link = e.target.value;
                        setDraft({ ...draft, projects: copy });
                      }}
                    />
                  </div>
                </div>
                <textarea
                  className="form-control form-control-sm"
                  rows="2"
                  placeholder="One bullet per line"
                  value={(proj.bullets || []).join('\n')}
                  onChange={(e) => {
                    const copy = [...draft.projects];
                    copy[idx].bullets = e.target.value.split('\n');
                    setDraft({ ...draft, projects: copy });
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* CENTER COLUMN: Groq AI Assistant & ATS Analyzer Auto-Fix */}
        <div className="col-lg-3" style={{ maxHeight: '82vh', overflowY: 'auto' }}>
          <div className="card border-0 shadow-sm rounded-4 p-3 mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h6 className="fw-bold mb-0">
                <i className="bi bi-stars text-primary me-1"></i>Groq AI Assistant
              </h6>
              <span className="badge bg-primary-subtle text-primary">Groq LLM</span>
            </div>
            <p className="text-muted small mb-2">
              Select a section to rewrite or auto-fix weaknesses flagged by the ATS Analyzer.
            </p>

            {/* Link Uploaded Resume & ATS Report */}
            <label className="form-label small text-muted mb-1">Sync with ATS Analyzer Resume:</label>
            <select
              className="form-select form-select-sm mb-2"
              value={selectedSourceId}
              onChange={handleSourceResumeChange}
            >
              <option value="">-- Select Uploaded Resume --</option>
              {uploadedResumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.file_name}
                </option>
              ))}
            </select>

            {selectedSourceId && (
              <button
                className="btn btn-outline-secondary btn-sm w-100 mb-3"
                onClick={handleImportParsedData}
              >
                <i className="bi bi-box-arrow-in-down me-1"></i>Import Parsed Skills & Contact
              </button>
            )}

            {/* ATS Analyzer Problems Detected */}
            <div className="bg-light rounded-3 p-2 mb-3 border">
              {atsReport && (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small fw-bold">Current ATS Score:</span>
                    <span
                      className={`badge ${
                        atsReport.overall_score >= 80 ? 'bg-success' : 'bg-warning text-dark'
                      }`}
                    >
                      {atsReport.overall_score} / 100
                    </span>
                  </div>
                  {atsReport.weaknesses?.length > 0 && (
                    <div className="small text-danger mb-2">
                      <strong>Problems Found:</strong>
                      <ul className="ps-3 mb-0 mt-1">
                        {atsReport.weaknesses.slice(0, 3).map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
              <button
                className="btn btn-primary btn-sm w-100 fw-semibold"
                onClick={handleAutoFixATS}
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>Fixing with Groq...
                  </>
                ) : (
                  <>
                    <i className="bi bi-magic me-1"></i>Auto-Fix ATS Analyzer Issues
                  </>
                )}
              </button>
            </div>

            {/* Target Section Selector */}
            <label className="form-label small fw-semibold mb-1">Target Section</label>
            <select
              className="form-select form-select-sm mb-2"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="summary">Professional Summary</option>
              <option value="work_experience">Work Experience</option>
              <option value="projects">Projects</option>
            </select>

            {/* Quick AI Section Actions */}
            <div className="d-grid gap-2 mb-3">
              <button
                className="btn btn-light border text-start btn-sm"
                disabled={aiLoading}
                onClick={() =>
                  handleImproveSection(
                    selectedSection,
                    'Improve sentence clarity, impact, and ATS keyword density'
                  )
                }
              >
                <i className="bi bi-stars text-primary me-2"></i>Improve sentence
              </button>
              <button
                className="btn btn-light border text-start btn-sm"
                disabled={aiLoading}
                onClick={() =>
                  handleImproveSection(
                    selectedSection,
                    'Make tone more executive, concise, and professional'
                  )
                }
              >
                <i className="bi bi-briefcase text-primary me-2"></i>Make more professional
              </button>
              <button
                className="btn btn-light border text-start btn-sm"
                disabled={aiLoading}
                onClick={() =>
                  handleImproveSection(
                    selectedSection,
                    'Start bullet points with strong, high-impact action verbs'
                  )
                }
              >
                <i className="bi bi-lightning-charge text-primary me-2"></i>Add action verbs
              </button>
              <button
                className="btn btn-light border text-start btn-sm"
                disabled={aiLoading}
                onClick={() =>
                  handleImproveSection(
                    selectedSection,
                    'Quantify achievements using the XYZ formula with measurable metrics'
                  )
                }
              >
                <i className="bi bi-graph-up-arrow text-primary me-2"></i>Quantify achievement (XYZ)
              </button>
              <button
                className="btn btn-light border text-start btn-sm"
                disabled={aiLoading}
                onClick={() =>
                  handleImproveSection(
                    selectedSection,
                    'Shorten content while preserving key technical impact'
                  )
                }
              >
                <i className="bi bi-text-indent-left text-primary me-2"></i>Shorten content
              </button>
            </div>

            {/* Custom Prompt Input */}
            <label className="form-label small fw-semibold mb-1">Ask Groq AI anything...</label>
            <div className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Tailor for React & Django role"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
              <button
                className="btn btn-primary"
                disabled={aiLoading || !customPrompt.trim()}
                onClick={() => handleImproveSection(selectedSection, customPrompt)}
              >
                <i className="bi bi-send"></i>
              </button>
            </div>

            {/* Single-Section Diff Card */}
            {aiSuggestion && (
              <div className="mt-3 p-2 border border-primary rounded-3 bg-primary-subtle bg-opacity-10">
                <div className="small fw-bold text-primary mb-1">
                  Groq AI Suggestion (+{aiSuggestion.estimated_score_boost || 6} pts)
                </div>
                <p className="small bg-white p-2 rounded border mb-1" style={{ whiteSpace: 'pre-line' }}>
                  {aiSuggestion.improved_text}
                </p>
                <p className="text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                  {aiSuggestion.explanation}
                </p>
                <div className="d-flex gap-2">
                  <button className="btn btn-success btn-sm flex-fill" onClick={applySingleSuggestion}>
                    Apply
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm flex-fill"
                    onClick={() => setAiSuggestion(null)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* Full ATS Auto-Fix Diff Card */}
            {autoFixResult?.improved_sections && (
              <div className="mt-3 p-2 border border-success rounded-3 bg-success-subtle bg-opacity-10">
                <div className="small fw-bold text-success mb-1">
                  ATS Optimization Ready (Est. Score:{' '}
                  {autoFixResult.improved_sections.estimated_new_score}/100)
                </div>
                <ul className="small ps-3 mb-2">
                  {(autoFixResult.improved_sections.changes_summary || []).map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
                <div className="d-flex gap-2">
                  <button className="btn btn-success btn-sm flex-fill" onClick={applyAllATSFixes}>
                    Apply All Fixes
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm flex-fill"
                    onClick={() => setAutoFixResult(null)}
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Sample Resume Preview */}
        <div className="col-lg-5" style={{ maxHeight: '82vh', overflowY: 'auto' }}>
          <div
            id="resume-a4-preview"
            className="bg-white shadow-sm border rounded-2 p-4 mx-auto"
            style={{
              minHeight: '842px',
              fontFamily: 'Inter, Arial, sans-serif',
              color: '#1E293B',
              fontSize: '0.88rem',
            }}
          >
            {/* Header */}
            <div className="text-center mb-3">
              <h3 className="fw-bold mb-0 text-uppercase" style={{ letterSpacing: '0.04em' }}>
                {draft.personal_info?.full_name || 'JOHN DOE'}
              </h3>
              <div className="fw-bold text-primary small text-uppercase" style={{ letterSpacing: '0.08em' }}>
                {draft.personal_info?.role_title || 'SOFTWARE ENGINEER'}
              </div>
              <div className="text-muted mt-1" style={{ fontSize: '0.78rem' }}>
                {[
                  draft.personal_info?.email,
                  draft.personal_info?.phone,
                  draft.personal_info?.location,
                  draft.personal_info?.linkedin,
                  draft.personal_info?.portfolio,
                ]
                  .filter(Boolean)
                  .join('  •  ')}
              </div>
            </div>

            {/* Summary */}
            {draft.summary && (
              <>
                <div className="resume-section-heading">Professional Summary</div>
                <p className="mb-2" style={{ lineHeight: '1.45' }}>
                  {draft.summary}
                </p>
              </>
            )}

            {/* Skills */}
            {draft.skills && (
              <>
                <div className="resume-section-heading">Skills</div>
                <div className="mb-2" style={{ lineHeight: '1.45' }}>
                  {Object.entries(draft.skills).map(([cat, items]) =>
                    items ? (
                      <div key={cat}>
                        <strong>{cat}:</strong> {items}
                      </div>
                    ) : null
                  )}
                </div>
              </>
            )}

            {/* Work Experience */}
            {draft.work_experience?.length > 0 && (
              <>
                <div className="resume-section-heading">Work Experience</div>
                {draft.work_experience.map((exp, i) => (
                  <div key={i} className="mb-2">
                    <div className="d-flex justify-content-between fw-bold">
                      <span>{exp.role}</span>
                      <span className="small text-muted">{exp.duration}</span>
                    </div>
                    <div className="d-flex justify-content-between text-primary small mb-1">
                      <span>{exp.company}</span>
                      <span className="text-muted">{exp.location}</span>
                    </div>
                    <ul className="ps-3 mb-1">
                      {(exp.bullets || []).filter(Boolean).map((b, bi) => (
                        <li key={bi}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            )}

            {/* Education */}
            {draft.education?.length > 0 && (
              <>
                <div className="resume-section-heading">Education</div>
                {draft.education.map((edu, i) => (
                  <div key={i} className="d-flex justify-content-between mb-1">
                    <div>
                      <strong>{edu.degree}</strong>
                      <div className="text-muted small">{edu.institution}</div>
                    </div>
                    <div className="text-end small text-muted">
                      <div>{edu.graduation_date}</div>
                      <div>{edu.location}</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Projects */}
            {draft.projects?.length > 0 && (
              <>
                <div className="resume-section-heading">Projects</div>
                {draft.projects.map((proj, i) => (
                  <div key={i} className="mb-2">
                    <div className="d-flex justify-content-between">
                      <strong>{proj.title}</strong>
                      <span className="text-primary small">{proj.link}</span>
                    </div>
                    <ul className="ps-3 mb-0">
                      {(proj.bullets || []).filter(Boolean).map((b, bi) => (
                        <li key={bi}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;