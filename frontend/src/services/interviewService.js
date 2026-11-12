import api from './api';

export const interviewService = {
  // ==========================================
  // 1. Question Bank & Catalog APIs
  // ==========================================

  // Fetch curated questions with optional filtering (category, difficulty, search, bookmarks)
  getQuestions: async (params = {}) => {
    const response = await api.get('/interviews/questions/', { params });
    return response.data;
  },

  // Retrieve a single question with model answers and talking points
  getQuestionById: async (id) => {
    const response = await api.get(`/interviews/questions/${id}/`);
    return response.data;
  },

  // Toggle bookmark on/off for a question
  toggleBookmark: async (id) => {
    const response = await api.post(`/interviews/questions/${id}/bookmark/`);
    return response.data;
  },

  // Fetch all bookmarked questions for the authenticated candidate
  getUserBookmarks: async () => {
    const response = await api.get('/interviews/bookmarks/');
    return response.data;
  },

  // Seed baseline curated questions
  seedQuestions: async () => {
    const response = await api.post('/interviews/questions/seed/');
    return response.data;
  },

  // ==========================================
  // 2. Mock Interview Session Lifecycle APIs
  // ==========================================

  // Initialize a new mock interview session
  startSession: async (sessionConfig) => {
    const response = await api.post('/interviews/sessions/start/', sessionConfig);
    return response.data;
  },

  // Retrieve full details and turn transcript for an interview session
  getSessionById: async (id) => {
    const response = await api.get(`/interviews/sessions/${id}/`);
    return response.data;
  },

  // Alias for getSessionById
  getSession: async (id) => {
    const response = await api.get(`/interviews/sessions/${id}/`);
    return response.data;
  },

  // List all mock sessions for the current user
  getUserSessions: async () => {
    const response = await api.get('/interviews/sessions/');
    return response.data;
  },

  // Submit candidate answer for turn-by-turn AI evaluation and scoring
  submitAnswer: async (sessionId, payload) => {
    const response = await api.post(`/interviews/sessions/${sessionId}/submit-answer/`, payload);
    return response.data;
  },

  // Alias for submitAnswer
  submitTurnAnswer: async (sessionId, payload) => {
    const response = await api.post(`/interviews/sessions/${sessionId}/submit-answer/`, payload);
    return response.data;
  },

  // Cancel and exit an ongoing interview session
  cancelSession: async (sessionId) => {
    const response = await api.post(`/interviews/sessions/${sessionId}/cancel/`);
    return response.data;
  },

  // ==========================================
  // 3. Phase 14: Post-Interview Diagnostic Report
  // ==========================================

  // Retrieve aggregated performance report, category breakdown, and strengths/weaknesses
  getSessionReport: async (sessionId) => {
    const response = await api.get(`/interviews/sessions/${sessionId}/report/`);
    return response.data;
  },

  // ==========================================
  // 4. Phase 15: History, Trends & Deletion
  // ==========================================

  // Query past sessions with search, category track, and completion status filters
  getHistory: (params = {}) => api.get('/interviews/history/', { params }),

  // Fetch aggregated KPI stats (total, completed, average score, highest score, trend points)
  getHistoryStats: () => api.get('/interviews/history/stats/'),

  // Delete an archived interview session and its transcript records
  deleteSession: (sessionId) => api.delete(`/interviews/sessions/${sessionId}/delete/`),
};

export default interviewService;