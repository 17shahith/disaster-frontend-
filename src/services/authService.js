import api, { USER_KEY, clearSession, getAccessToken, getRefreshToken, saveSession, unwrap } from './api';
import { ENDPOINTS } from './endpoints';
import { ROLE_TO_API, userAdapter } from './adapters';

const authService = {
  /** Flask accepts the email (or username) in the login body. */
  async login(email, password) {
    const { data } = await api.post(ENDPOINTS.auth.login, { email, password });
    const { access_token: accessToken, refresh_token: refreshToken, user } = unwrap(data);
    const uiUser = userAdapter.fromApi(user);
    saveSession({ accessToken, refreshToken, user: uiUser });
    return uiUser;
  },

  /** Public self-registration (administrator accounts can only be created by an administrator). */
  async register({ username, name, email, phone, password, role }) {
    const { data } = await api.post(ENDPOINTS.auth.register, {
      username,
      full_name: name,
      email,
      ...(phone ? { phone } : {}),
      password,
      role: ROLE_TO_API[role] || role,
    });
    return userAdapter.fromApi(unwrap(data));
  },

  /** Revokes both tokens on the server, then clears the local session even if the server is unreachable. */
  async logout() {
    const refreshToken = getRefreshToken();
    // Independent calls: an already-expired access token must not prevent revoking the refresh token.
    await Promise.allSettled([
      getAccessToken() && api.post(ENDPOINTS.auth.logout),
      refreshToken && api.post(ENDPOINTS.auth.logout, null, { headers: { Authorization: `Bearer ${refreshToken}` } }),
    ]);
    // Logging out locally must succeed even if the server calls fail.
    clearSession();
  },

  /** Validates the stored token and returns the current user (role re-read from the database). */
  async me() {
    const { data } = await api.get(ENDPOINTS.auth.me);
    const user = userAdapter.fromApi(unwrap(data));
    saveSession({ user });
    return user;
  },

  getStoredUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw && getAccessToken() ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
};

export default authService;
