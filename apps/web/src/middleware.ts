import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { getRoleFromCookie, isRouteAllowed, getDashboardUrl } from '@/server/auth/middleware';
import {
  STRICT_TRANSPORT_SECURITY,
  X_CONTENT_TYPE_OPTIONS,
  X_FRAME_OPTIONS,
  X_XSS_PROTECTION,
  REFERRER_POLICY,
  PERMISSIONS_POLICY,
  CSP_HEADER,
} from '@/server/security/headers';

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
  response.headers.set('X-Content-Type-Options', X_CONTENT_TYPE_OPTIONS);
  response.headers.set('X-Frame-Options', X_FRAME_OPTIONS);
  response.headers.set('X-XSS-Protection', X_XSS_PROTECTION);
  response.headers.set('Referrer-Policy', REFERRER_POLICY);
  response.headers.set('Content-Security-Policy', CSP_HEADER);
  response.headers.set('Strict-Transport-Security', STRICT_TRANSPORT_SECURITY);
  response.headers.set('Permissions-Policy', PERMISSIONS_POLICY);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/).*)'],
};
