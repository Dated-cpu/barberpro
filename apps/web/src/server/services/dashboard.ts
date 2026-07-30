import prisma from '../db/client';

export const dashboardService = {
  async getTodayStats(barberId: string, date: Date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        barberId,
        startTime: { gte: dayStart, lte: dayEnd },
        deletedAt: null,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
        service: { select: { name: true, price: true, duration: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    const totalRevenue = appointments
      .filter((a) => a.status !== 'CANCELLED')
      .reduce((sum, a) => sum + Number(a.priceAtBooking), 0);

    const totalDuration = appointments.reduce((sum, a) => sum + a.durationAtBooking, 0);

    const nextAppointment = appointments.find((a) => a.status === 'PENDING' || a.status === 'CONFIRMED') ?? null;

    return {
      totalAppointments: appointments.length,
      totalRevenue,
      totalDuration,
      loadPercent: totalDuration > 0 ? Math.min((totalDuration / 480) * 100, 100) : 0,
      nextAppointment: nextAppointment
        ? {
            id: nextAppointment.id,
            clientName: `${nextAppointment.client.firstName} ${nextAppointment.client.lastName}`,
            serviceName: nextAppointment.service.name,
            startTime: nextAppointment.startTime,
            status: nextAppointment.status,
          }
        : null,
      appointments: appointments.map((a) => ({
        id: a.id,
        clientName: `${a.client.firstName} ${a.client.lastName}`,
        clientPhone: a.client.phone,
        serviceName: a.service.name,
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
        price: Number(a.priceAtBooking),
      })),
    };
  },

  async getDashboardOverview(barberId: string) {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const [
      todayStats,
      monthAppointments,
      totalClients,
      tomorrowAppointments,
      newReviews,
    ] = await Promise.all([
      this.getTodayStats(barberId, now),
      prisma.appointment.findMany({
        where: {
          barberId,
          startTime: { gte: monthAgo },
          deletedAt: null,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
        select: { priceAtBooking: true, status: true, startTime: true },
      }),
      prisma.appointment.groupBy({
        by: ['clientId'],
        where: { barberId, deletedAt: null },
        _count: { clientId: true },
      }),
      prisma.appointment.count({
        where: {
          barberId,
          startTime: { gte: tomorrowStart, lte: tomorrowEnd },
          deletedAt: null,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
      }),
      prisma.review.count({
        where: {
          appointment: { barberId },
          createdAt: { gte: weekAgo },
          deletedAt: null,
        },
      }),
    ]);

    const weekMonthAppointments = monthAppointments.filter((a) => a.startTime >= weekAgo);
    const weeklyRevenue = weekMonthAppointments.reduce((s, a) => s + Number(a.priceAtBooking), 0);
    const weeklyCompleted = weekMonthAppointments.filter((a) => a.status === 'COMPLETED').length;
    const monthlyAppts = monthAppointments.length;
    const avgCheck = monthlyAppts > 0
      ? monthAppointments.reduce((s, a) => s + Number(a.priceAtBooking), 0) / monthlyAppts
      : 0;

    return {
      today: todayStats,
      weeklyCompleted,
      totalUniqueClients: totalClients.length,
      weeklyRevenue,
      avgCheck: Math.round(avgCheck),
      tomorrowAppointments,
      newReviews,
    };
  },

  async getCalendarAppointments(barberId: string, startDate: Date, endDate: Date) {
    const appointments = await prisma.appointment.findMany({
      where: {
        barberId,
        startTime: { gte: startDate, lte: endDate },
        deletedAt: null,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
        service: { select: { name: true, duration: true, price: true } },
      },
      orderBy: { startTime: 'asc' },
    });
    return appointments;
  },

  async getAnalytics(barberId: string, from: Date, to: Date) {
    const appointments = await prisma.appointment.findMany({
      where: {
        barberId,
        startTime: { gte: from, lte: to },
        deletedAt: null,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      include: { service: { select: { name: true, category: true } } },
      orderBy: { startTime: 'asc' },
    });

    const totalRevenue = appointments.reduce((sum, a) => sum + Number(a.priceAtBooking), 0);
    const totalAppointments = appointments.length;
    const avgRevenue = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

    const categoryStats = appointments.reduce(
      (acc, a) => {
        const cat = a.service.category ?? 'other';
        if (!acc[cat]) acc[cat] = { count: 0, revenue: 0 };
        acc[cat].count++;
        acc[cat].revenue += Number(a.priceAtBooking);
        return acc;
      },
      {} as Record<string, { count: number; revenue: number }>,
    );

    const dailyStats = appointments.reduce(
      (acc, a) => {
        const day = a.startTime.toISOString().slice(0, 10);
        if (!acc[day]) acc[day] = { count: 0, revenue: 0 };
        acc[day].count++;
        acc[day].revenue += Number(a.priceAtBooking);
        return acc;
      },
      {} as Record<string, { count: number; revenue: number }>,
    );

    return {
      totalRevenue,
      totalAppointments,
      avgRevenue,
      categoryStats,
      dailyStats,
      period: { from, to },
    };
  },
};
