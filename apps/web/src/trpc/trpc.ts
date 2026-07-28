import { initTRPC, TRPCError } from '@trpc/server';
import type { Context } from './context';
import { isValidRole } from './middleware/auth';

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

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  if (!isValidRole(ctx.user.role, ['ADMIN', 'SUPER_ADMIN'])) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const barberProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  if (!isValidRole(ctx.user.role, ['BARBER', 'ADMIN', 'SUPER_ADMIN'])) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Barber access required' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const middleware = t.middleware;
