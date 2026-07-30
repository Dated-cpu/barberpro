import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { authService } from '../../server/services/auth';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema, changePasswordSchema, updateProfileSchema } from '@/validators/auth';
import { userRepository } from '@/server/repositories/user';
import { COOKIE_NAMES, setCookie, clearCookie, parseMaxAge } from '@/server/lib/cookies';
import { env } from '@/server/config/env';
import { rateLimit } from '@/server/security/rate-limit';
import { createCsrfCookie } from '@/server/security/csrf';

const ACCESS_MAX_AGE = parseMaxAge(env.JWT_ACCESS_EXPIRES_IN);
const REFRESH_MAX_AGE = parseMaxAge(env.JWT_REFRESH_EXPIRES_IN);
const REFRESH_REMEMBER_MAX_AGE = parseMaxAge(env.JWT_REFRESH_REMEMBER_EXPIRES_IN);

function setAuthCookies(ctx: { responseCookies: Map<string, string> }, tokens: { accessToken: string; refreshToken: string }, rememberMe?: boolean) {
  ctx.responseCookies.set(
    COOKIE_NAMES.ACCESS_TOKEN,
    setCookie(COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, ACCESS_MAX_AGE),
  );
  ctx.responseCookies.set(
    COOKIE_NAMES.REFRESH_TOKEN,
    setCookie(COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, rememberMe ? REFRESH_REMEMBER_MAX_AGE : REFRESH_MAX_AGE),
  );
}

function clearAuthCookies(ctx: { responseCookies: Map<string, string> }) {
  ctx.responseCookies.set(COOKIE_NAMES.ACCESS_TOKEN, clearCookie(COOKIE_NAMES.ACCESS_TOKEN));
  ctx.responseCookies.set(COOKIE_NAMES.REFRESH_TOKEN, clearCookie(COOKIE_NAMES.REFRESH_TOKEN));
}

function setCsrfCookie(ctx: { responseCookies: Map<string, string> }) {
  const csrf = createCsrfCookie();
  ctx.responseCookies.set(csrf.name, csrf.cookie);
}

export const authRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      await rateLimit({
        key: `auth:register:${ctx.ip ?? 'unknown'}`,
        limit: 3,
        windowSeconds: 900,
      });
      const result = await authService.register(input);
      setAuthCookies(ctx, result.tokens);
      setCsrfCookie(ctx);
      return { user: result.user };
    }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      await rateLimit({
        key: `auth:login:${ctx.ip ?? 'unknown'}`,
        limit: 10,
        windowSeconds: 900,
      });
      const result = await authService.login(
        input.login,
        input.password,
        input.rememberMe,
        ctx.userAgent ?? undefined,
        ctx.ip ?? undefined,
      );
      setAuthCookies(ctx, result.tokens, input.rememberMe);
      setCsrfCookie(ctx);
      return { user: result.user };
    }),

  refresh: publicProcedure
    .mutation(async ({ ctx }) => {
      const refreshToken = ctx.cookies.get(COOKIE_NAMES.REFRESH_TOKEN);
      if (!refreshToken) throw new Error('No refresh token');
      const tokens = await authService.refresh(refreshToken);
      setAuthCookies(ctx, tokens);
      setCsrfCookie(ctx);
      return { success: true };
    }),

  logout: publicProcedure
    .mutation(async ({ ctx }) => {
      const refreshToken = ctx.cookies.get(COOKIE_NAMES.REFRESH_TOKEN);
      if (refreshToken) {
        await authService.logout(refreshToken).catch(() => {});
      }
      clearAuthCookies(ctx);
      return { success: true };
    }),

  logoutAll: protectedProcedure
    .mutation(async ({ ctx }) => {
      await authService.logoutAllDevices(ctx.user!.id);
      clearAuthCookies(ctx);
      return { success: true };
    }),

  me: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.user;
    }),

  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const tx = await import('../../server/db/client').then((m) => m.default);
      const user = await userRepository.findById(tx as never, ctx.user!.id);
      if (!user) throw new Error('User not found');
      return user;
    }),

  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await authService.updateProfile(ctx.user!.id, input);
      return user;
    }),

  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      await rateLimit({
        key: `auth:change-password:${ctx.user!.id}`,
        limit: 3,
        windowSeconds: 3600,
      });
      await authService.changePassword(ctx.user!.id, input.oldPassword, input.newPassword);
      return { success: true };
    }),

  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(async ({ ctx, input }) => {
      await rateLimit({
        key: `auth:forgot-password:${ctx.ip ?? 'unknown'}`,
        limit: 3,
        windowSeconds: 3600,
      });
      await authService.forgotPassword(input.email);
      return { success: true };
    }),

  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input }) => {
      await rateLimit({
        key: `auth:reset-password:${input.token.slice(0, 8)}`,
        limit: 5,
        windowSeconds: 3600,
      });
      await authService.resetPassword(input.token, input.password);
      return { success: true };
    }),

  verifyEmail: publicProcedure
    .input(verifyEmailSchema)
    .mutation(async ({ input }) => {
      await rateLimit({
        key: `auth:verify-email:${input.token.slice(0, 8)}`,
        limit: 5,
        windowSeconds: 3600,
      });
      await authService.verifyEmail(input.token);
      return { success: true };
    }),

  resendVerification: protectedProcedure
    .mutation(async ({ ctx }) => {
      await rateLimit({
        key: `auth:resend-verification:${ctx.user!.id}`,
        limit: 3,
        windowSeconds: 3600,
      });
      await authService.resendVerification(ctx.user!.id);
      return { success: true };
    }),

  uploadAvatar: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      type: z.string().min(1),
      size: z.number().int().positive(),
      base64: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64.split(',')[1] ?? input.base64, 'base64');
      const url = await authService.uploadAvatar(ctx.user!.id, {
        buffer,
        originalname: input.name,
        mimetype: input.type,
        size: input.size,
      });
      return { url };
    }),
});
