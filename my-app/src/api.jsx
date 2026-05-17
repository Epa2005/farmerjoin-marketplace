import axios from "axios";

// Prefer a runtime `window.__API_URL`, then build-time `VITE_API_URL`, then hostname logic.
const getBackendUrl = () => {
  try {
    if (typeof window !== 'undefined' && window.__API_URL) {
      return window.__API_URL;
    }
  } catch (e) {
    // ignore
  }

  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl) return envUrl;

  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  // Use local backend for development. In production, default to the current origin
  return isLocalhost ? 'http://localhost:5000' : window.location.origin;
};

const API = axios.create({
  baseURL: getBackendUrl()
});
console.log('API baseURL:', API.defaults.baseURL);

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
    console.log('Request interceptor - Token added:', token.substring(0, 20) + '...');
  }
  return req;
});

API.interceptors.response.use(
  (response) => {
    console.log('Response interceptor - Success:', response.status);
    return response;
  },
  (error) => {
    console.log('Response interceptor - Error:', error.response?.status);

    if (error.response?.status === 401) {
      console.log('Unauthorized response, clearing local auth state');
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== '/login') {
        window.location.hash = '#/login';
      }
      return Promise.reject(error);
    }

    // Handle banned/suspended users
    if (error.response?.status === 403) {
      const data = error.response.data;
      if (data?.status === 'banned' || data?.status === 'suspended') {
        console.log('User account status:', data.status);
        // Show alert message
        alert(data.message || 'Your account has been deactivated');
        // Clear all authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Redirect to login
        window.location.hash = '#/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
