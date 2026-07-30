// Tokens stored in localStorage for convenience.
// For higher security, migrate to httpOnly cookies:
// 1. Server sets httpOnly cookie on login (Set-Cookie header)
// 2. Middleware reads cookie, attaches user to request
// 3. No client-side token storage needed

const ACCESS_TOKEN_KEY = 'bp_access_token';
const REFRESH_TOKEN_KEY = 'bp_refresh_token';

export const authStorage = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.clear();
  },
};
