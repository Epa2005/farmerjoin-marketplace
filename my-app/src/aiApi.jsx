import axios from 'axios';

// Dynamically determine AI backend URL based on current hostname
const getAiBackendUrl = () => {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  // AI service runs on port 3001
  return isLocalhost ? 'http://localhost:3001' : `http://${hostname}:3001`;
};

const aiApi = axios.create({
    baseURL: getAiBackendUrl(),
    timeout: 120000,
});

aiApi.interceptors.request.use((req) => {
    // keep logs minimal in production
    if (import.meta.env.DEV) {
        console.log('[aiApi] Request:', req.method, req.url);
    }
    return req;
});

aiApi.interceptors.response.use(
    (res) => res,
    (err) => {
        if (import.meta.env.DEV) console.warn('[aiApi] Error:', err.message || err);
        // If AI service is not available, reject so fallback can be used
        return Promise.reject(err);
    }
);

export default aiApi;
