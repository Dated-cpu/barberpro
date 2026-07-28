import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, barberProcedure } from '../trpc';
import { appointmentService } from '../../server/services/appointment';
import {
  createAppointmentSchema,
  cancelAppointmentSchema,
  completeAppointmentSchema,
  markNoShowSchema,
  appointmentIdSchema,
  updateAppointmentStatusSchema,
  rescheduleAppointmentSchema,
} from '@/validators/booking';

export const appointmentRouter = router({
  create: publicProcedure
    .input(createAppointmentSchema)
    .mutation(async ({ ctx, input }) => {
      const clientId = ctx.user?.id ?? 'guest';
      const appointment = await appointmentService.create({ ...input, clientId });
      return appointment;
    }),

  createManual: barberProcedure
    .input(z.object({
      serviceId: z.string().uuid(),
      branchId: z.string().uuid().nullable().optional(),
      startTime: z.string().datetime({ offset: true }),
      clientNotes: z.string().max(500).optional().nullable(),
      clientName: z.string().min(2).max(100),
      clientPhone: z.string().min(5).max(20),
    }))
    .mutation(async ({ ctx, input }) => {
      const appointment = await appointmentService.create({ ...input, barberId: ctx.user!.id, clientId: ctx.user!.id });
      return appointment;
    }),

  confirm: barberProcedure
    .input(appointmentIdSchema)
    .mutation(async ({ input }) => {
      const appointment = await appointmentService.confirm(input.id);
      return appointment;
    }),

  cancel: protectedProcedure
    .input(cancelAppointmentSchema)
    .mutation(async ({ ctx, input }) => {
      const appointment = await appointmentService.cancel(
        input.appointmentId,
        ctx.user!.id,
        ctx.user!.role,
        input.reason,
      );
      return appointment;
    }),

  updateStatus: barberProcedure
    .input(updateAppointmentStatusSchema)
    .mutation(async ({ input }) => {
      const appointment = await appointmentService.updateStatus(input.id, input.status, input.notes);
      return appointment;
    }),

  reschedule: barberProcedure
    .input(rescheduleAppointmentSchema)
    .mutation(async ({ input }) => {
      const appointment = await appointmentService.reschedule(input.id, new Date(input.startTime));
      return appointment;
    }),

  complete: barberProcedure
    .input(completeAppointmentSchema)
    .mutation(async ({ input }) => {
      const appointment = await appointmentService.complete(input.appointmentId, input.notes);
      return appointment;
    }),

  markNoShow: barberProcedure
    .input(markNoShowSchema)
    .mutation(async ({ input }) => {
      const appointment = await appointmentService.markNoShow(input.appointmentId);
      return appointment;
    }),

  getById: protectedProcedure
    .input(appointmentIdSchema)
    .query(async ({ input }) => {
      const appointment = await appointmentService.getById(input.id);
      return appointment;
    }),

  getMyAppointments: protectedProcedure
    .query(async ({ ctx }) => {
      const appointments = await appointmentService.getMyAppointments(ctx.user!.id);
      return appointments;
    }),
});
