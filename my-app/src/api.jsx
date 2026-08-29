import axios from "axios";

const DEFAULT_LOCAL_API_URL = 'http://localhost:5000';
let healthCheckStarted = false;

// Prefer a runtime `window.__API_URL`, then build-time `VITE_API_URL`, then hostname logic.
export const getBackendUrl = () => {
  try {
    if (typeof window !== 'undefined' && window.__API_URL) {
      const url = window.__API_URL;
      if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))) return url;
    }
  } catch (e) {
    // ignore
  }

  const envUrl = import.meta.env?.VITE_API_URL;
  if (envUrl) {
    // Validate env URL has proper format
    if (envUrl.startsWith('http://') || envUrl.startsWith('https://') || envUrl.startsWith('/')) return envUrl;
    // If it's just a port like ':5000', prepend localhost
    if (envUrl.startsWith(':')) return `http://localhost${envUrl}`;
    return envUrl;
  }

  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  // Use local backend for development. In production, require explicit configuration.
  return isLocalhost ? DEFAULT_LOCAL_API_URL : '';
};

// We allow re-init of API baseURL at runtime by calling `setApiBaseUrl`.
const backendUrl = getBackendUrl();
const API = backendUrl ? axios.create({ baseURL: backendUrl }) : axios.create();
console.log('API baseURL:', backendUrl || '(none)');

export function setApiBaseUrl(url) {
  if (!url) return;
  API.defaults.baseURL = url;
  console.log('API baseURL set to', API.defaults.baseURL);
}

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
    console.log('Response interceptor - Error status:', error.response?.status, 'message:', error.message);
    // Log server response body when available to help debug 404/500
    try {
      if (error.response) {
        console.warn('Response body:', error.response.data);
      }
    } catch (e) {
      // ignore logging errors
    }

    // Common status handling
    if (error.response?.status === 401) {
      console.log('Unauthorized response, clearing local auth state');
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== '/login') {
        window.location.hash = '#/login';
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      const data = error.response.data;
      if (data?.status === 'banned' || data?.status === 'suspended') {
        console.log('User account status:', data.status);
        alert(data.message || 'Your account has been deactivated');
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.hash = '#/login';
        return Promise.reject(error);
      }
    }

    // Graceful fallback: return original error so callers can handle it
    return Promise.reject(error);
  }
);

// Optional: perform a lightweight health check (non-blocking) to aid debugging in local development
const tryHealthCheck = async () => {
  if (healthCheckStarted) {
    return;
  }
  healthCheckStarted = true;

  if (!API.defaults.baseURL) {
    return;
  }

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  if (!isLocalhost) {
    return;
  }

  try {
    const healthUrl = `${API.defaults.baseURL.replace(/\/$/, '')}/products`;
    const res = await axios.get(healthUrl, { timeout: 3000 });
    console.log('Backend health check OK:', healthUrl, 'status', res.status);
  } catch (e) {
    // Avoid adding extra frontend noise when the backend is already under load.
  }
};

tryHealthCheck();

export default API;
