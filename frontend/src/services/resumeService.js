import api from './api';

export const resumeService = {
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

  // Groq AI Resume-to-Profile Auto-Fill
  autofillProfileFromFile: async (file, saveToProfile = true) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('save_to_profile', saveToProfile ? 'true' : 'false');

    const response = await api.post('/resumes/autofill-profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  autofillProfileFromExisting: async (resumeId, saveToProfile = true) => {
    const response = await api.post('/resumes/autofill-profile/', {
      resume_id: resumeId,
      save_to_profile: saveToProfile,
    });
    return response.data;
  },

  // AI Resume Builder & Groq ATS Improvements
  getDrafts: async () => (await api.get('/resumes/builder/')).data,
  createDraft: async (payload = {}) => (await api.post('/resumes/builder/', payload)).data,
  updateDraft: async (id, payload) => (await api.put(`/resumes/builder/${id}/`, payload)).data,
  aiImproveSection: async (payload) => (await api.post('/resumes/builder/ai-improve/', payload)).data,
  autoFixATS: async (payload) => (await api.post('/resumes/builder/auto-fix-ats/', payload)).data,
  exportDocx: async (draftData) => {
    const response = await api.post('/resumes/builder/export-docx/', draftData, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${draftData.personal_info?.full_name || 'Resume'}_CareerAI.docx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};