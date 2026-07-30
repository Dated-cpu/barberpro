import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context';
import { Permission, hasPermission } from '@/server/auth/permissions';
import { assertCsrf } from './middleware/csrf';

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        code: error.code,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next, path, type }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  if (type === 'mutation') {
    assertCsrf(ctx, path);
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = t.procedure.use(({ ctx, next, path, type }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  if (!hasPermission(ctx.user.role, Permission.ADMIN_PANEL)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  if (type === 'mutation') {
    assertCsrf(ctx, path);
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const barberProcedure = t.procedure.use(({ ctx, next, path, type }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  if (!hasPermission(ctx.user.role, Permission.DASHBOARD_VIEW)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Barber access required' });
  }
  if (type === 'mutation') {
    assertCsrf(ctx, path);
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const middleware = t.middleware;
