import { TRPCError } from '@trpc/server';
import { router, publicProcedure, barberProcedure } from '../trpc';
import { availabilityService } from '../../server/services/availability';
import { slotQuerySchema, dateSlotsQuerySchema } from '@/validators/booking';

export const availabilityRouter = router({
  getAvailableSlots: publicProcedure
    .input(slotQuerySchema)
    .query(async ({ input }) => {
      const slots = await availabilityService.getAvailableSlots(input.barberId, input.date, input.serviceId);
      return slots;
    }),

  getBarberSchedule: barberProcedure
    .input(dateSlotsQuerySchema)
    .query(async ({ ctx, input }) => {
      if (input.barberId && input.barberId !== ctx.user!.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }
      const appointments = await availabilityService.getBarberSchedule(ctx.user!.id, input.startDate);
      return appointments;
    }),
});
