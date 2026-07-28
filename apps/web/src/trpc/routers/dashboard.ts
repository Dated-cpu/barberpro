import { router, barberProcedure, adminProcedure } from '../trpc';
import { dashboardService } from '@/server/services/dashboard';
import { dashboardQuerySchema, analyticsQuerySchema, calendarQuerySchema } from '@/validators/dashboard';

export const dashboardRouter = router({
  overview: barberProcedure.query(async ({ ctx }) => {
    return dashboardService.getDashboardOverview(ctx.user!.id);
  }),

  today: barberProcedure
    .input(dashboardQuerySchema)
    .query(async ({ ctx, input }) => {
      const date = input.date ? new Date(input.date + 'T00:00:00') : new Date();
      return dashboardService.getTodayStats(ctx.user!.id, date);
    }),

  calendar: barberProcedure
    .input(calendarQuerySchema)
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startDate + 'T00:00:00');
      const endDate = new Date(input.endDate + 'T23:59:59');
      return dashboardService.getCalendarAppointments(ctx.user!.id, startDate, endDate);
    }),

  analytics: barberProcedure
    .input(analyticsQuerySchema)
    .query(async ({ ctx, input }) => {
      const from = new Date(input.from + 'T00:00:00');
      const to = new Date(input.to + 'T23:59:59');
      return dashboardService.getAnalytics(ctx.user!.id, from, to);
    }),

  adminOverview: adminProcedure.query(async () => {
    const prisma = (await import('@/server/db/client')).default;
    const [totalBarbers, totalClients, totalAppointments, totalRevenue] = await Promise.all([
      prisma.user.count({ where: { role: 'BARBER', isActive: true, deletedAt: null } }),
      prisma.user.count({ where: { role: 'CLIENT', deletedAt: null } }),
      prisma.appointment.count({ where: { deletedAt: null } }),
      prisma.appointment.aggregate({
        where: { deletedAt: null, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
        _sum: { priceAtBooking: true },
      }),
    ]);

    return { totalBarbers, totalClients, totalAppointments, totalRevenue: Number(totalRevenue._sum.priceAtBooking ?? 0) };
  }),
});
