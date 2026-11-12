import api from './api';

export const adminService = {
  getOverview: async () => {
    const response = await api.get('/dashboard/admin/overview/');
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await api.get('/dashboard/admin/users/', { params });
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await api.patch(`/dashboard/admin/users/${id}/`, data);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/dashboard/admin/users/${id}/`);
    return response.data;
  },

  getJobs: async () => {
    const response = await api.get('/dashboard/admin/jobs/');
    return response.data;
  },

  createJob: async (data) => {
    const response = await api.post('/dashboard/admin/jobs/', data);
    return response.data;
  },

  updateJob: async (id, data) => {
    const response = await api.patch(`/dashboard/admin/jobs/${id}/`, data);
    return response.data;
  },

  deleteJob: async (id) => {
    const response = await api.delete(`/dashboard/admin/jobs/${id}/`);
    return response.data;
  },

  getQuestions: async () => {
    const response = await api.get('/dashboard/admin/questions/');
    return response.data;
  },

  createQuestion: async (data) => {
    const response = await api.post('/dashboard/admin/questions/', data);
    return response.data;
  },

  updateQuestion: async (id, data) => {
    const response = await api.patch(`/dashboard/admin/questions/${id}/`, data);
    return response.data;
  },

  deleteQuestion: async (id) => {
    const response = await api.delete(`/dashboard/admin/questions/${id}/`);
    return response.data;
  },
};

export default adminService;