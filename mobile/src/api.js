import axios from 'axios';

const API = axios.create({
  baseURL: 'http://192.168.0.186:5000', // Replace with your computer's IP address
});

// Request interceptor to add token
API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      const data = error.response.data;
      if (data?.status === 'banned' || data?.status === 'suspended') {
        alert(data.message || 'Your account has been deactivated');
        AsyncStorage.removeItem('token');
        AsyncStorage.removeItem('user');
        // Navigate to login (handle in screen)
      }
    }
    return Promise.reject(error);
  }
);

export default API;
