import api from './api';

export const interviewService = {
  // ==========================================
  // 1. Question Bank & Catalog APIs
  // ==========================================

  // Fetch curated questions with optional query filtering (category, difficulty, search, bookmarks)
  getQuestions: async (params = {}) => {
    const response = await api.get('/interviews/questions/', { params });
    return response.data;
  },

  // Retrieve single question details with model answer & ideal talking points
  getQuestionById: async (id) => {
    const response = await api.get(`/interviews/questions/${id}/`);
    return response.data;
  },

  // Toggle bookmark on/off for a question
  toggleBookmark: async (id) => {
    const response = await api.post(`/interviews/questions/${id}/bookmark/`);
    return response.data;
  },

  // Seed default curated question bank
  seedQuestions: async () => {
    const response = await api.post('/interviews/questions/seed/');
    return response.data;
  },

  // ==========================================
  // 2. Mock Interview Session Lifecycle APIs
  // ==========================================

  // List all previous and in-progress sessions for the authenticated user
  getUserSessions: async () => {
    const response = await api.get('/interviews/sessions/');
    return response.data;
  },

  // Initialize a new mock interview session with chosen parameters
  startSession: async (sessionConfig) => {
    const response = await api.post('/interviews/sessions/start/', sessionConfig);
    return response.data;
  },

  // Retrieve full details and turn transcript for a specific interview session
  getSessionById: async (id) => {
    const response = await api.get(`/interviews/sessions/${id}/`);
    return response.data;
  },

  // Alias for getSessionById for flexible component consumption
  getSession: async (id) => {
    const response = await api.get(`/interviews/sessions/${id}/`);
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

  // Terminate and cancel an ongoing interview session
  cancelSession: async (sessionId) => {
    const response = await api.post(`/interviews/sessions/${sessionId}/cancel/`);
    return response.data;
  },

  // ==========================================
  // 3. Phase 14: Post-Interview Diagnostic Report
  // ==========================================

  // Retrieve aggregated performance analytics, score cards, rubric breakdown, and AI critique
  getSessionReport: async (sessionId) => {
    const response = await api.get(`/interviews/sessions/${sessionId}/report/`);
    return response.data;
  },
};

export default interviewService;