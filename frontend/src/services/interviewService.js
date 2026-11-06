import api from './api';

export const interviewService = {
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
};