import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { getRoleFromCookie, isRouteAllowed, getDashboardUrl } from '@/server/auth/middleware';

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

export function middleware(request: NextRequest) {
  const requestId = nanoid(12);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const { pathname } = request.nextUrl;

  const isApiTrpc = pathname.startsWith('/api/trpc');
  const isAuthPage = pathname.startsWith('/auth/') || pathname.startsWith('/login');

  if (!isApiTrpc && !isAuthPage) {
    const role = getRoleFromCookie(request);

    if (role) {
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
