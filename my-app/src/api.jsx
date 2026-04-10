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
    // Don't automatically clear tokens - let individual components handle it
    return Promise.reject(error);
  }
);

export default API;