import { router, barberProcedure } from '../trpc';
import { customerService } from '@/server/services/customers';
import { customerListSchema, customerIdSchema } from '@/validators/customers';

export const customersRouter = router({
  list: barberProcedure
    .input(customerListSchema)
    .query(async ({ ctx, input }) => {
      return customerService.list(ctx.user!.id, input.search, input.limit, input.cursor);
    }),

  getById: barberProcedure
    .input(customerIdSchema)
    .query(async ({ ctx, input }) => {
      return customerService.getById(ctx.user!.id, input.id);
    }),
});
