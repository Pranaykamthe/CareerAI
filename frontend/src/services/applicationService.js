import api from './api';

export const applicationService = {
  getApplications: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/applications/', { params });
    return response.data;
  },

  createOrUpdateApplication: async (jobId, status = 'Saved', notes = '') => {
    const response = await api.post('/applications/', {
      job_id: jobId,
      status,
      notes,
    });
    return response.data;
  },

  updateApplicationStatus: async (applicationId, status, notes = null) => {
    const payload = { status };
    if (notes !== null) payload.notes = notes;
    const response = await api.patch(`/applications/${applicationId}/`, payload);
    return response.data;
  },

  deleteApplication: async (applicationId) => {
    const response = await api.delete(`/applications/${applicationId}/`);
    return response.data;
  },

  getSkillGap: async (jobId, resumeId = null) => {
    const params = resumeId ? { resume_id: resumeId } : {};
    const response = await api.get(`/applications/gap/${jobId}/`, { params });
    return response.data;
  },
};