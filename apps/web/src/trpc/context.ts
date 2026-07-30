import { verifyAccessToken } from '../server/lib/jwt';
import prisma from '../server/db/client';
import type { AuthUser } from '@/types/auth';
import logger from '../server/lib/logger';
import { nanoid } from 'nanoid';

export interface Context {
  user: AuthUser | null;
  requestId: string;
  ip: string | null;
  userAgent: string | null;
}

interface CreateContextOptions {
  req: { headers: Record<string, string | string[] | undefined> };
}

export async function createContext(opts: CreateContextOptions): Promise<Context> {
  const req = opts.req;
  const requestId = nanoid(12);

  let user: AuthUser | null = null;

  const authHeader = req.headers.authorization;
  const authValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  if (authValue?.startsWith('Bearer ')) {
    const token = authValue.slice(7);
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

  return { user, requestId, ip, userAgent };
}
