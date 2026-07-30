import { TRPCError } from '@trpc/server';
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
  clientAppointmentsSchema,
} from '@/validators/booking';
import { assertAppointmentAccess } from '@/server/auth/authorization';

export const appointmentRouter = router({
  create: publicProcedure
    .input(createAppointmentSchema)
    .mutation(async ({ ctx, input }) => {
      const appointment = await appointmentService.create({
        ...input,
        clientId: ctx.user?.id ?? undefined,
      });
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
    .mutation(async ({ ctx, input }) => {
      const appointment = await appointmentService.confirm(input.id, ctx.user!);
      return appointment;
    }),

  cancel: protectedProcedure
    .input(cancelAppointmentSchema)
    .mutation(async ({ ctx, input }) => {
      const appointment = await appointmentService.cancel(
        input.appointmentId,
        ctx.user!,
        input.reason,
      );
      return appointment;
    }),

  updateStatus: barberProcedure
    .input(updateAppointmentStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const appointment = await appointmentService.updateStatus(input.id, input.status, ctx.user!, input.notes);
      return appointment;
    }),

  reschedule: barberProcedure
    .input(rescheduleAppointmentSchema)
    .mutation(async ({ ctx, input }) => {
      const appointment = await appointmentService.reschedule(input.id, new Date(input.startTime), ctx.user!);
      return appointment;
    }),

  complete: barberProcedure
    .input(completeAppointmentSchema)
    .mutation(async ({ ctx, input }) => {
      const appointment = await appointmentService.complete(input.appointmentId, ctx.user!, input.notes);
      return appointment;
    }),

  markNoShow: barberProcedure
    .input(markNoShowSchema)
    .mutation(async ({ ctx, input }) => {
      const appointment = await appointmentService.markNoShow(input.appointmentId, ctx.user!);
      return appointment;
    }),

  getById: protectedProcedure
    .input(appointmentIdSchema)
    .query(async ({ ctx, input }) => {
      const appointment = await appointmentService.getById(input.id);
      if (!appointment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found' });

      assertAppointmentAccess(ctx.user!, appointment.clientId, appointment.barberId);

      return appointment;
    }),

  getMyAppointments: protectedProcedure
    .query(async ({ ctx }) => {
      const appointments = await appointmentService.getMyAppointments(ctx.user!.id);
      return appointments;
    }),

  myUpcoming: protectedProcedure
    .query(async ({ ctx }) => {
      const appointment = await appointmentService.getMyUpcoming(ctx.user!.id);
      return appointment;
    }),

  myHistory: protectedProcedure
    .input(clientAppointmentsSchema)
    .query(async ({ ctx, input }) => {
      const appointments = await appointmentService.getMyHistory(ctx.user!.id, input);
      return appointments;
    }),
});
