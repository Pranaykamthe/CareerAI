import api from './api';

export const dashboardService = {
  getCandidateSummary: async () => {
    const response = await api.get('/dashboard/candidate/');
    return response.data;
  },
};

export default dashboardService;