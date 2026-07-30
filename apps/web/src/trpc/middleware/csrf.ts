import { TRPCError } from '@trpc/server';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/server/security/csrf';
import type { Context } from '../context';

const SKIP_ACTIONS = new Set([
  'auth.register',
  'auth.login',
  'auth.refresh',
  'auth.logout',
  'auth.forgotPassword',
  'auth.resetPassword',
  'auth.verifyEmail',
]);

export function assertCsrf(ctx: Context, procedurePath: string) {
  if (SKIP_ACTIONS.has(procedurePath)) return;

  if (!ctx.user) return;

  const cookieToken = ctx.cookies.get(CSRF_COOKIE_NAME);
  if (!cookieToken) return;

  const headerVal = ctx.reqHeaders[CSRF_HEADER_NAME];
  const headerToken = Array.isArray(headerVal) ? headerVal[0] : headerVal;

  if (!headerToken || cookieToken !== headerToken) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'CSRF token mismatch' });
  }
}
