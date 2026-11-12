import React, { useState, useEffect, useCallback } from 'react';
import { interviewService } from '../../services/interviewService';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & State
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeDifficulty, setActiveDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [stats, setStats] = useState({ total: 0, bookmarks: 0 });

  const categories = ['All', 'Technical', 'HR', 'Behavioral', 'Project-based'];
  const difficulties = ['All', 'Easy', 'Medium', 'Hard'];

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (activeCategory !== 'All') params.category = activeCategory;
      if (activeDifficulty !== 'All') params.difficulty = activeDifficulty;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (bookmarkedOnly) params.bookmarked_only = true;

      const data = await interviewService.getQuestions(params);
      setQuestions(data.questions || []);
      setStats({
        total: data.total_in_system || 0,
        bookmarks: data.user_bookmarks_count || 0,
      });
    } catch (err) {
      console.error('Failed to load questions:', err);
      setError('Failed to load interview questions. Please ensure your backend server is running.');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeDifficulty, searchQuery, bookmarkedOnly]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleToggleBookmark = async (id) => {
    try {
      const res = await interviewService.toggleBookmark(id);
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, is_bookmarked: res.is_bookmarked } : q))
      );
      setStats((prev) => ({
        ...prev,
        bookmarks: res.is_bookmarked ? prev.bookmarks + 1 : Math.max(0, prev.bookmarks - 1),
      }));
    } catch (err) {
      alert('Unable to update bookmark status.');
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Easy</span>;
      case 'Medium':
        return <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">Medium</span>;
      case 'Hard':
        return <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">Hard</span>;
      default:
        return <span className="badge bg-secondary px-2 py-1">{difficulty}</span>;
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Technical':
        return <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1"><i className="bi bi-code-slash me-1"></i>Technical</span>;
      case 'HR':
        return <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle px-2 py-1"><i className="bi bi-people me-1"></i>HR & Culture</span>;
      case 'Behavioral':
        return <span className="badge bg-purple-subtle text-purple border border-purple px-2 py-1" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}><i className="bi bi-star me-1"></i>Behavioral (STAR)</span>;
      case 'Project-based':
        return <span className="badge bg-secondary-subtle text-dark border border-secondary-subtle px-2 py-1"><i className="bi bi-diagram-3 me-1"></i>Project Architecture</span>;
      default:
        return <span className="badge bg-light text-dark px-2 py-1">{category}</span>;
    }
  };

  return (
    <div className="min-vh-100 bg-light">

      <div className="container py-4">
        {/* Header Block */}
        <div className="row align-items-center mb-4 g-3">
          <div className="col-md-7">
            <h3 className="fw-bold text-dark mb-1 d-flex align-items-center">
              <i className="bi bi-collection-play-fill text-primary me-2"></i>
              Interview Question Bank
            </h3>
            <p className="text-muted small mb-0">
              Curated technical, HR, behavioral, and project architecture questions with model answers.
            </p>
          </div>
          <div className="col-md-5 text-md-end d-flex align-items-center justify-content-md-end gap-2">
            <div className="p-2 px-3 bg-white border rounded shadow-sm d-inline-flex align-items-center">
              <i className="bi bi-bookmark-fill text-warning me-2 fs-5"></i>
              <div className="text-start">
                <div className="small fw-bold text-dark">{stats.bookmarks} Saved</div>
                <div className="text-muted" style={{ fontSize: '11px' }}>of {stats.total} total</div>
              </div>
            </div>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={fetchQuestions}
              title="Refresh Question Catalog"
            >
              <i className="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-body p-3">
            <div className="row g-3 align-items-center">
              {/* Search Bar */}
              <div className="col-12 col-md-5">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control bg-light border-start-0"
                    placeholder="Search keywords or roles (e.g., Python, N+1, STAR)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="btn btn-light border"
                      type="button"
                      onClick={() => setSearchQuery('')}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Difficulty Dropdown */}
              <div className="col-6 col-md-3">
                <select
                  className="form-select bg-light"
                  value={activeDifficulty}
                  onChange={(e) => setActiveDifficulty(e.target.value)}
                >
                  {difficulties.map((d) => (
                    <option key={d} value={d}>
                      Difficulty: {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bookmarked Filter Toggle */}
              <div className="col-6 col-md-4 text-end">
                <button
                  type="button"
                  className={`btn w-100 ${
                    bookmarkedOnly ? 'btn-warning' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
                >
                  <i className={`bi ${bookmarkedOnly ? 'bi-bookmark-check-fill' : 'bi-bookmark'} me-1`}></i>
                  {bookmarkedOnly ? 'Showing Saved Only' : 'Saved Questions'}
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="d-flex flex-wrap gap-2 mt-3 pt-3 border-top">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`btn btn-sm rounded-pill px-3 ${
                    activeCategory === cat ? 'btn-primary' : 'btn-outline-secondary'
                  }`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat === 'All' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading questions...</span>
            </div>
            <p className="text-muted mt-2 small">Loading questions...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger shadow-sm text-center py-4">
            <i className="bi bi-exclamation-triangle-fill fs-3 mb-2 d-block"></i>
            <div>{error}</div>
            <button className="btn btn-outline-danger btn-sm mt-3" onClick={fetchQuestions}>
              Try Again
            </button>
          </div>
        ) : questions.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-3 text-center py-5">
            <div className="card-body">
              <i className="bi bi-inbox text-muted display-4"></i>
              <h5 className="fw-bold mt-3 text-dark">No questions match your filter criteria</h5>
              <p className="text-muted small">
                Try switching categories or clearing search keywords.
              </p>
              <button
                className="btn btn-outline-primary btn-sm mt-2"
                onClick={() => {
                  setActiveCategory('All');
                  setActiveDifficulty('All');
                  setSearchQuery('');
                  setBookmarkedOnly(false);
                }}
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-3">
            {questions.map((q) => {
              const isExpanded = expandedQuestionId === q.id;
              return (
                <div key={q.id} className="col-12">
                  <div
                    className={`card border-0 shadow-sm rounded-3 transition ${
                      isExpanded ? 'border-primary border' : ''
                    }`}
                  >
                    <div className="card-body p-4">
                      {/* Top Badges & Bookmark Action */}
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          {getCategoryBadge(q.category)}
                          {getDifficultyBadge(q.difficulty)}
                          <span className="badge bg-light text-muted border px-2 py-1">
                            <i className="bi bi-person-badge me-1"></i>
                            {q.role_target}
                          </span>
                        </div>
                        <button
                          className={`btn btn-sm rounded-circle p-1 px-2 ${
                            q.is_bookmarked
                              ? 'btn-warning text-dark'
                              : 'btn-outline-secondary'
                          }`}
                          style={{ width: '34px', height: '34px' }}
                          title={q.is_bookmarked ? 'Remove Bookmark' : 'Save Question'}
                          onClick={() => handleToggleBookmark(q.id)}
                        >
                          <i className={`bi ${q.is_bookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}`}></i>
                        </button>
                      </div>

                      {/* Question Text */}
                      <h5 className="fw-semibold text-dark mt-2 mb-3">
                        {q.question_text}
                      </h5>

                      {/* Expandable Answers & Ideal Points */}
                      {isExpanded ? (
                        <div className="mt-3 pt-3 border-top">
                          <div className="mb-3">
                            <h6 className="fw-bold text-primary small text-uppercase mb-2">
                              <i className="bi bi-lightbulb-fill me-1 text-warning"></i>
                              Key Points Interviewers Look For:
                            </h6>
                            <ul className="list-unstyled mb-0 ms-2">
                              {q.ideal_points && q.ideal_points.map((pt, idx) => (
                                <li key={idx} className="small text-dark mb-1 d-flex align-items-start">
                                  <i className="bi bi-check-circle-fill text-success me-2 mt-1" style={{ fontSize: '12px' }}></i>
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {q.sample_answer && (
                            <div className="p-3 bg-light rounded-3 border">
                              <div className="fw-bold text-dark small mb-1">
                                <i className="bi bi-chat-left-quote-fill text-primary me-2"></i>
                                Sample Model Answer:
                              </div>
                              <p className="small text-muted mb-0 lh-base" style={{ whiteSpace: 'pre-line' }}>
                                {q.sample_answer}
                              </p>
                            </div>
                          )}

                          <div className="text-end mt-3">
                            <button
                              className="btn btn-link btn-sm text-decoration-none text-muted"
                              onClick={() => setExpandedQuestionId(null)}
                            >
                              Hide Solution <i className="bi bi-chevron-up ms-1"></i>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                          <span className="small text-muted">
                            {q.ideal_points?.length || 0} Key evaluation criteria
                          </span>
                          <button
                            className="btn btn-outline-primary btn-sm px-3"
                            onClick={() => setExpandedQuestionId(q.id)}
                          >
                            View Ideal Answer & Points <i className="bi bi-chevron-down ms-1"></i>
                          </button>
                        </div>
                      )}
                    </div>
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