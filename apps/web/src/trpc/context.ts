import { verifyAccessToken } from '../server/lib/jwt';
import prisma from '../server/db/client';
import type { AuthUser } from '@/types/auth';
import logger from '../server/lib/logger';
import { nanoid } from 'nanoid';
import { COOKIE_NAMES } from '../server/lib/cookies';

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

export interface Context {
  user: AuthUser | null;
  requestId: string;
  ip: string | null;
  userAgent: string | null;
  responseCookies: Map<string, string>;
  cookies: Map<string, string>;
}

interface CreateContextOptions {
  req: { headers: Record<string, string | string[] | undefined> };
  responseCookies: Map<string, string>;
}

export async function createContext(opts: CreateContextOptions): Promise<Context> {
  const req = opts.req;
  const requestId = nanoid(12);
  const responseCookies = opts.responseCookies;

  let user: AuthUser | null = null;

  const authHeader = req.headers.authorization;
  const authValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  let token: string | null = null;

  if (authValue?.startsWith('Bearer ')) {
    token = authValue.slice(7);
  }

  if (!token) {
    const cookieHeader = req.headers.cookie;
    const cookieVal = Array.isArray(cookieHeader) ? (cookieHeader[0] ?? null) : (cookieHeader ?? null);
    token = getCookieValue(cookieVal, COOKIE_NAMES.ACCESS_TOKEN);
  }

  if (token) {
    try {
      const payload = verifyAccessToken(token);
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true, isActive: true, description: true },
      });
      if (dbUser && dbUser.isActive) {
        user = {
          id: dbUser.id,
          email: dbUser.email,
          phone: dbUser.phone,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          role: dbUser.role,
          isActive: dbUser.isActive,
        };
      }
    } catch {
      logger.debug('Invalid access token', { requestId });
    }
  }

  const xff = req.headers['x-forwarded-for'];
  const xffValue = Array.isArray(xff) ? xff[0] : xff;
  const ipStr = xffValue?.split(',')[0]?.trim();
  const ip: string | null = ipStr ?? null;

  const ua = req.headers['user-agent'];
  const uaVal = Array.isArray(ua) ? ua[0] : ua;
  const userAgent: string | null = uaVal ?? null;

  const cookieHeader = req.headers.cookie;
  const cookieVal: string | null = Array.isArray(cookieHeader) ? cookieHeader[0] ?? null : (cookieHeader ?? null);
  const cookies = new Map<string, string>();
  if (cookieVal) {
    for (const part of cookieVal.split(';')) {
      const trimmed = part.trim();
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        cookies.set(trimmed.slice(0, eqIdx), trimmed.slice(eqIdx + 1));
      }
    }
  }

  return { user, requestId, ip, userAgent, responseCookies, cookies };
}
