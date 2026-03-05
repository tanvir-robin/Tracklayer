import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4003';

const api = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401 (but not when the login request itself fails)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// Assets
export const assetsAPI = {
  list: () => api.get('/assets'),
  get: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post('/assets', data),
  delete: (id) => api.delete(`/assets/${id}`),
  togglePublicAnalytics: (id) => api.patch(`/assets/${id}/toggle-public`),
  upload: (formData) =>
    api.post('/assets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Analytics
export const analyticsAPI = {
  getAllCounts: () => api.get('/analytics'),
  get: (assetId) => api.get(`/analytics/${assetId}`),
  getRecentEvents: () => api.get('/analytics/recent-events'),
};

// Public analytics (no auth)
export const publicAPI = {
  getAnalytics: (trackingId) => axios.get(`${API_BASE}/public/${trackingId}`),
};

// Support tickets
export const ticketsAPI = {
  list:   ()         => api.get('/tickets'),
  create: (data)     => api.post('/tickets', data),
};

export const BACKEND_URL = API_BASE;
export default api;
