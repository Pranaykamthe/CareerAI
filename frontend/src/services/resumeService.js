import api from './api';

export const resumeService = {
  // ==========================================
  // 1. Core Resume Management & ATS Analysis
  // ==========================================

  getResumes: async () => {
    const response = await api.get('/resumes/');
    return response.data;
  },

  getResumeById: async (id) => {
    const response = await api.get(`/resumes/${id}/`);
    return response.data;
  },

  uploadResume: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/resumes/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  parseResume: async (id) => {
    const response = await api.post(`/resumes/${id}/parse/`);
    return response.data;
  },

  getAnalysis: async (id) => {
    const response = await api.get(`/resumes/${id}/analyze/`);
    return response.data;
  },

  triggerAnalysis: async (id) => {
    const response = await api.post(`/resumes/${id}/analyze/`);
    return response.data;
  },

  deleteResume: async (id) => {
    const response = await api.delete(`/resumes/${id}/`);
    return response.data;
  },

  setPrimaryResume: async (id) => {
    const response = await api.post(`/resumes/${id}/set-primary/`);
    return response.data;
  },

  downloadResume: async (id, fileName) => {
    const response = await api.get(`/resumes/${id}/download/`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  },

  // ==========================================
  // 2. Phase 19: AI Resume Builder & Groq ATS Improvements
  // ==========================================

  getDrafts: async () => {
    const response = await api.get('/resumes/builder/');
    return response.data;
  },

  createDraft: async (payload = {}) => {
    const response = await api.post('/resumes/builder/', payload);
    return response.data;
  },

  updateDraft: async (id, payload) => {
    const response = await api.put(`/resumes/builder/${id}/`, payload);
    return response.data;
  },

  deleteDraft: async (id) => {
    const response = await api.delete(`/resumes/builder/${id}/`);
    return response.data;
  },

  aiImproveSection: async (payload) => {
    const response = await api.post('/resumes/builder/ai-improve/', payload);
    return response.data;
  },

  autoFixATS: async (payload) => {
    const response = await api.post('/resumes/builder/auto-fix-ats/', payload);
    return response.data;
  },

  exportDocx: async (draftData) => {
    const response = await api.post('/resumes/builder/export-docx/', draftData, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${draftData.personal_info?.full_name || 'Resume'}_CareerAI.docx`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

export default resumeService;