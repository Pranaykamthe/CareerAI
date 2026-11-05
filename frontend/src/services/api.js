import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('careerai_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('careerai_access_token');
      localStorage.removeItem('careerai_refresh_token');
      localStorage.removeItem('careerai_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/admin-login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;