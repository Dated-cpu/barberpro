import prisma from '../db/client';
import type { Prisma } from '@prisma/client';

export const customerService = {
  async list(barberId: string, search?: string, limit = 20, cursor?: string) {
    const where: Prisma.UserWhereInput = {
      role: 'CLIENT',
      isActive: true,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            clientAppointments: { where: { barberId, deletedAt: null } },
          },
        },
      },
    });

    const hasMore = users.length > limit;
    const items = hasMore ? users.slice(0, limit) : users;

    return {
      items: items.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        email: u.email,
        totalVisits: u._count.clientAppointments,
        lastVisit: null as Date | null,
      })),
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  },

  async getById(barberId: string, clientId: string) {
    const user = await prisma.user.findUnique({
      where: { id: clientId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) return null;

    const appointments = await prisma.appointment.findMany({
      where: {
        clientId,
        barberId,
        deletedAt: null,
      },
      include: {
        service: { select: { name: true, category: true } },
      },
      orderBy: { startTime: 'desc' },
      take: 50,
    });

    const totalVisits = appointments.length;
    const totalSpent = appointments.reduce((sum, a) => sum + Number(a.priceAtBooking), 0);
    const serviceCounts: Record<string, number> = {};
    for (const a of appointments) {
      serviceCounts[a.service.name] = (serviceCounts[a.service.name] ?? 0) + 1;
    }
    const sorted = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]);
    const favoriteService = sorted.length > 0 ? sorted[0]![0] : null;

    const lastVisit = appointments.find((a) => a.status === 'COMPLETED')?.startTime ?? null;

    return {
      ...user,
      totalVisits,
      totalSpent,
      favoriteService,
      lastVisit,
      appointments: appointments.map((a) => ({
        id: a.id,
        serviceName: a.service.name,
        startTime: a.startTime,
        status: a.status,
        price: Number(a.priceAtBooking),
      })),
    };
  },
};
