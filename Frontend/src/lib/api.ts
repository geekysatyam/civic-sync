import axios from 'axios';

/** In dev, Vite proxies /api → backend. In prod, VITE_API_URL must be set to the Railway URL. */
const baseURL = import.meta.env.VITE_API_URL ?? '';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000, // 30s — certificate PDF generation needs extra time
});

const TOKEN_KEY = 'civicsync_access_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const t = getStoredToken();
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config as typeof err.config & { _retry?: boolean };
    if (!original || original._retry) return Promise.reject(err);
    if (err.response?.status !== 401 || original.url?.includes('/api/auth/refresh')) {
      return Promise.reject(err);
    }
    original._retry = true;
    try {
      if (!refreshing) {
        refreshing = axios
          .post<{ accessToken: string }>(`${baseURL}/api/auth/refresh`, {}, { withCredentials: true })
          .then((r) => r.data.accessToken)
          .finally(() => {
            refreshing = null;
          });
      }
      const accessToken = await refreshing;
      setStoredToken(accessToken);
      original.headers.Authorization = `Bearer ${accessToken}`;
      return api(original);
    } catch {
      setStoredToken(null);
      return Promise.reject(err);
    }
  }
);
