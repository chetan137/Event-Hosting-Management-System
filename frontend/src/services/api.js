import axios from 'axios';

// Determine the base URL based on the environment
const baseURL = import.meta.env.MODE === 'production'
  ? (import.meta.env.VITE_API_URL || 'https://event-hosting-management-system-1.onrender.com')
  : 'http://localhost:8080'; // In development, connect to backend directly

// Create an Axios instance with base configuration
const API = axios.create({
  baseURL: baseURL,
  withCredentials: true, // Optional: if you need to send cookies across domains
});

// Add a request interceptor to include the Token if available
API.interceptors.request.use(
  (config) => {
    // Check local storage for token (assumed 'userInfohas token from prev logic)
    // Or maybe just 'token' key?
    // Let's check where we will store it.
    // In userController.js we send back: { _id, fullName, email, role, token }
    // Typical pattern: localStorage.setItem('userInfo', JSON.stringify(data));

    // We will assume storage key 'userInfo'
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
       const { token } = JSON.parse(userInfo);
       if (token) {
         config.headers.Authorization = `Bearer ${token}`;
       }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
