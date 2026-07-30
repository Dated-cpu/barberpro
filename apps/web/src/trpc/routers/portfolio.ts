import { z } from 'zod';
import { router, barberProcedure } from '../trpc';
import { portfolioService } from '@/server/services/portfolio';
import { createPortfolioSchema, updatePortfolioSchema, portfolioIdSchema } from '@/validators/portfolio';

const addImagesSchema = portfolioIdSchema.extend({ imageIds: z.array(z.string().uuid()).min(1).max(10) });

export const portfolioRouter = router({
  list: barberProcedure.query(async ({ ctx }) => {
    return portfolioService.listByBarber(ctx.user!.id);
  }),

  create: barberProcedure
    .input(createPortfolioSchema)
    .mutation(async ({ ctx, input }) => {
      return portfolioService.create(ctx.user!.id, input);
    }),

  update: barberProcedure
    .input(updatePortfolioSchema)
    .mutation(async ({ ctx, input }) => {
      return portfolioService.update(input.id, ctx.user!.id, input);
    }),

  delete: barberProcedure
    .input(portfolioIdSchema)
    .mutation(async ({ ctx, input }) => {
      return portfolioService.delete(input.id, ctx.user!.id);
    }),

  addImages: barberProcedure
    .input(addImagesSchema)
    .mutation(async ({ ctx, input }) => {
      return portfolioService.addImages(input.id, input.imageIds, ctx.user!.id);
    }),
});
