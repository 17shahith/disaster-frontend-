import axios from 'axios';
import mockAdapter from './mock/mockAdapter';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
export const USE_MOCK_API = String(import.meta.env.VITE_USE_MOCK_API ?? 'true').toLowerCase() === 'true';

export const TOKEN_KEY = 'drrc_token';
export const USER_KEY = 'drrc_user';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// During UI development requests are served by an in-browser mock API.
// Set VITE_USE_MOCK_API=false to talk to the real backend.
if (USE_MOCK_API) {
  api.defaults.adapter = mockAdapter;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const isLoginCall = error?.config?.url?.includes('/auth/login');
    if (status === 401 && !isLoginCall) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event('auth:expired'));
    }
    if (!error.response && error.code !== 'ERR_CANCELED') {
      error.message = 'Unable to reach the server. Check your connection or API configuration.';
    }
    return Promise.reject(error);
  },
);

/** Accepts both plain arrays and common paginated envelopes ({ data }, { items }, { content }). */
export const unwrapList = (payload) => {
  if (Array.isArray(payload)) return payload;
  return payload?.data ?? payload?.items ?? payload?.content ?? [];
};

export const unwrap = (payload) => (payload && payload.data !== undefined && !Array.isArray(payload) && Object.keys(payload).length === 1 ? payload.data : payload);

export default api;
