import axios from 'axios';
import type { AxiosError } from 'axios';
import { store } from '@/redux/store';
import { refreshAccessToken, logout } from '@/redux/features/authSlice';

export interface ApiErrorResponse {
  detail?: string;
  [key: string]: unknown;
}

const baseURL = import.meta.env.VITE_API_URL;
const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token
api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Create a flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (error: unknown) => void }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config;
    
    if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }

    // If the error is 401 and we have a refresh token
    if (error.response.status === 401 && store.getState().auth.refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const result = await store.dispatch(refreshAccessToken()).unwrap();
          const newToken = result.access;

          // Update the failed request with new token and retry
          if (originalRequest && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          processQueue(null, newToken);
          return axios(originalRequest!);
        } catch {
          processQueue(new Error('Failed to refresh token'));
          store.dispatch(logout());
          throw error;
        } finally {
          isRefreshing = false;
        }
      } else {
        // If refresh is already in progress, wait for it to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axios(originalRequest!);
        }).catch((err) => {
          throw err;
        });
      }
    }

    throw error;
  }
);

export default api;

export const authApi = {
  login: async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email); // FastAPI OAuth2 expects 'username' field
    formData.append('password', password);
    
    const response = await api.post('/auth/login/', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  register: async (email: string, password: string, full_name: string) => {
    const response = await api.post('/auth/register/', { email, password, full_name });
    return response.data;
  },
  refreshToken: async (refresh: string) => {
    const formData = new FormData();
    formData.append('refresh', refresh);
    
    const response = await api.post('/auth/refresh/', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  resetPassword: async (email: string) => {
    const response = await api.post('/auth/password-reset/', { email });
    return response.data;
  },
  resetPasswordConfirm: async (token: string, password: string) => {
    const response = await api.post('/auth/password-reset-confirm/', { token, password });
    return response.data;
  },
};

export const chatApi = {
  sendMessage: async (message: string, plantId?: number, startDate?: string, endDate?: string) => {
    const response = await api.post('/chat/', {
      message,
      plant_id: plantId,
      start_date: startDate,
      end_date: endDate,
    });
    return response.data;
  },
}; 