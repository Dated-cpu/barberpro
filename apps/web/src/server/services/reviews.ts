import prisma from '../db/client';

export const reviewService = {
  async list(opts: { status?: string; limit?: number; cursor?: string; barberId?: string }) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (opts.status && opts.status !== 'ALL') where.status = opts.status;
    if (opts.barberId) {
      where.appointment = { barberId: opts.barberId };
    }

    const reviews = await prisma.review.findMany({
      where,
      take: (opts.limit ?? 20) + 1,
      ...(opts.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, avatar: { select: { url: true } } } },
        appointment: {
          select: {
            id: true,
            startTime: true,
            service: { select: { name: true } },
            barber: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        moderator: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const hasMore = reviews.length > (opts.limit ?? 20);
    const items = hasMore ? reviews.slice(0, opts.limit ?? 20) : reviews;

    return {
      items: items.map((r) => ({
        id: r.id,
        rating: r.rating,
        text: r.text,
        status: r.status,
        clientName: `${r.client.firstName} ${r.client.lastName}`,
        clientAvatar: r.client.avatar?.url ?? null,
        serviceName: r.appointment.service.name,
        barberName: `${r.appointment.barber.firstName} ${r.appointment.barber.lastName}`,
        appointmentDate: r.appointment.startTime,
        moderatedAt: r.moderatedAt,
        moderatorName: r.moderator ? `${r.moderator.firstName} ${r.moderator.lastName}` : null,
        createdAt: r.createdAt,
      })),
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  },

  async moderate(reviewId: string, status: 'APPROVED' | 'REJECTED', moderatorId: string) {
    return prisma.review.update({
      where: { id: reviewId, deletedAt: null },
      data: {
        status,
        moderatedAt: new Date(),
        moderatedById: moderatorId,
      },
    });
  },

  async getStats(barberId?: string) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (barberId) where.appointment = { barberId };

    const [total, pending, approved, rejected] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.count({ where: { ...where, status: 'PENDING' } }),
      prisma.review.count({ where: { ...where, status: 'APPROVED' } }),
      prisma.review.count({ where: { ...where, status: 'REJECTED' } }),
    ]);

    const avgResult = await prisma.review.aggregate({
      where: { ...where, status: 'APPROVED' },
      _avg: { rating: true },
    });

    return {
      total,
      pending,
      approved,
      rejected,
      averageRating: avgResult._avg.rating ?? 0,
    };
  },
};
