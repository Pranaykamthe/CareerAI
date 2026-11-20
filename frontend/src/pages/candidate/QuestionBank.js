import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const CATEGORIES = ['All', 'Technical', 'HR', 'Behavioral', 'Project-based'];
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Filters & UI state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [expandedIds, setExpandedIds] = useState({});

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchQuestionsAndBookmarks = async () => {
    setLoading(true);
    try {
      const [qRes, bRes] = await Promise.allSettled([
        api.get('/interviews/questions/'),
        api.get('/interviews/bookmarks/'),
      ]);

      if (qRes.status === 'fulfilled') {
        const qList = Array.isArray(qRes.value.data)
          ? qRes.value.data
          : qRes.value.data?.results || [];
        setQuestions(qList);
      }

      if (bRes.status === 'fulfilled') {
        const bList = Array.isArray(bRes.value.data)
          ? bRes.value.data
          : bRes.value.data?.results || [];
        const ids = new Set(
          bList.map((b) => b.question?.id || b.question_id || b.id)
        );
        setBookmarkedIds(ids);
      }
    } catch (err) {
      showToast('danger', 'Unable to load interview questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionsAndBookmarks();
  }, []);

  const handleToggleBookmark = async (questionId) => {
    try {
      await api.post(`/interviews/questions/${questionId}/bookmark/`);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (next.has(questionId)) {
          next.delete(questionId);
          showToast('info', 'Removed from saved questions.');
        } else {
          next.add(questionId);
          showToast('success', 'Question bookmarked for revision!');
        }
        return next;
      });
    } catch (err) {
      showToast('danger', 'Could not update bookmark.');
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesCat =
      selectedCategory === 'All' ||
      (q.category || '').toLowerCase() === selectedCategory.toLowerCase();
    const matchesDiff =
      selectedDifficulty === 'All' ||
      (q.difficulty || '').toLowerCase() === selectedDifficulty.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      (q.question_text || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBookmark = !onlyBookmarked || bookmarkedIds.has(q.id);

    return matchesCat && matchesDiff && matchesSearch && matchesBookmark;
  });

  const getCategoryStyle = (cat) => {
    const c = (cat || '').toLowerCase();
    if (c === 'technical') return { bg: '#EEF2FF', color: '#4F46E5' };
    if (c === 'behavioral') return { bg: '#ECFDF5', color: '#059669' };
    if (c === 'hr') return { bg: '#EFF6FF', color: '#2563EB' };
    return { bg: '#FFFBEB', color: '#D97706' };
  };

  const getDifficultyStyle = (diff) => {
    const d = (diff || '').toLowerCase();
    if (d === 'easy') return { bg: '#ECFDF5', color: '#059669' };
    if (d === 'hard') return { bg: '#FEF2F2', color: '#DC2626' };
    return { bg: '#FFFBEB', color: '#D97706' };
  };

  const cardStyle = {
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
  };

  return (
    <div className="py-4" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="container">
        {toast && (
          <div
            className={`alert alert-${toast.type === 'info' ? 'primary' : toast.type} d-flex align-items-center justify-content-between rounded-4 shadow-sm mb-4`}
          >
            <span className="small fw-semibold">{toast.message}</span>
            <button type="button" className="btn-close btn-sm" onClick={() => setToast(null)}></button>
          </div>
        )}

        {/* Top Header */}
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <span
              className="badge rounded-pill px-3 py-1 fw-semibold mb-1"
              style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '11.5px' }}
            >
              <i className="bi bi-journal-code me-1"></i> Curated Knowledge Base
            </span>
            <h2 className="fw-bold mb-1" style={{ color: '#0F172A', letterSpacing: '-0.02em' }}>
              Interview Question Bank
            </h2>
            <p className="text-muted small mb-0">
              Explore categorized Technical, HR, Behavioral (STAR), and Project questions with ideal talking points.
            </p>
          </div>

          <div className="d-flex gap-2">
            <Link
              to="/interview-prep"
              className="btn btn-sm bg-white fw-semibold px-3 py-2"
              style={{ border: '1px solid #CBD5E1', color: '#334155', borderRadius: '10px' }}
            >
              <i className="bi bi-compass me-1 text-primary"></i> Prep Hub
            </Link>
            <Link
              to="/mock-interview"
              className="btn btn-sm text-white fw-semibold px-3 py-2 shadow-sm"
              style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
            >
              <i className="bi bi-mic-fill me-1"></i> Start Mock Interview
            </Link>
          </div>
        </div>

        {/* Category Tabs + Search & Filter Card */}
        <div className="card bg-white p-3 p-md-4 mb-4" style={cardStyle}>
          {/* Category Pill Tabs */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-3 mb-3 border-bottom">
            <div className="d-flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className="btn btn-sm fw-semibold px-3 py-1.5"
                    style={{
                      borderRadius: '10px',
                      backgroundColor: active ? '#4F46E5' : '#F8FAFC',
                      color: active ? '#FFFFFF' : '#475569',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setOnlyBookmarked(!onlyBookmarked)}
              className="btn btn-sm fw-semibold px-3 py-1.5"
              style={{
                borderRadius: '10px',
                backgroundColor: onlyBookmarked ? '#FFFBEB' : '#F8FAFC',
                color: onlyBookmarked ? '#D97706' : '#475569',
                border: `1px solid ${onlyBookmarked ? '#FDE68A' : '#E2E8F0'}`,
              }}
            >
              <i className={`bi ${onlyBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'} me-1`}></i>
              Saved ({bookmarkedIds.size})
            </button>
          </div>

          {/* Search & Difficulty Controls */}
          <div className="row g-3 align-items-center">
            <div className="col-md-7">
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
                  placeholder="Search questions by keyword or concept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-5 d-flex flex-wrap align-items-center justify-content-md-end gap-1">
              <span className="small text-muted me-1">Difficulty:</span>
              {DIFFICULTIES.map((diff) => {
                const active = selectedDifficulty === diff;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff)}
                    className="btn btn-sm fw-semibold px-2.5 py-1"
                    style={{
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      backgroundColor: active ? '#0F172A' : '#F8FAFC',
                      color: active ? '#FFFFFF' : '#475569',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    {diff}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: '#4F46E5' }} role="status"></div>
            <div className="text-muted small mt-2">Loading curated interview questions...</div>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="card bg-white p-5 text-center" style={cardStyle}>
            <i className="bi bi-journal-x fs-1 text-muted"></i>
            <h5 className="fw-bold text-dark mt-3">No Questions Match Your Filters</h5>
            <p className="text-muted small mb-3">
              Reset your category, difficulty, or bookmark filters to view all available prompts.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSelectedDifficulty('All');
                setSearchQuery('');
                setOnlyBookmarked(false);
              }}
              className="btn btn-sm text-white fw-semibold px-4 mx-auto"
              style={{ backgroundColor: '#4F46E5', borderRadius: '10px' }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredQuestions.map((q) => {
              const isSaved = bookmarkedIds.has(q.id);
              const isExpanded = Boolean(expandedIds[q.id]);
              const catStyle = getCategoryStyle(q.category);
              const diffStyle = getDifficultyStyle(q.difficulty);
              const points = Array.isArray(q.ideal_points)
                ? q.ideal_points
                : typeof q.ideal_points === 'string' && q.ideal_points.trim()
                ? q.ideal_points.split('\n').filter(Boolean)
                : [];

              return (
                <div key={q.id} className="card bg-white p-4 hover-card" style={cardStyle}>
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div>
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                        <span
                          className="badge rounded-pill px-3 py-1 fw-semibold"
                          style={{ backgroundColor: catStyle.bg, color: catStyle.color, fontSize: '11.5px' }}
                        >
                          {q.category || 'Technical'}
                        </span>
                        <span
                          className="badge rounded-pill px-2.5 py-1 fw-semibold"
                          style={{ backgroundColor: diffStyle.bg, color: diffStyle.color, fontSize: '11px' }}
                        >
                          {q.difficulty || 'Medium'}
                        </span>
                      </div>

                      <h6 className="fw-bold text-dark mb-0" style={{ lineHeight: 1.5, fontSize: '15.5px' }}>
                        {q.question_text}
                      </h6>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleBookmark(q.id)}
                      className="btn btn-sm flex-shrink-0"
                      style={{
                        backgroundColor: isSaved ? '#FFFBEB' : '#F8FAFC',
                        color: isSaved ? '#D97706' : '#64748B',
                        border: `1px solid ${isSaved ? '#FDE68A' : '#E2E8F0'}`,
                        borderRadius: '10px',
                      }}
                      title={isSaved ? 'Remove bookmark' : 'Bookmark question'}
                    >
                      <i className={`bi ${isSaved ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
                    </button>
                  </div>

                  {/* Expandable Ideal Talking Points */}
                  {isExpanded && (
                    <div
                      className="mt-3 p-3 rounded-4"
                      style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                    >
                      <div className="small fw-bold text-dark mb-2">
                        <i className="bi bi-lightbulb-fill me-2" style={{ color: '#4F46E5' }}></i>
                        Ideal Answer Key Points &amp; Rubric
                      </div>
                      {points.length > 0 ? (
                        <ul className="mb-0 ps-3 small text-muted" style={{ lineHeight: 1.6 }}>
                          {points.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="small text-muted mb-0">
                          Structure your response clearly: define the core concept, walk through a concrete project example, and highlight measurable outcomes.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="pt-3 mt-3 border-top d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpand(q.id)}
                      className="btn btn-sm fw-semibold px-3"
                      style={{ backgroundColor: '#F1F5F9', color: '#334155', borderRadius: '8px' }}
                    >
                      <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>
                      {isExpanded ? 'Hide Key Points' : 'View Key Points'}
                    </button>

                    <Link
                      to="/mock-interview"
                      state={{ category: q.category || 'Technical' }}
                      className="btn btn-sm fw-semibold px-3"
                      style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', borderRadius: '8px' }}
                    >
                      Practice {q.category || 'Technical'} Round <i className="bi bi-arrow-right ms-1"></i>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBank;