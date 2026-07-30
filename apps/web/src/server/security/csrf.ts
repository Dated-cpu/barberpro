import crypto from 'node:crypto';

const CSRF_COOKIE_NAME = 'bp_csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(name + '=')) {
      return trimmed.slice(name.length + 1);
    }
  }
  return null;
}

export function validateCsrfToken(
  cookieHeader: string | null,
  requestHeader: string | null,
): boolean {
  if (!requestHeader) return false;
  const cookieToken = getCookieValue(cookieHeader, CSRF_COOKIE_NAME);
  if (!cookieToken) return false;

  if (requestHeader.length !== 64 || cookieToken.length !== 64) return false;

  return crypto.timingSafeEqual(Buffer.from(requestHeader), Buffer.from(cookieToken));
}

export function createCsrfCookie(): { name: string; value: string; cookie: string } {
  const token = generateCsrfToken();
  const cookie = `${CSRF_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Secure`;
  return { name: CSRF_COOKIE_NAME, value: token, cookie };
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
