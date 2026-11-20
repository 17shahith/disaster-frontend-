import api, { TOKEN_KEY, USER_KEY, unwrap } from './api';
import { ENDPOINTS } from './endpoints';

const authService = {
  async login(email, password) {
    const { data } = await api.post(ENDPOINTS.auth.login, { email, password });
    const { token, user } = unwrap(data);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },
  async logout() {
    try {
      await api.post(ENDPOINTS.auth.logout);
    } catch {
      // Logging out locally must succeed even if the server call fails.
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },
  me: () => api.get(ENDPOINTS.auth.me).then((r) => unwrap(r.data)),
  getStoredUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw && localStorage.getItem(TOKEN_KEY) ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};

export default authService;
