import api from './api';

export const interviewService = {
  // Catalog APIs
  getQuestions: async (params = {}) => {
    const response = await api.get('/interviews/questions/', { params });
    return response.data;
  },

  getQuestionById: async (id) => {
    const response = await api.get(`/interviews/questions/${id}/`);
    return response.data;
  },

  toggleBookmark: async (id) => {
    const response = await api.post(`/interviews/questions/${id}/bookmark/`);
    return response.data;
  },

  seedQuestions: async () => {
    const response = await api.post('/interviews/questions/seed/');
    return response.data;
  },

  // Phase 11: Interview Session APIs
  startSession: async (sessionConfig) => {
    const response = await api.post('/interviews/sessions/start/', sessionConfig);
    return response.data;
  },

  getSessionById: async (id) => {
    const response = await api.get(`/interviews/sessions/${id}/`);
    return response.data;
  },

  getUserSessions: async () => {
    const response = await api.get('/interviews/sessions/');
    return response.data;
  },

  submitAnswer: async (sessionId, payload) => {
    const response = await api.post(`/interviews/sessions/${sessionId}/submit-answer/`, payload);
    return response.data;
  },

  cancelSession: async (sessionId) => {
    const response = await api.post(`/interviews/sessions/${sessionId}/cancel/`);
    return response.data;
  },
};