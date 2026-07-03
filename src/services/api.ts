import axios from 'axios';

// ─── API Base URL Configuration ───────────────────────────────────────────────
// Change this single constant to point to your API regardless of where the
// frontend is hosted. Examples:
//   Local XAMPP:  'http://localhost/bhms/api'
//   cPanel:       'https://yourdomain.com/api'
const API_BASE_URL = 'http://localhost/bhms/api';

const getBaseURL = () => API_BASE_URL;

export const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Inject JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bridgesense_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle expired sessions or 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and reload to force login page redirect
      localStorage.removeItem('bridgesense_token');
      localStorage.removeItem('bridgesense_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
