import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobService } from '../../services/jobService';
import { resumeService } from '../../services/resumeService';

const QUICK_ROUTES = [
  { title: 'Candidate Dashboard', subtitle: 'Readiness KPIs & activity analytics', path: '/dashboard', icon: 'bi-speedometer2', category: 'Navigation' },
  { title: 'My Resumes & Parser', subtitle: 'Upload PDF/DOCX & inspect extracted fields', path: '/resumes', icon: 'bi-file-earmark-text', category: 'Navigation' },
  { title: 'ATS Resume Analyzer', subtitle: 'Check ATS compatibility score & recommendations', path: '/resume-analyzer', icon: 'bi-graph-up-arrow', category: 'Navigation' },
  { title: 'AI Resume Builder & Cover Letter', subtitle: '3-column Groq rewrite studio & DOCX export', path: '/resume-builder', icon: 'bi-magic', category: 'Navigation' },
  { title: 'Smart Job Matching', subtitle: 'Weighted skill & experience compatibility scores', path: '/job-matching', icon: 'bi-bullseye', category: 'Navigation' },
  { title: 'Job Explorer & JD Importer', subtitle: 'Browse roles or paste external job descriptions', path: '/jobs', icon: 'bi-briefcase', category: 'Navigation' },
  { title: 'Application Tracker (Kanban)', subtitle: 'Track Saved, Applied, Interview & Offer stages', path: '/applications', icon: 'bi-kanban', category: 'Navigation' },
  { title: 'AI Mock Interview Simulator', subtitle: 'Practice Technical, HR & Behavioral STAR sessions', path: '/mock-interview', icon: 'bi-mic', category: 'Navigation' },
  { title: 'Interview Question Bank', subtitle: 'Curated questions with model answers & bookmarks', path: '/interview-prep', icon: 'bi-journal-code', category: 'Navigation' },
  { title: 'Candidate Profile & Auto-Fill', subtitle: 'Groq resume-to-profile auto-fill & photo settings', path: '/profile', icon: 'bi-person-circle', category: 'Navigation' },
];

const GlobalSearchModal = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dynamicItems, setDynamicItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load jobs & resumes when opened
  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 40);

    const token = localStorage.getItem('access_token');
    if (!token) return;

    Promise.allSettled([jobService.getJobs(), resumeService.getResumes()]).then(([jobsRes, resumesRes]) => {
      const items = [];
      if (jobsRes.status === 'fulfilled') {
        const jobs = Array.isArray(jobsRes.value) ? jobsRes.value : jobsRes.value?.results || [];
        jobs.slice(0, 15).forEach((j) => {
          items.push({
            title: `${j.title} — ${j.company}`,
            subtitle: `${j.location || 'Remote'} • ${j.experience_level || 'Role'}`,
            path: `/job-matching?jobId=${j.id}`,
            icon: 'bi-building',
            category: 'Job Postings',
          });
        });
      }
      if (resumesRes.status === 'fulfilled') {
        const resumes = Array.isArray(resumesRes.value) ? resumesRes.value : resumesRes.value?.results || [];
        resumes.forEach((r) => {
          items.push({
            title: r.file_name || r.filename || `Resume #${r.id}`,
            subtitle: r.is_primary ? 'Primary Uploaded Resume' : 'Uploaded Resume',
            path: '/resumes',
            icon: 'bi-file-earmark-pdf',
            category: 'My Resumes',
          });
        });
      }
      setDynamicItems(items);
    });
  }, [isOpen]);

  const allItems = [...QUICK_ROUTES, ...dynamicItems];
  const filtered = allItems.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleSelect = (item) => {
    setIsOpen(false);
    navigate(item.path);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      onClick={() => setIsOpen(false)}
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content border-0 shadow-lg overflow-hidden"
          style={{ borderRadius: '18px' }}
        >
          {/* Search Input Header */}
          <div className="d-flex align-items-center px-4 py-3 border-bottom bg-white">
            <i className="bi bi-search fs-5 me-3" style={{ color: '#4F46E5' }}></i>
            <input
              ref={inputRef}
              type="text"
              className="form-control border-0 shadow-none p-0 fs-6"
              placeholder="Jump to any module, job posting, or resume..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
            />
            <span className="badge bg-light text-muted border ms-2">ESC</span>
          </div>

          {/* Results List */}
          <div className="bg-white p-2" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div className="text-center py-5 text-muted small">
                No matching pages, jobs, or resumes found for "{query}".
              </div>
            ) : (
              filtered.map((item, idx) => {
                const active = idx === selectedIndex;
                return (
                  <button
                    key={`${item.category}-${item.title}-${idx}`}
                    type="button"
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => handleSelect(item)}
                    className="w-100 btn text-start d-flex align-items-center justify-content-between px-3 py-2.5 rounded-3 mb-1"
                    style={{
                      backgroundColor: active ? '#EEF2FF' : 'transparent',
                      border: 'none',
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                        style={{
                          width: '36px',
                          height: '36px',
                          backgroundColor: active ? '#4F46E5' : '#F1F5F9',
                          color: active ? '#FFFFFF' : '#475569',
                        }}
                      >
                        <i className={`bi ${item.icon}`}></i>
                      </div>
                      <div>
                        <div className="fw-semibold text-dark" style={{ fontSize: '13.5px' }}>
                          {item.title}
                        </div>
                        <div className="text-muted" style={{ fontSize: '11.5px' }}>
                          {item.subtitle}
                        </div>
                      </div>
                    </div>
                    <span
                      className="badge rounded-pill"
                      style={{
                        backgroundColor: active ? '#FFFFFF' : '#F8FAFC',
                        color: '#4F46E5',
                        border: '1px solid #E2E8F0',
                        fontSize: '10.5px',
                      }}
                    >
                      {item.category}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Hints */}
          <div
            className="px-4 py-2 border-top d-flex justify-content-between align-items-center text-muted"
            style={{ backgroundColor: '#F8FAFC', fontSize: '11.5px' }}
          >
            <span>
              <kbd className="bg-white text-dark border">↑</kbd>{' '}
              <kbd className="bg-white text-dark border">↓</kbd> to navigate •{' '}
              <kbd className="bg-white text-dark border">Enter</kbd> to open
            </span>
            <span>CareerAI Quick Search</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;