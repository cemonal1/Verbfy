import axios from 'axios';
import Router from 'next/router';
import { toastError } from './toast';

// In-memory accessToken (singleton for non-hook usage)
let accessToken: string | null = null;
export const setApiAccessToken = (token: string | null) => { accessToken = token; };
export const getApiAccessToken = () => accessToken;

// Separate axios instance for refresh calls to avoid circular dependency
const refreshApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  withCredentials: true,
});

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  withCredentials: true, // send cookies for refresh
});

// Request: set Authorization header
api.interceptors.request.use(
  (config) => {
    const token = getApiAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response: handle 401 with refresh logic
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;
    
    // Log error for debugging
    console.error('API Error:', {
      status,
      url: originalRequest?.url,
      method: originalRequest?.method,
      error: error.message,
      response: error.response?.data
    });
    
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshApi.post('/api/auth/refresh-token')
          .then(res => {
            const newToken = res.data.accessToken;
            setApiAccessToken(newToken);
            isRefreshing = false;
            return newToken;
          })
          .catch((err) => {
            isRefreshing = false;
            setApiAccessToken(null);
            console.error('Token refresh failed via interceptor:', err);
            toastError('Session expired. Please log in again.');
            Router.replace('/login');
            return null;
          });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }
    
    // Handle specific error cases
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      toastError('Cannot connect to server. Please check if the backend is running.');
    } else if (status === 404) {
      toastError('API endpoint not found. Please check the server configuration.');
    } else if (status === 500) {
      toastError('Server error. Please try again later.');
    } else if (error.response?.data?.message) {
      toastError(error.response.data.message);
    } else {
      toastError(`Request failed: ${error.message || 'Unknown error'}`);
    }
    
    return Promise.reject(error);
  }
);

export default api; 