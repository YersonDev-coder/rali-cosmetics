import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isAuthCheck = error.config?.url?.includes('/auth/me');
    if (error.response?.status === 401 && !isAuthCheck) {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
