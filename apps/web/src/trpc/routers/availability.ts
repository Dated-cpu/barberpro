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
    .query(async ({ input }) => {
      const appointments = await availabilityService.getBarberSchedule(input.barberId, input.startDate);
      return appointments;
    }),
});
