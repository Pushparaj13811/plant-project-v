import axios from 'axios';
import type { AxiosError } from 'axios';
import { store } from '@/redux/store';

export interface ApiErrorResponse {
  detail?: string;
  [key: string]: unknown;
}

const api = axios.create({
  baseURL: 'http://localhost:8000/api'
});

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
);

export default api; 