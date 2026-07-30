import { z } from 'zod';
import { router, barberProcedure } from '../trpc';
import { mediaService } from '@/server/services/media';

export const mediaRouter = router({
  upload: barberProcedure
    .input(z.object({
      name: z.string().min(1),
      type: z.string().min(1),
      size: z.number().int().positive(),
      base64: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64.split(',')[1] ?? input.base64, 'base64');
      return mediaService.upload({
        buffer,
        originalname: input.name,
        mimetype: input.type,
        size: input.size,
      }, ctx.user!.id);
    }),

  delete: barberProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return mediaService.delete(input.id, ctx.user!.id);
    }),

  list: barberProcedure.query(async ({ ctx }) => {
    return mediaService.listByUploader(ctx.user!.id);
  }),
});
