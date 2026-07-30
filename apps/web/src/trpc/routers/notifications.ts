import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { notificationService } from '@/server/services/notifications';

export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({
      limit: z.coerce.number().int().min(1).max(100).default(20),
      cursor: z.string().uuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return notificationService.list(ctx.user.id, input.limit, input.cursor);
    }),

  unreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      return notificationService.getUnreadCount(ctx.user.id);
    }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await notificationService.markAsRead(ctx.user.id, input.id);
    }),

  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      await notificationService.markAllAsRead(ctx.user.id);
    }),
});
