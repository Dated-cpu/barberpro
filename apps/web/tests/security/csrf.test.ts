import { describe, it, expect } from 'vitest';
import { validateCsrfToken, createCsrfCookie, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../../src/server/security/csrf';

function buildCookieHeader(name: string, value: string): string {
  return `${name}=${value}; Path=/; SameSite=Strict; Secure`;
}

describe('CSRF protection', () => {
  it('should generate a valid token', () => {
    const result = createCsrfCookie();
    expect(result.name).toBe(CSRF_COOKIE_NAME);
    expect(result.value).toHaveLength(64);
    expect(result.cookie).toContain(CSRF_COOKIE_NAME);
    expect(result.cookie).toContain('SameSite=Strict');
  });

  it('should validate matching cookie and header', () => {
    const { value } = createCsrfCookie();
    const cookieHeader = buildCookieHeader(CSRF_COOKIE_NAME, value);
    expect(validateCsrfToken(cookieHeader, value)).toBe(true);
  });

  it('should reject mismatched cookie and header', () => {
    const cookieHeader = buildCookieHeader(CSRF_COOKIE_NAME, 'a'.repeat(64));
    expect(validateCsrfToken(cookieHeader, 'b'.repeat(64))).toBe(false);
  });

  it('should reject missing header', () => {
    const { value } = createCsrfCookie();
    const cookieHeader = buildCookieHeader(CSRF_COOKIE_NAME, value);
    expect(validateCsrfToken(cookieHeader, null)).toBe(false);
  });

  it('should reject missing cookie', () => {
    const { value } = createCsrfCookie();
    expect(validateCsrfToken(null, value)).toBe(false);
  });

  it('should reject empty header', () => {
    const { value } = createCsrfCookie();
    const cookieHeader = buildCookieHeader(CSRF_COOKIE_NAME, value);
    expect(validateCsrfToken(cookieHeader, '')).toBe(false);
  });

  it('should reject wrong-length tokens', () => {
    const cookieHeader = buildCookieHeader(CSRF_COOKIE_NAME, 'short');
    expect(validateCsrfToken(cookieHeader, 'short')).toBe(false);
  });

  it('should reject header with wrong cookie name', () => {
    const { value } = createCsrfCookie();
    const cookieHeader = `wrong_name=${value}`;
    expect(validateCsrfToken(cookieHeader, value)).toBe(false);
  });

  it('should reject when no csrf cookie exists', () => {
    const cookieHeader = 'some_other_cookie=value';
    expect(validateCsrfToken(cookieHeader, 'a'.repeat(64))).toBe(false);
  });
});
