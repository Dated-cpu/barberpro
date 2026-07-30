import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';

const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
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

function getRole(request: NextRequest): string | null {
  const token = getCookieValue(request.headers.get('cookie'), 'bp_access_token');

  if (token) {
    const payload = decodeJwtPayload(token);
    if (payload?.role && typeof payload.role === 'string') return payload.role;
  }

  return null;
}

const roleRouteAccess: Record<string, string[]> = {
  CLIENT: ['/profile'],
  BARBER: ['/profile', '/barber'],
  ADMIN: ['/profile', '/barber', '/admin'],
  SUPER_ADMIN: ['/profile', '/barber', '/admin'],
};

function isRouteAllowed(role: string, pathname: string): boolean {
  const allowed = roleRouteAccess[role];
  if (!allowed) return false;
  return allowed.some((prefix) => pathname.startsWith(prefix));
}

function getDashboardUrl(role: string): string {
  switch (role) {
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin';
    case 'BARBER':
      return '/barber';
    default:
      return '/profile';
  }
}

export function middleware(request: NextRequest) {
  const requestId = nanoid(12);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const { pathname } = request.nextUrl;

  const isApiTrpc = pathname.startsWith('/api/trpc');
  const isAuthPage = pathname.startsWith('/auth/') || pathname.startsWith('/login');

  if (!isApiTrpc && !isAuthPage) {
    const role = getRole(request);

    if (role) {
      if (role in roleRouteAccess) {
        const allowed = isRouteAllowed(role, pathname);
        if (!allowed) {
          const dashboardUrl = new URL(getDashboardUrl(role), request.url);
          return NextResponse.redirect(dashboardUrl);
        }
      } else if (pathname.startsWith('/profile') || pathname.startsWith('/admin') || pathname.startsWith('/barber')) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    } else if (pathname.startsWith('/profile') || pathname.startsWith('/admin') || pathname.startsWith('/barber')) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('x-request-id', requestId);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '0');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', CSP_HEADER);
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
