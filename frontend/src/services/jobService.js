import api from './api';

export const jobService = {
  getJobs: async (params = {}) => {
    const response = await api.get('/jobs/', { params });
    return response.data;
  },

  getJobById: async (id) => {
    const response = await api.get(`/jobs/${id}/`);
    return response.data;
  },

  createJob: async (jobData) => {
    const response = await api.post('/jobs/', jobData);
    return response.data;
  },

  updateJob: async (id, jobData) => {
    const response = await api.put(`/jobs/${id}/`, jobData);
    return response.data;
  },

  deleteJob: async (id) => {
    const response = await api.delete(`/jobs/${id}/`);
    return response.data;
  },

  parseJobText: async (text) => {
    const response = await api.post('/jobs/parse-text/', { text });
    return response.data;
  },

  seedDefaultJobs: async () => {
    const response = await api.post('/jobs/seed-defaults/');
    return response.data;
  },
};