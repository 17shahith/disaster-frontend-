import axios from 'axios';

/**
 * Centralised Axios client for the Flask REST API.
 *
 * - Base URL / timeout come from Vite env vars (see .env.example).
 * - The JWT access token is attached to every request.
 * - On 401 the access token is refreshed once with the refresh token and the
 *   request is retried; if that fails the session is cleared and the app is
 *   notified via the `auth:expired` window event (AuthContext logs out and
 *   ProtectedRoute redirects to /login).
 */
export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';
const TIMEOUT = Number(import.meta.env?.VITE_API_TIMEOUT) || 15000;

export const TOKEN_KEY = 'drrc_token';
export const REFRESH_TOKEN_KEY = 'drrc_refresh_token';
export const USER_KEY = 'drrc_user';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const saveSession = ({ accessToken, refreshToken, user }) => {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  // An explicit Authorization header (e.g. the refresh token on logout) wins.
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
const isAuthEndpoint = (url = '') => AUTH_ENDPOINTS.some((path) => url.includes(path));

let refreshInFlight = null;

/** Exchanges the refresh token for a new access token (one request shared by concurrent 401s). */
const refreshAccessToken = () => {
  if (!refreshInFlight) {
    const refreshToken = getRefreshToken();
    refreshInFlight = (
      refreshToken
        ? axios.post(`${API_BASE_URL}/auth/refresh`, null, {
            timeout: TIMEOUT,
            headers: { Authorization: `Bearer ${refreshToken}` },
          })
        : Promise.reject(new Error('No refresh token'))
    )
      .then(({ data }) => {
        const token = data?.data?.access_token;
        if (!token) throw new Error('Refresh response did not contain a token');
        localStorage.setItem(TOKEN_KEY, token);
        return token;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
};

const expireSession = () => {
  clearSession();
  window.dispatchEvent(new Event('auth:expired'));
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (response?.status === 401 && config && !isAuthEndpoint(config.url)) {
      if (!config._retried && getRefreshToken()) {
        try {
          const token = await refreshAccessToken();
          config._retried = true;
          config.headers.Authorization = `Bearer ${token}`;
          return api(config);
        } catch {
          // fall through: refresh token missing, expired or revoked
        }
      }
      expireSession();
    }

    if (!response && error.code !== 'ERR_CANCELED') {
      error.message =
        error.code === 'ECONNABORTED'
          ? 'The server took too long to respond. Please try again.'
          : 'Unable to reach the server. Check that the backend is running and VITE_API_BASE_URL is correct.';
    }
    return Promise.reject(error);
  },
);

/** Flask wraps every response as { success, message, data }; return the `data` part. */
export const unwrap = (payload) =>
  payload && typeof payload === 'object' && 'success' in payload && 'data' in payload ? payload.data : payload;

/** List endpoints return { items, pagination }. */
export const unwrapList = (payload) => {
  const body = unwrap(payload);
  if (Array.isArray(body)) return body;
  return body?.items ?? [];
};

/** Fetches every page of a paginated list endpoint (tables filter, sort and page client-side). */
export const fetchAll = async (endpoint, params = {}) => {
  const items = [];
  for (let page = 1; ; page += 1) {
    const { data } = await api.get(endpoint, { params: { ...params, page, per_page: 100 } });
    const body = unwrap(data);
    items.push(...(body?.items ?? []));
    if (!body?.pagination || page >= body.pagination.pages) break;
  }
  return items;
};

export default api;
