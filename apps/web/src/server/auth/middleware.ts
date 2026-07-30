import type { NextRequest } from 'next/server';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload)) as Record<string, unknown>;
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

export function getRoleFromCookie(request: NextRequest): string | null {
  const token = getCookieValue(request.headers.get('cookie'), 'bp_access_token');
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (payload?.role && typeof payload.role === 'string') return payload.role;
  return null;
}

const ROLE_LEVELS: Record<string, number> = {
  GUEST: -1,
  CLIENT: 0,
  BARBER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

const ROUTE_PERMISSIONS = [
  { prefix: '/profile', minimumLevel: 0 },
  { prefix: '/barber', minimumLevel: 1 },
  { prefix: '/admin', minimumLevel: 2 },
];

export function isRouteAllowed(role: string, pathname: string): boolean {
  const userLevel = ROLE_LEVELS[role];
  if (userLevel === undefined) return false;

  for (const { prefix, minimumLevel } of ROUTE_PERMISSIONS) {
    if (pathname.startsWith(prefix)) {
      return userLevel >= minimumLevel;
    }
  }

  return true;
}

export function getDashboardUrl(role: string): string {
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

export function getRoleLevel(role: string): number {
  return ROLE_LEVELS[role] ?? -1;
}
