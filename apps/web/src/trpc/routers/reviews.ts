import { z } from 'zod';
import { router, barberProcedure, adminProcedure } from '../trpc';
import { reviewService } from '@/server/services/reviews';
import { moderateReviewSchema, reviewListSchema } from '@/validators/reviews';

export const reviewsRouter = router({
  list: barberProcedure
    .input(reviewListSchema)
    .query(async ({ ctx, input }) => {
      return reviewService.list({ ...input, barberId: ctx.user!.id });
    }),

  moderate: barberProcedure
    .input(moderateReviewSchema)
    .mutation(async ({ ctx, input }) => {
      return reviewService.moderate(input.reviewId, input.status, ctx.user!.id);
    }),

  stats: barberProcedure.query(async ({ ctx }) => {
    return reviewService.getStats(ctx.user!.id);
  }),

  adminList: adminProcedure
    .input(reviewListSchema)
    .query(async ({ input }) => {
      return reviewService.list(input);
    }),

  adminModerate: adminProcedure
    .input(moderateReviewSchema)
    .mutation(async ({ ctx, input }) => {
      return reviewService.moderate(input.reviewId, input.status, ctx.user!.id);
    }),

  adminStats: adminProcedure.query(async () => {
    return reviewService.getStats();
  }),

  adminDelete: adminProcedure
    .input(z.object({ reviewId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      return reviewService.delete(input.reviewId);
    }),
});
