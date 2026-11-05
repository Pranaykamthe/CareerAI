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
};