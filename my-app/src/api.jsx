import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000"
});

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
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default API;