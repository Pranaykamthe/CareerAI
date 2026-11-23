import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import { resumeService } from '../../services/resumeService';

const SECTION_OPTIONS = [
  { id: 'summary', label: 'Summary', icon: 'bi-card-text' },
  { id: 'skills', label: 'Skills', icon: 'bi-tools' },
  { id: 'work_experience', label: 'Experience', icon: 'bi-briefcase' },
  { id: 'projects', label: 'Projects', icon: 'bi-code-square' },
];

const SECTION_AI_ACTIONS = {
  summary: [
    {
      id: 'exec_pitch',
      label: 'Executive 3-Line Pitch',
      desc: 'Crisp, high-impact career overview',
      icon: 'bi-stars',
      prompt: 'Rewrite as a concise, high-impact 3-sentence professional summary paragraph without bullet points.',
    },
    {
      id: 'weave_stack',
      label: 'Highlight Core Tech Stack',
      desc: 'Integrate key technologies naturally',
      icon: 'bi-cpu',
      prompt: 'Rewrite the professional summary to naturally highlight core programming languages, frameworks, and backend/frontend strengths.',
    },
    {
      id: 'summary_metrics',
      label: 'Add Career Metrics',
      desc: 'Emphasize delivery & performance gains',
      icon: 'bi-graph-up-arrow',
      prompt: 'Enhance the summary with measurable engineering outcomes, scalability, and delivery impact.',
    },
    {
      id: 'role_align',
      label: 'Align to Target Role',
      desc: 'Tailor positioning for target job title',
      icon: 'bi-bullseye',
      prompt: 'Tailor the professional summary directly to the candidate target role and ATS recruiter keywords.',
    },
  ],
  skills: [
    {
      id: 'suggest_skills',
      label: 'Suggest Missing Role Skills',
      desc: 'Add in-demand skills for target role',
      icon: 'bi-plus-circle',
      prompt: 'Keep existing skills and append 4-6 high-demand technical skills relevant to the target role. Return ONLY a comma-separated list of skill names.',
    },
    {
      id: 'standardize_ats',
      label: 'Standardize ATS Keywords',
      desc: 'Normalize names (e.g., React.js, REST APIs)',
      icon: 'bi-check2-circle',
      prompt: 'Standardize all skill names into clean, ATS-recognized industry terms (e.g., React.js, Django REST Framework, PostgreSQL). Return ONLY a comma-separated list.',
    },
    {
      id: 'prioritize_skills',
      label: 'Prioritize Core Stack First',
      desc: 'Order strongest job-relevant skills first',
      icon: 'bi-sort-up',
      prompt: 'Reorder the skills so the most impactful languages, frameworks, and cloud/database tools appear first. Return ONLY a comma-separated list.',
    },
    {
      id: 'clean_skills',
      label: 'Remove Duplicates & Noise',
      desc: 'Keep high-signal technical skills only',
      icon: 'bi-funnel',
      prompt: 'Remove duplicate, overly generic, or redundant entries and keep only high-signal technical skills. Return ONLY a comma-separated list.',
    },
  ],
  work_experience: [
    {
      id: 'action_verbs',
      label: 'Start with Action Verbs',
      desc: 'Lead bullets with Architected, Engineered, Built',
      icon: 'bi-lightning-charge',
      prompt: 'Rewrite every experience bullet starting with a strong past-tense engineering action verb (e.g., Engineered, Architected, Optimized).',
    },
    {
      id: 'xyz_metrics',
      label: 'Quantify with XYZ Metrics',
      desc: 'Add %, latency, throughput, or user scale',
      icon: 'bi-graph-up-arrow',
      prompt: 'Rewrite experience bullets using the Google XYZ formula (Accomplished X as measured by Y, by doing Z) with realistic quantified metrics.',
    },
    {
      id: 'system_ownership',
      label: 'Highlight Ownership & Scale',
      desc: 'Emphasize API design, CI/CD & reliability',
      icon: 'bi-diagram-3',
      prompt: 'Elevate the bullets to emphasize end-to-end feature ownership, API scalability, testing, and production reliability.',
    },
    {
      id: 'concise_bullets',
      label: 'Tighten Bullet Length',
      desc: 'Crisp 1-line ATS-scannable bullets',
      icon: 'bi-scissors',
      prompt: 'Condense wordy experience bullets into punchy, 1-line ATS-scannable bullet points without losing technical specifics.',
    },
  ],
  projects: [
    {
      id: 'project_stack',
      label: 'Showcase Tech Stack',
      desc: 'Highlight frameworks, APIs & databases',
      icon: 'bi-code-slash',
      prompt: 'Rewrite project bullets to explicitly highlight the frameworks, APIs, database architecture, and tools used.',
    },
    {
      id: 'project_metrics',
      label: 'Add Project Outcomes',
      desc: 'Quantify speed, accuracy, or automation',
      icon: 'bi-graph-up-arrow',
      prompt: 'Add measurable project outcomes such as response time improvements, automation savings, or accuracy metrics.',
    },
    {
      id: 'problem_solution',
      label: 'Clarify Problem & Impact',
      desc: 'Frame what problem the project solves',
      icon: 'bi-lightbulb',
      prompt: 'Structure the project bullets to clearly state the real-world problem solved, the technical implementation, and end-user value.',
    },
    {
      id: 'project_ats',
      label: 'ATS Bullet Polish',
      desc: 'Convert into clean action-driven bullets',
      icon: 'bi-stars',
      prompt: 'Polish project descriptions into strong, action-oriented resume bullets optimized for technical recruiters.',
    },
  ],
};

const normalizeSkillsArray = (rawSkills) => {
  if (Array.isArray(rawSkills)) {
    return rawSkills.map((s) => String(s).trim()).filter(Boolean);
  }
  if (rawSkills && typeof rawSkills === 'object') {
    return Object.values(rawSkills)
      .flatMap((val) => (Array.isArray(val) ? val : String(val).split(',')))
      .map((s) => String(s).trim())
      .filter(Boolean);
  }
  return [];
};

const cleanCitationTags = (str) =>
  typeof str === 'string' ? str.replace(/\[cite:[^\]]*\]/gi, '').trim() : str;

const ResumeBuilder = () => {
  const location = useLocation();
  const [targetJob, setTargetJob] = useState(location.state?.targetJob || null);
  const [activeMode, setActiveMode] = useState('resume'); // 'resume' | 'cover-letter'

  const [draftId, setDraftId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [newSkill, setNewSkill] = useState('');

  // Uploaded Resumes (for optional pre-fill & ATS issue context)
  const [uploadedResumes, setUploadedResumes] = useState([]);
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [atsReport, setAtsReport] = useState(null);

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

  // Section-Specific AI Assistant State
  const [aiSection, setAiSection] = useState('summary'); // 'summary' | 'skills' | 'work_experience' | 'projects'
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [aiInputText, setAiInputText] = useState('');
  const [customAiPrompt, setCustomAiPrompt] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // AI Cover Letter State
  const [clCompany, setClCompany] = useState(location.state?.targetJob?.company || '');
  const [clRole, setClRole] = useState(location.state?.targetJob?.title || '');
  const [clJobDesc, setClJobDesc] = useState(location.state?.targetJob?.description || '');
  const [clTone, setClTone] = useState('Professional & Confident');
  const [clLoading, setClLoading] = useState(false);
  const [clResult, setClResult] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const getSectionText = (section, index = 0, data = resumeData) => {
    if (section === 'summary') return data.summary || '';
    if (section === 'skills') return (data.skills || []).join(', ');
    if (section === 'work_experience') {
      const exp = data.work_experience?.[index] || data.work_experience?.[0];
      return exp ? (exp.bullets || []).join('\n') : '';
    }
    if (section === 'projects') {
      const proj = data.projects?.[index] || data.projects?.[0];
      return proj ? (proj.bullets || []).join('\n') : '';
    }
    return '';
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [draftResp, resumesResp] = await Promise.all([
          resumeService.getDrafts().catch(() => []),
          resumeService.getResumes().catch(() => []),
        ]);

        const drafts = Array.isArray(draftResp) ? draftResp : draftResp?.results || [];
        const resumes = Array.isArray(resumesResp) ? resumesResp : resumesResp?.results || [];
        setUploadedResumes(resumes);

        if (resumes.length > 0) {
          const primary = resumes.find((r) => r.is_primary) || resumes[0];
          setSelectedSourceId(String(primary.id));
          try {
            const analysis = await resumeService.getAnalysis(primary.id);
            setAtsReport(analysis);
          } catch {
            setAtsReport(null);
          }
        }

        if (drafts.length > 0) {
          const latest = drafts[0];
          const normalizedSkills = normalizeSkillsArray(latest.skills);
          const merged = {
            ...resumeData,
            title: targetJob ? `${targetJob.title} — Tailored Resume` : latest.title || resumeData.title,
            personal_info: { ...resumeData.personal_info, ...(latest.personal_info || {}) },
            summary: latest.summary || resumeData.summary,
            skills: normalizedSkills.length ? normalizedSkills : resumeData.skills,
            work_experience:
              Array.isArray(latest.work_experience) && latest.work_experience.length
                ? latest.work_experience
                : resumeData.work_experience,
            education:
              Array.isArray(latest.education) && latest.education.length
                ? latest.education
                : resumeData.education,
            projects:
              Array.isArray(latest.projects) && latest.projects.length
                ? latest.projects
                : resumeData.projects,
          };
          setDraftId(latest.id);
          setResumeData(merged);
          setAiInputText(merged.summary || '');
        } else {
          setAiInputText(resumeData.summary);
        }
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

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

  const handleImportFromUploadedResume = () => {
    const resObj = uploadedResumes.find((r) => String(r.id) === String(selectedSourceId));
    if (!resObj || !resObj.parsed_data) {
      showToast('danger', 'No parsed data found for the selected resume.');
      return;
    }

    const parsed = resObj.parsed_data;
    const contact = parsed.contact || {};
    const extractedSkills = normalizeSkillsArray(parsed.skills);
    const sections = parsed.sections || {};

    setResumeData((prev) => {
      const updated = {
        ...prev,
        personal_info: {
          ...prev.personal_info,
          email: contact.email || prev.personal_info.email,
          phone: contact.phone || prev.personal_info.phone,
          linkedin: contact.linkedin || prev.personal_info.linkedin,
          portfolio: contact.github || contact.portfolio || prev.personal_info.portfolio,
        },
        summary: sections.summary ? String(sections.summary).slice(0, 600) : prev.summary,
        skills: extractedSkills.length ? extractedSkills : prev.skills,
      };
      setAiInputText(getSectionText(aiSection, selectedItemIndex, updated));
      return updated;
    });

    showToast('success', `Imported contact & ${extractedSkills.length} skills from ${resObj.file_name}`);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      let currentId = draftId;
      if (currentId) {
        await resumeService.updateDraft(currentId, resumeData);
      } else {
        const res = await resumeService.createDraft(resumeData);
        currentId = res?.id;
        setDraftId(currentId);
      }
      showToast('success', 'Resume draft saved successfully!');
      return currentId;
    } catch {
      showToast('danger', 'Unable to save draft to server.');
      return draftId;
    } finally {
      setSaving(false);
    }
  };

  const selectSectionForAi = (section, index = 0) => {
    setAiSection(section);
    setSelectedItemIndex(index);
    setAiSuggestion(null);
    setCustomAiPrompt('');
    setAiInputText(getSectionText(section, index, resumeData));
  };

  const handleRunAiImprove = async (actionInstruction) => {
    const targetText = aiInputText.trim() || getSectionText(aiSection, selectedItemIndex, resumeData);

    if (!targetText) {
      showToast('danger', 'Select or enter content in the chosen section first.');
      return;
    }

    const formattedAction =
      aiSection === 'skills'
        ? `${actionInstruction} (Important: Output ONLY a clean comma-separated list of technical skills, no bullet sentences.)`
        : actionInstruction;

    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const cleanWeaknesses = (atsReport?.weaknesses || []).map(cleanCitationTags);
      const res = await resumeService.aiImproveSection({
        section: aiSection,
        action: formattedAction,
        content: targetText,
        original_text: targetText,
        target_role: targetJob?.title || resumeData.personal_info.role_title,
        ats_issues: cleanWeaknesses,
        target_job: targetJob || null,
      });
      setAiSuggestion({
        section: aiSection,
        itemIndex: selectedItemIndex,
        original_text: targetText,
        improved_text: res?.improved_text || targetText,
        explanation: res?.explanation || 'Enhanced action verbs and ATS keyword alignment.',
        score_increase: res?.estimated_score_boost || res?.score_increase || 7,
      });
    } catch (err) {
      showToast('danger', err.response?.data?.detail || 'AI rewrite request failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    const { section, itemIndex, improved_text } = aiSuggestion;

    if (section === 'summary') {
      const cleanSummary = improved_text
        .split('\n')
        .map((line) => line.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean)
        .join(' ');
      setResumeData((prev) => ({ ...prev, summary: cleanSummary }));
      setAiInputText(cleanSummary);
    } else if (section === 'work_experience' && resumeData.work_experience.length > 0) {
      const bullets = improved_text
        .split('\n')
        .map((b) => b.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean);
      const updated = [...resumeData.work_experience];
      const idx = Math.min(itemIndex, updated.length - 1);
      updated[idx] = { ...updated[idx], bullets };
      setResumeData((prev) => ({ ...prev, work_experience: updated }));
      setAiInputText(bullets.join('\n'));
    } else if (section === 'projects' && resumeData.projects.length > 0) {
      const bullets = improved_text
        .split('\n')
        .map((b) => b.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean);
      const updated = [...resumeData.projects];
      const idx = Math.min(itemIndex, updated.length - 1);
      updated[idx] = { ...updated[idx], bullets };
      setResumeData((prev) => ({ ...prev, projects: updated }));
      setAiInputText(bullets.join('\n'));
    } else if (section === 'skills') {
      const parsedSkills = Array.from(
        new Set(
          improved_text
            .split(/[\n,•]+/)
            .map((s) => s.replace(/^[-*]\s*/, '').replace(/\.$/, '').trim())
            .filter((s) => s && s.length <= 45)
        )
      );
      if (parsedSkills.length > 0) {
        setResumeData((prev) => ({ ...prev, skills: parsedSkills }));
        setAiInputText(parsedSkills.join(', '));
      }
    }

    setAiSuggestion(null);
    showToast('success', `Applied AI improvement to ${section.replace('_', ' ')}!`);
  };

  const handleGenerateCoverLetter = async (e) => {
    e.preventDefault();
    if (!clCompany.trim() || !clRole.trim()) {
      showToast('danger', 'Please enter both the target company and job title.');
      return;
    }
    setClLoading(true);
    try {
      const res = await resumeService.generateCoverLetter({
        candidate_name: resumeData.personal_info.full_name,
        target_role: clRole,
        company_name: clCompany,
        job_description: clJobDesc,
        resume_summary: resumeData.summary,
        skills: resumeData.skills,
        tone: clTone,
      });
      setClResult(res);
      showToast('success', 'Tailored cover letter generated!');
    } catch (err) {
      showToast('danger', err.response?.data?.detail || 'Failed to generate cover letter.');
    } finally {
      setClLoading(false);
    }
  };

  const handleExportCoverLetterDocx = async () => {
    if (!clResult?.cover_letter) return;
    try {
      await resumeService.exportCoverLetterDocx({
        candidate_name: resumeData.personal_info.full_name,
        personal_info: resumeData.personal_info,
        target_role: clRole,
        company_name: clCompany,
        subject_line: clResult.subject_line,
        cover_letter: clResult.cover_letter,
      });
      showToast('success', 'Cover letter DOCX downloaded!');
    } catch {
      showToast('danger', 'Failed to export cover letter as DOCX.');
    }
  };

  const handleDownloadCoverLetterPdf = () => {
    if (!clResult?.cover_letter) return;
    const printWin = window.open('', '_blank', 'width=850,height=950');
    if (!printWin) {
      showToast('danger', 'Please allow pop-ups in your browser to save as PDF.');
      return;
    }

    const p = resumeData.personal_info;
    const contactLine = [p.email, p.phone, p.location].filter(Boolean).join(' • ');
    const escapedBody = clResult.cover_letter
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .split('\n\n')
      .map((para) => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
      .join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cover Letter - ${clCompany}</title>
          <style>
            @page { size: A4; margin: 22mm; }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              color: #1e293b;
              line-height: 1.65;
              font-size: 11.5pt;
              margin: 0;
            }
            .header {
              border-bottom: 2px solid #4f46e5;
              padding-bottom: 12px;
              margin-bottom: 22px;
            }
            .name {
              font-size: 18pt;
              font-weight: 700;
              color: #0f172a;
              letter-spacing: 0.03em;
              margin: 0 0 4px 0;
            }
            .contact {
              font-size: 9.5pt;
              color: #64748b;
            }
            .subject {
              font-weight: 700;
              color: #312e81;
              margin-bottom: 18px;
            }
            p {
              margin: 0 0 14px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="name">${(p.full_name || 'CANDIDATE').toUpperCase()}</div>
            <div class="contact">${contactLine}</div>
          </div>
          <div class="subject">Subject: ${clResult.subject_line || `Application for ${clRole}`}</div>
          ${escapedBody}
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 250);
  };

  const handleExportDocx = async () => {
    try {
      await resumeService.exportDocx(resumeData);
      showToast('success', 'ATS-formatted DOCX downloaded!');
    } catch {
      try {
        let currentId = draftId || (await handleSaveDraft());
        const res = await api.get(`/resumes/builder/${currentId}/export-docx/`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${resumeData.title.replace(/\s+/g, '_')}.docx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showToast('success', 'ATS-formatted DOCX downloaded!');
      } catch {
        showToast('danger', 'DOCX export failed. Please save your draft first.');
      }
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
    setResumeData((prev) => {
      const updated = [...prev.skills, s];
      if (aiSection === 'skills') setAiInputText(updated.join(', '));
      return { ...prev, skills: updated };
    });
    setNewSkill('');
  };

  const addMissingJobSkill = (skill) => {
    if (!resumeData.skills.includes(skill)) {
      setResumeData((prev) => {
        const updated = [...prev.skills, skill];
        if (aiSection === 'skills') setAiInputText(updated.join(', '));
        return { ...prev, skills: updated };
      });
      showToast('success', `Added "${skill}" to your resume skills!`);
    }
  };

  const cardStyle = {
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  };

  const activeSectionLabel =
    SECTION_OPTIONS.find((s) => s.id === aiSection)?.label || 'Section';
  const activeActions = SECTION_AI_ACTIONS[aiSection] || SECTION_AI_ACTIONS.summary;

  if (loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="spinner-border" style={{ color: '#4F46E5' }} role="status"></div>
      </div>
    );
  }

  return (
    <div className="py-4" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Print-only CSS so Download PDF outputs only the clean A4 Resume */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #resume-a4-sheet, #resume-a4-sheet * { visibility: visible; }
          #resume-a4-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="container-fluid px-3 px-xl-4">
        {toast && (
          <div
            className={`alert alert-${toast.type} d-flex align-items-center justify-content-between rounded-4 shadow-sm mb-3`}
          >
            <span className="small fw-semibold">{toast.message}</span>
            <button type="button" className="btn-close btn-sm" onClick={() => setToast(null)}></button>
          </div>
        )}

        {/* Target Job Tailoring Banner (when navigated from Job Matching) */}
        {targetJob && (
          <div
            className="p-3 rounded-4 mb-3 d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3"
            style={{ backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE' }}
          >
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge text-white" style={{ backgroundColor: '#4F46E5' }}>
                  <i className="bi bi-bullseye me-1"></i> Tailoring Mode Active
                </span>
                <strong className="text-dark small">
                  {targetJob.title} at {targetJob.company}
                </strong>
              </div>
              {targetJob.missing_skills?.length > 0 && (
                <div className="d-flex flex-wrap align-items-center gap-1 mt-1">
                  <span className="text-muted" style={{ fontSize: '11.5px' }}>
                    Missing JD keywords (click to add):
                  </span>
                  {targetJob.missing_skills.map((skill, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => addMissingJobSkill(skill)}
                      className="btn btn-sm py-0 px-2 fw-semibold"
                      style={{
                        fontSize: '11px',
                        borderRadius: '999px',
                        backgroundColor: resumeData.skills.includes(skill) ? '#DCFCE7' : '#FFFFFF',
                        color: resumeData.skills.includes(skill) ? '#15803D' : '#4F46E5',
                        border: '1px solid #C7D2FE',
                      }}
                    >
                      {resumeData.skills.includes(skill) ? `✓ ${skill}` : `+ ${skill}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="d-flex gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveMode('cover-letter')}
                className="btn btn-sm text-white fw-semibold px-3"
                style={{ backgroundColor: '#7C3AED', borderRadius: '8px' }}
              >
                <i className="bi bi-envelope-paper me-1"></i> Generate Cover Letter
              </button>
              <button
                type="button"
                onClick={() => setTargetJob(null)}
                className="btn btn-sm bg-white text-muted"
                style={{ border: '1px solid #CBD5E1', borderRadius: '8px' }}
              >
                Clear
              </button>
            </div>
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
                3-Column AI Resume Studio • Section-by-Section AI Optimization
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Mode Switcher */}
            <div className="btn-group btn-group-sm me-2" role="group">
              <button
                type="button"
                onClick={() => setActiveMode('resume')}
                className="btn fw-semibold px-3 py-2"
                style={{
                  backgroundColor: activeMode === 'resume' ? '#4F46E5' : '#F8FAFC',
                  color: activeMode === 'resume' ? '#FFFFFF' : '#475569',
                  border: '1px solid #CBD5E1',
                }}
              >
                <i className="bi bi-file-earmark-text me-1"></i> Resume Studio
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('cover-letter')}
                className="btn fw-semibold px-3 py-2"
                style={{
                  backgroundColor: activeMode === 'cover-letter' ? '#4F46E5' : '#F8FAFC',
                  color: activeMode === 'cover-letter' ? '#FFFFFF' : '#475569',
                  border: '1px solid #CBD5E1',
                }}
              >
                <i className="bi bi-envelope-paper me-1"></i> AI Cover Letter
              </button>
            </div>

            {activeMode === 'resume' ? (
              <>
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
              </>
            ) : (
              clResult && (
                <>
                  <button
                    type="button"
                    onClick={handleExportCoverLetterDocx}
                    className="btn btn-sm fw-semibold px-3 py-2"
                    style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '10px' }}
                  >
                    <i className="bi bi-file-earmark-word me-1"></i> Export DOCX
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCoverLetterPdf}
                    className="btn btn-sm text-white fw-semibold px-3 py-2 shadow-sm"
                    style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
                  >
                    <i className="bi bi-file-earmark-pdf me-1"></i> Download PDF
                  </button>
                </>
              )
            )}
          </div>
        </div>

        {/* ============================================================
            MODE A: AI COVER LETTER GENERATOR
           ============================================================ */}
        {activeMode === 'cover-letter' ? (
          <div className="row g-4">
            <div className="col-lg-5">
              <form onSubmit={handleGenerateCoverLetter} className="card bg-white p-4" style={cardStyle}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="fw-bold text-dark mb-0">
                    <i className="bi bi-envelope-paper-heart me-2" style={{ color: '#4F46E5' }}></i>
                    AI Cover Letter Studio
                  </h5>
                  <span
                    className="badge rounded-pill px-2.5 py-1 fw-semibold"
                    style={{ backgroundColor: '#F5F3FF', color: '#7C3AED', fontSize: '11px' }}
                  >
                    Groq LLM
                  </span>
                </div>

                <div className="mb-3">
                  <label className="small fw-semibold text-dark mb-1">Target Company *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g., Zomato, Infosys, Razorpay"
                    value={clCompany}
                    onChange={(e) => setClCompany(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="small fw-semibold text-dark mb-1">Target Role Title *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g., Full Stack Software Engineer"
                    value={clRole}
                    onChange={(e) => setClRole(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="small fw-semibold text-dark mb-1">Writing Tone</label>
                  <select
                    className="form-select form-select-sm"
                    value={clTone}
                    onChange={(e) => setClTone(e.target.value)}
                  >
                    <option value="Professional & Confident">Professional &amp; Confident</option>
                    <option value="Enthusiastic Startup Fit">Enthusiastic Startup Fit</option>
                    <option value="Concise & Executive">Concise &amp; Executive</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="small fw-semibold text-dark mb-1">
                    Job Description (Optional — improves keyword tailoring)
                  </label>
                  <textarea
                    rows="5"
                    className="form-control form-control-sm"
                    placeholder="Paste the job requirements or responsibilities here..."
                    value={clJobDesc}
                    onChange={(e) => setClJobDesc(e.target.value)}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={clLoading}
                  className="btn text-white fw-semibold py-2 w-100"
                  style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
                >
                  {clLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Drafting Tailored Letter...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-stars me-1"></i> Generate Tailored Cover Letter
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="col-lg-7">
              <div className="card bg-white p-4 p-md-5 h-100" style={cardStyle}>
                {!clResult ? (
                  <div className="text-center my-auto py-5">
                    <div
                      className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                      style={{ width: '56px', height: '56px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                    >
                      <i className="bi bi-file-earmark-richtext fs-3"></i>
                    </div>
                    <h5 className="fw-bold text-dark">Your Tailored Cover Letter Appears Here</h5>
                    <p className="text-muted small mx-auto" style={{ maxWidth: '420px' }}>
                      CareerAI automatically pulls your resume summary and {resumeData.skills.length} skills to draft a custom 3-paragraph cover letter ready to export as PDF or DOCX.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-3 mb-3 border-bottom">
                      <div>
                        <span className="small text-muted d-block">Recommended Subject Line</span>
                        <strong className="text-dark small">{clResult.subject_line}</strong>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(clResult.cover_letter);
                            showToast('success', 'Cover letter copied to clipboard!');
                          }}
                          className="btn btn-sm fw-semibold px-3"
                          style={{ backgroundColor: '#F1F5F9', color: '#334155', borderRadius: '8px' }}
                        >
                          <i className="bi bi-clipboard me-1"></i> Copy
                        </button>
                        <button
                          type="button"
                          onClick={handleExportCoverLetterDocx}
                          className="btn btn-sm fw-semibold px-3"
                          style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '8px' }}
                        >
                          <i className="bi bi-file-earmark-word me-1"></i> DOCX
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadCoverLetterPdf}
                          className="btn btn-sm text-white fw-semibold px-3"
                          style={{ backgroundColor: '#4F46E5', borderRadius: '8px' }}
                        >
                          <i className="bi bi-file-earmark-pdf me-1"></i> PDF
                        </button>
                      </div>
                    </div>

                    {clResult.key_highlights?.length > 0 && (
                      <div className="d-flex flex-wrap align-items-center gap-1 mb-3">
                        <span className="small text-muted me-1">Highlighted Strengths:</span>
                        {clResult.key_highlights.map((h, i) => (
                          <span
                            key={i}
                            className="badge rounded-pill"
                            style={{ backgroundColor: '#ECFDF5', color: '#059669', fontSize: '11px' }}
                          >
                            ✓ {h}
                          </span>
                        ))}
                      </div>
                    )}

                    <textarea
                      rows="14"
                      className="form-control bg-light border-0 p-3 text-dark"
                      style={{ lineHeight: 1.7, fontSize: '13.5px', borderRadius: '12px' }}
                      value={clResult.cover_letter}
                      onChange={(e) => setClResult((prev) => ({ ...prev, cover_letter: e.target.value }))}
                    ></textarea>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================
             MODE B: 3-COLUMN RESUME STUDIO (SECTION-SPECIFIC AI ACTIONS)
             ============================================================ */
          <div className="row g-4">
            {/* Column 1 (4 cols): Structured Section Editors */}
            <div className="col-xl-4">
              <div className="d-flex flex-column gap-3">
                {/* Optional Pre-Fill from Uploaded Resume */}
                {uploadedResumes.length > 0 && (
                  <div className="card bg-white p-3" style={cardStyle}>
                    <label className="small fw-semibold text-muted mb-1">
                      <i className="bi bi-file-earmark-arrow-up me-1 text-primary"></i>
                      Pre-fill Contact &amp; Skills from Uploaded Resume
                    </label>
                    <div className="d-flex gap-2">
                      <select
                        className="form-select form-select-sm"
                        value={selectedSourceId}
                        onChange={handleSourceResumeChange}
                      >
                        {uploadedResumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.file_name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleImportFromUploadedResume}
                        className="btn btn-sm fw-semibold flex-shrink-0"
                        style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                      >
                        Import
                      </button>
                    </div>
                  </div>
                )}

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
                <div
                  className="card bg-white p-4"
                  style={{
                    ...cardStyle,
                    borderColor: aiSection === 'summary' ? '#818CF8' : '#E2E8F0',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold text-dark mb-0">
                      <i className="bi bi-card-text me-2" style={{ color: '#4F46E5' }}></i>
                      Professional Summary
                    </h6>
                    <button
                      type="button"
                      className="btn btn-sm py-0 px-2 fw-semibold"
                      style={{
                        backgroundColor: aiSection === 'summary' ? '#4F46E5' : '#EEF2FF',
                        color: aiSection === 'summary' ? '#FFFFFF' : '#4F46E5',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                      }}
                      onClick={() => selectSectionForAi('summary', 0)}
                    >
                      {aiSection === 'summary' ? 'Selected for AI' : 'Send to AI →'}
                    </button>
                  </div>
                  <textarea
                    rows="3"
                    className="form-control form-control-sm"
                    value={resumeData.summary}
                    onChange={(e) => setResumeData((prev) => ({ ...prev, summary: e.target.value }))}
                  ></textarea>
                </div>

                {/* Technical Skills */}
                <div
                  className="card bg-white p-4"
                  style={{
                    ...cardStyle,
                    borderColor: aiSection === 'skills' ? '#818CF8' : '#E2E8F0',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold text-dark mb-0">
                      <i className="bi bi-tools me-2" style={{ color: '#4F46E5' }}></i>
                      Technical Skills
                    </h6>
                    <button
                      type="button"
                      className="btn btn-sm py-0 px-2 fw-semibold"
                      style={{
                        backgroundColor: aiSection === 'skills' ? '#4F46E5' : '#EEF2FF',
                        color: aiSection === 'skills' ? '#FFFFFF' : '#4F46E5',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                      }}
                      onClick={() => selectSectionForAi('skills', 0)}
                    >
                      {aiSection === 'skills' ? 'Selected for AI' : 'Send to AI →'}
                    </button>
                  </div>
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
                            setResumeData((prev) => {
                              const updated = prev.skills.filter((s) => s !== skill);
                              if (aiSection === 'skills') setAiInputText(updated.join(', '));
                              return { ...prev, skills: updated };
                            })
                          }
                        ></i>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Work Experience Editor */}
                <div
                  className="card bg-white p-4"
                  style={{
                    ...cardStyle,
                    borderColor: aiSection === 'work_experience' ? '#818CF8' : '#E2E8F0',
                  }}
                >
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
                            {
                              role: 'Role Title',
                              company: 'Company Name',
                              duration: '2025 – Present',
                              bullets: ['Delivered key project outcomes.'],
                            },
                          ],
                        }))
                      }
                    >
                      + Add Role
                    </button>
                  </div>

                  {resumeData.work_experience.map((exp, idx) => {
                    const isSelected = aiSection === 'work_experience' && selectedItemIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-3 mb-2"
                        style={{
                          backgroundColor: isSelected ? '#F5F7FF' : '#F8FAFC',
                          border: isSelected ? '1px solid #818CF8' : '1px solid #E2E8F0',
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="small fw-semibold text-muted">Role #{idx + 1}</span>
                          <button
                            type="button"
                            className="btn btn-sm py-0 px-2 fw-semibold"
                            style={{
                              backgroundColor: isSelected ? '#4F46E5' : '#EEF2FF',
                              color: isSelected ? '#FFFFFF' : '#4F46E5',
                              borderRadius: '6px',
                              fontSize: '11px',
                            }}
                            onClick={() => selectSectionForAi('work_experience', idx)}
                          >
                            {isSelected ? 'Selected for AI' : 'Send to AI →'}
                          </button>
                        </div>
                        <div className="row g-1 mb-2">
                          <div className="col-5">
                            <input
                              type="text"
                              className="form-control form-control-sm fw-semibold"
                              placeholder="Job Title"
                              value={exp.role}
                              onChange={(e) => {
                                const updated = [...resumeData.work_experience];
                                updated[idx].role = e.target.value;
                                setResumeData((prev) => ({ ...prev, work_experience: updated }));
                              }}
                            />
                          </div>
                          <div className="col-4">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Company"
                              value={exp.company}
                              onChange={(e) => {
                                const updated = [...resumeData.work_experience];
                                updated[idx].company = e.target.value;
                                setResumeData((prev) => ({ ...prev, work_experience: updated }));
                              }}
                            />
                          </div>
                          <div className="col-3">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Duration"
                              value={exp.duration}
                              onChange={(e) => {
                                const updated = [...resumeData.work_experience];
                                updated[idx].duration = e.target.value;
                                setResumeData((prev) => ({ ...prev, work_experience: updated }));
                              }}
                            />
                          </div>
                        </div>
                        <textarea
                          rows="3"
                          className="form-control form-control-sm"
                          placeholder="One achievement bullet per line..."
                          value={(exp.bullets || []).join('\n')}
                          onChange={(e) => {
                            const updated = [...resumeData.work_experience];
                            updated[idx].bullets = e.target.value.split('\n');
                            setResumeData((prev) => ({ ...prev, work_experience: updated }));
                          }}
                        ></textarea>
                      </div>
                    );
                  })}
                </div>

                {/* Key Projects Editor */}
                <div
                  className="card bg-white p-4"
                  style={{
                    ...cardStyle,
                    borderColor: aiSection === 'projects' ? '#818CF8' : '#E2E8F0',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold text-dark mb-0">
                      <i className="bi bi-code-square me-2" style={{ color: '#4F46E5' }}></i>
                      Key Projects
                    </h6>
                    <button
                      type="button"
                      className="btn btn-sm fw-semibold py-0 px-2"
                      style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '12px' }}
                      onClick={() =>
                        setResumeData((prev) => ({
                          ...prev,
                          projects: [
                            ...prev.projects,
                            {
                              title: 'Project Title',
                              link: 'github.com/username/project',
                              bullets: ['Built scalable application module using React and Django.'],
                            },
                          ],
                        }))
                      }
                    >
                      + Add Project
                    </button>
                  </div>

                  {resumeData.projects.map((proj, idx) => {
                    const isSelected = aiSection === 'projects' && selectedItemIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-3 mb-2"
                        style={{
                          backgroundColor: isSelected ? '#F5F7FF' : '#F8FAFC',
                          border: isSelected ? '1px solid #818CF8' : '1px solid #E2E8F0',
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="small fw-semibold text-muted">Project #{idx + 1}</span>
                          <button
                            type="button"
                            className="btn btn-sm py-0 px-2 fw-semibold"
                            style={{
                              backgroundColor: isSelected ? '#4F46E5' : '#EEF2FF',
                              color: isSelected ? '#FFFFFF' : '#4F46E5',
                              borderRadius: '6px',
                              fontSize: '11px',
                            }}
                            onClick={() => selectSectionForAi('projects', idx)}
                          >
                            {isSelected ? 'Selected for AI' : 'Send to AI →'}
                          </button>
                        </div>
                        <div className="row g-1 mb-2">
                          <div className="col-7">
                            <input
                              type="text"
                              className="form-control form-control-sm fw-semibold"
                              placeholder="Project Name"
                              value={proj.title}
                              onChange={(e) => {
                                const updated = [...resumeData.projects];
                                updated[idx].title = e.target.value;
                                setResumeData((prev) => ({ ...prev, projects: updated }));
                              }}
                            />
                          </div>
                          <div className="col-5">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="GitHub / Live URL"
                              value={proj.link}
                              onChange={(e) => {
                                const updated = [...resumeData.projects];
                                updated[idx].link = e.target.value;
                                setResumeData((prev) => ({ ...prev, projects: updated }));
                              }}
                            />
                          </div>
                        </div>
                        <textarea
                          rows="2"
                          className="form-control form-control-sm"
                          placeholder="One project bullet per line..."
                          value={(proj.bullets || []).join('\n')}
                          onChange={(e) => {
                            const updated = [...resumeData.projects];
                            updated[idx].bullets = e.target.value.split('\n');
                            setResumeData((prev) => ({ ...prev, projects: updated }));
                          }}
                        ></textarea>
                      </div>
                    );
                  })}
                </div>

                {/* Education Editor */}
                <div className="card bg-white p-4" style={cardStyle}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold text-dark mb-0">
                      <i className="bi bi-mortarboard me-2" style={{ color: '#4F46E5' }}></i>
                      Education
                    </h6>
                    <button
                      type="button"
                      className="btn btn-sm fw-semibold py-0 px-2"
                      style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '12px' }}
                      onClick={() =>
                        setResumeData((prev) => ({
                          ...prev,
                          education: [
                            ...prev.education,
                            { degree: 'Degree / Certification', institution: 'University Name', year: '2024' },
                          ],
                        }))
                      }
                    >
                      + Add
                    </button>
                  </div>
                  {resumeData.education.map((edu, idx) => (
                    <div key={idx} className="row g-1 mb-2">
                      <div className="col-12">
                        <input
                          type="text"
                          className="form-control form-control-sm fw-semibold"
                          placeholder="Degree"
                          value={edu.degree}
                          onChange={(e) => {
                            const updated = [...resumeData.education];
                            updated[idx].degree = e.target.value;
                            setResumeData((prev) => ({ ...prev, education: updated }));
                          }}
                        />
                      </div>
                      <div className="col-8">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="University / Institute"
                          value={edu.institution}
                          onChange={(e) => {
                            const updated = [...resumeData.education];
                            updated[idx].institution = e.target.value;
                            setResumeData((prev) => ({ ...prev, education: updated }));
                          }}
                        />
                      </div>
                      <div className="col-4">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Year"
                          value={edu.year || edu.graduation_date || ''}
                          onChange={(e) => {
                            const updated = [...resumeData.education];
                            updated[idx].year = e.target.value;
                            setResumeData((prev) => ({ ...prev, education: updated }));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2 (3 cols): Section-Specific AI Assistant */}
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

                {/* Candidate Section Picker Grid */}
                <label className="small fw-semibold text-muted mb-2">
                  Choose Which Section to Improve
                </label>
                <div className="row g-2 mb-3">
                  {SECTION_OPTIONS.map((sec) => {
                    const isActive = aiSection === sec.id;
                    return (
                      <div className="col-6" key={sec.id}>
                        <button
                          type="button"
                          onClick={() => selectSectionForAi(sec.id, 0)}
                          className="btn btn-sm w-100 py-2 px-2 fw-semibold d-flex align-items-center justify-content-center gap-1"
                          style={{
                            borderRadius: '10px',
                            fontSize: '12px',
                            backgroundColor: isActive ? '#4F46E5' : '#F8FAFC',
                            color: isActive ? '#FFFFFF' : '#334155',
                            border: isActive ? '1px solid #4F46E5' : '1px solid #E2E8F0',
                          }}
                        >
                          <i className={`bi ${sec.icon}`}></i>
                          <span>{sec.label}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Sub-item selector if multiple roles or projects exist */}
                {aiSection === 'work_experience' && resumeData.work_experience.length > 1 && (
                  <div className="mb-2">
                    <label className="small fw-semibold text-muted mb-1">Select Work Role</label>
                    <select
                      className="form-select form-select-sm"
                      value={selectedItemIndex}
                      onChange={(e) => selectSectionForAi('work_experience', Number(e.target.value))}
                    >
                      {resumeData.work_experience.map((exp, idx) => (
                        <option key={idx} value={idx}>
                          Role #{idx + 1}: {exp.role} ({exp.company})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {aiSection === 'projects' && resumeData.projects.length > 1 && (
                  <div className="mb-2">
                    <label className="small fw-semibold text-muted mb-1">Select Project</label>
                    <select
                      className="form-select form-select-sm"
                      value={selectedItemIndex}
                      onChange={(e) => selectSectionForAi('projects', Number(e.target.value))}
                    >
                      {resumeData.projects.map((proj, idx) => (
                        <option key={idx} value={idx}>
                          Project #{idx + 1}: {proj.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Text Box for Chosen Section */}
                <label className="small fw-semibold text-muted mb-1">
                  {activeSectionLabel} Content to Improve
                </label>
                <textarea
                  rows="4"
                  className="form-control form-control-sm mb-2"
                  placeholder={
                    aiSection === 'skills'
                      ? 'Comma-separated skills (e.g., Python, Django, React, SQL)...'
                      : `Edit or paste your ${activeSectionLabel.toLowerCase()} text here...`
                  }
                  value={aiInputText}
                  onChange={(e) => setAiInputText(e.target.value)}
                ></textarea>

                {/* Custom Prompt Input */}
                <div className="input-group input-group-sm mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder={
                      aiSection === 'skills'
                        ? 'e.g., Add AWS and Docker skills...'
                        : `Custom instruction for ${activeSectionLabel}...`
                    }
                    value={customAiPrompt}
                    onChange={(e) => setCustomAiPrompt(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={aiLoading || !customAiPrompt.trim()}
                    onClick={() => handleRunAiImprove(customAiPrompt)}
                    className="btn text-white"
                    style={{ backgroundColor: '#4F46E5' }}
                    title="Run custom AI instruction"
                  >
                    <i className="bi bi-send"></i>
                  </button>
                </div>

                {/* Section-Specific Quick Actions */}
                <div className="small fw-semibold text-muted mb-2">
                  Improve {activeSectionLabel} with AI
                </div>
                <div className="d-flex flex-column gap-2 mb-3">
                  {activeActions.map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      disabled={aiLoading}
                      onClick={() => handleRunAiImprove(act.prompt)}
                      className="btn text-start p-2 rounded-3 d-flex align-items-center justify-content-between hover-card"
                      style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="d-inline-flex align-items-center justify-content-center rounded-2"
                          style={{ width: '28px', height: '28px', backgroundColor: '#EEF2FF', color: '#4F46E5' }}
                        >
                          <i className={`bi ${act.icon}`}></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark" style={{ fontSize: '12px' }}>
                            {act.label}
                          </div>
                          <div className="text-muted" style={{ fontSize: '10.5px' }}>
                            {act.desc}
                          </div>
                        </div>
                      </div>
                      <i className="bi bi-chevron-right text-muted small"></i>
                    </button>
                  ))}
                </div>

                {aiLoading && (
                  <div className="text-center py-2">
                    <div className="spinner-border spinner-border-sm" style={{ color: '#4F46E5' }}></div>
                    <div className="small text-muted mt-1">
                      Improving {activeSectionLabel.toLowerCase()}...
                    </div>
                  </div>
                )}

                {/* Section Diff Preview */}
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

                    <div className="small fw-semibold text-success mb-1">
                      Improved {aiSuggestion.section.replace('_', ' ')}:
                    </div>
                    <p
                      className="small text-dark bg-white p-2 rounded-2 border mb-2"
                      style={{ lineHeight: 1.5, whiteSpace: 'pre-line' }}
                    >
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
                        Apply to {activeSectionLabel}
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
                id="resume-a4-sheet"
                className="bg-white p-4 p-md-5 rounded-4 shadow-sm"
                style={{
                  border: '1px solid #CBD5E1',
                  minHeight: '780px',
                  fontFamily: "'Inter', Georgia, serif",
                }}
              >
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
                          {(proj.bullets || [])
                            .filter((b) => b.trim())
                            .map((b, bIdx) => (
                              <li key={bIdx}>{b}</li>
                            ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

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
                          {edu.year || edu.graduation_date}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeBuilder;