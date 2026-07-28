import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { authService } from '../../server/services/auth';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema, changePasswordSchema, updateProfileSchema } from '@/validators/auth';
import { userRepository } from '@/server/repositories/user';

export const authRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      const result = await authService.register(input);
      return result;
    }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await authService.login(
        input.login,
        input.password,
        input.rememberMe,
        ctx.userAgent ?? undefined,
        ctx.ip ?? undefined,
      );
      return result;
    }),

  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input }) => {
      const tokens = await authService.refresh(input.refreshToken);
      return tokens;
    }),

  logout: protectedProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input }) => {
      await authService.logout(input.refreshToken);
      return { success: true };
    }),

  logoutAll: protectedProcedure
    .mutation(async ({ ctx }) => {
      await authService.logoutAllDevices(ctx.user!.id);
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
      await authService.changePassword(ctx.user!.id, input.oldPassword, input.newPassword);
      return { success: true };
    }),

  forgotPassword: publicProcedure
    .input(forgotPasswordSchema)
    .mutation(async ({ input }) => {
      await authService.forgotPassword(input.email);
      return { success: true };
    }),

  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input }) => {
      await authService.resetPassword(input.token, input.password);
      return { success: true };
    }),

  verifyEmail: publicProcedure
    .input(verifyEmailSchema)
    .mutation(async ({ input }) => {
      await authService.verifyEmail(input.token);
      return { success: true };
    }),

  resendVerification: protectedProcedure
    .mutation(async ({ ctx }) => {
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
