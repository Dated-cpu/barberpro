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
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now); monthStart.setDate(monthStart.getDate() - 30);

    const [
      totalBarbers, totalClients, totalAppointments, totalRevenue,
      todayAppts, weekAppts, monthAppts,
      newUsers, newClients, popularService,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'BARBER', isActive: true, deletedAt: null } }),
      prisma.user.count({ where: { role: 'CLIENT', deletedAt: null } }),
      prisma.appointment.count({ where: { deletedAt: null } }),
      prisma.appointment.aggregate({
        where: { deletedAt: null, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
        _sum: { priceAtBooking: true },
      }),
      prisma.appointment.findMany({
        where: { startTime: { gte: todayStart, lte: todayEnd }, deletedAt: null, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
        select: { priceAtBooking: true },
      }),
      prisma.appointment.findMany({
        where: { startTime: { gte: weekStart }, deletedAt: null, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
        select: { priceAtBooking: true },
      }),
      prisma.appointment.findMany({
        where: { startTime: { gte: monthStart }, deletedAt: null, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
        select: { priceAtBooking: true },
      }),
      prisma.user.count({ where: { createdAt: { gte: weekStart }, deletedAt: null } }),
      prisma.user.count({ where: { role: 'CLIENT', createdAt: { gte: weekStart }, deletedAt: null } }),
      prisma.appointment.groupBy({
        by: ['serviceId'],
        where: { deletedAt: null, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1,
      }),
    ]);

    const todayRevenue = todayAppts.reduce((s, a) => s + Number(a.priceAtBooking), 0);
    const weekRevenue = weekAppts.reduce((s, a) => s + Number(a.priceAtBooking), 0);
    const monthRevenue = monthAppts.reduce((s, a) => s + Number(a.priceAtBooking), 0);
    const monthCount = monthAppts.length;
    const avgCheck = monthCount > 0 ? monthRevenue / monthCount : 0;

    let popularServiceName: string | null = null;
    if (popularService.length > 0) {
      const svc = await prisma.service.findUnique({ where: { id: popularService[0]!.serviceId }, select: { name: true } });
      popularServiceName = svc?.name ?? null;
    }

    return {
      totalBarbers,
      totalClients,
      totalAppointments,
      totalRevenue: Number(totalRevenue._sum.priceAtBooking ?? 0),
      todayRevenue,
      weekRevenue,
      monthRevenue,
      weekAppointments: weekAppts.length,
      monthAppointments: monthCount,
      newUsers,
      newClients,
      avgCheck: Math.round(avgCheck),
      popularService: popularServiceName,
    };
  }),
});
