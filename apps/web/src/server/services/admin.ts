import prisma from '../db/client';

export const adminService = {
  async listBarbers(search?: string, limit = 50, cursor?: string) {
    const where: Record<string, unknown> = {
      role: 'BARBER',
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { barberAppointments: true } },
        branchAssignments: { include: { branch: { select: { id: true, name: true } } }, take: 1 },
        avatar: { select: { url: true } },
      },
    });

    const hasMore = users.length > limit;
    const items = hasMore ? users.slice(0, limit) : users;

    return {
      items: items.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        isActive: u.isActive,
        avatarUrl: u.avatar?.url ?? null,
        totalAppointments: u._count.barberAppointments,
        branchName: u.branchAssignments[0]?.branch?.name ?? null,
        createdAt: u.createdAt,
      })),
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  },

  async getBarberById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
        avatar: { select: { url: true } },
        branchAssignments: { include: { branch: { select: { id: true, name: true } } } },
        _count: { select: { barberAppointments: true } },
      },
    });
    if (!user) return null;

    const [reviews, uniqueClients] = await Promise.all([
      prisma.review.aggregate({
        where: { appointment: { barberId: id }, status: 'APPROVED', deletedAt: null },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.appointment.groupBy({
        by: ['clientId'],
        where: { barberId: id, deletedAt: null },
        _count: { clientId: true },
      }),
    ]);

    return {
      ...user,
      averageRating: reviews._avg.rating ?? 0,
      totalReviews: reviews._count,
      totalClients: uniqueClients.length,
    };
  },

  async updateBarber(id: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
    role?: string;
  }) {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.role !== undefined && { role: data.role as any }),
      },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, isActive: true },
    });
  },

  async listBranches(search?: string) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }
    return prisma.branch.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { staff: true, appointments: true } },
      },
    });
  },

  async createBranch(data: { name: string; slug: string; address?: string; phone?: string; email?: string; timezone?: string }) {
    return prisma.branch.create({ data });
  },

  async updateBranch(id: string, data: { name?: string; slug?: string; address?: string; phone?: string; email?: string; timezone?: string; isActive?: boolean }) {
    return prisma.branch.update({ where: { id }, data });
  },

  async deleteBranch(id: string) {
    return prisma.branch.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  async listAllAppointments(opts: { status?: string; barberId?: string; branchId?: string; limit?: number; cursor?: string; from?: Date; to?: Date }) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (opts.status && opts.status !== 'ALL') where.status = opts.status;
    if (opts.barberId) where.barberId = opts.barberId;
    if (opts.branchId) where.branchId = opts.branchId;
    if (opts.from && opts.to) {
      where.startTime = { gte: opts.from, lte: opts.to };
    } else if (opts.from) {
      where.startTime = { gte: opts.from };
    } else if (opts.to) {
      where.startTime = { lte: opts.to };
    }

    const limit = opts.limit ?? 30;
    const appointments = await prisma.appointment.findMany({
      where,
      take: limit + 1,
      ...(opts.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
      orderBy: { startTime: 'desc' },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
        barber: { select: { id: true, firstName: true, lastName: true } },
        service: { select: { id: true, name: true, price: true, duration: true } },
      },
    });

    const hasMore = appointments.length > limit;
    const items = hasMore ? appointments.slice(0, limit) : appointments;

    return {
      items: items.map((a) => ({
        id: a.id,
        clientName: `${a.client.firstName} ${a.client.lastName}`,
        clientPhone: a.client.phone,
        barberName: `${a.barber.firstName} ${a.barber.lastName}`,
        serviceName: a.service.name,
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
        price: Number(a.priceAtBooking),
        source: a.source,
        createdAt: a.createdAt,
      })),
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  },

  async getAuditLogs(opts: { action?: string; entityType?: string; limit?: number; cursor?: string; from?: Date; to?: Date }) {
    const where: Record<string, unknown> = {};
    if (opts.action) where.action = opts.action;
    if (opts.entityType) where.entityType = opts.entityType;
    if (opts.from && opts.to) {
      where.createdAt = { gte: opts.from, lte: opts.to };
    } else if (opts.from) {
      where.createdAt = { gte: opts.from };
    } else if (opts.to) {
      where.createdAt = { lte: opts.to };
    }

    const limit = opts.limit ?? 50;
    const logs = await prisma.auditLog.findMany({
      where,
      take: limit + 1,
      ...(opts.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const hasMore = logs.length > limit;
    const items = hasMore ? logs.slice(0, limit) : logs;

    return {
      items: items.map((l) => ({
        id: l.id,
        actorName: l.actor ? `${l.actor.firstName} ${l.actor.lastName}` : null,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        oldValue: l.oldValue,
        newValue: l.newValue,
        ip: l.ip,
        createdAt: l.createdAt,
      })),
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  },

  async listAllClients(search?: string, limit = 50, cursor?: string) {
    const where: Record<string, unknown> = {
      role: 'CLIENT',
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { clientAppointments: true } },
      },
    });

    const hasMore = users.length > limit;
    const items = hasMore ? users.slice(0, limit) : users;

    return {
      items: items.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        isActive: u.isActive,
        totalVisits: u._count.clientAppointments,
        createdAt: u.createdAt,
      })),
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  },

  async listAllUsers(search?: string, role?: string, limit = 50, cursor?: string) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, firstName: true, lastName: true, email: true, phone: true,
        role: true, isActive: true, lastLogin: true, createdAt: true,
      },
    });

    const hasMore = users.length > limit;
    const items = hasMore ? users.slice(0, limit) : users;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
    };
  },

  async updateUser(id: string, data: { firstName?: string; lastName?: string; email?: string; phone?: string; isActive?: boolean; role?: string }) {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.role !== undefined && { role: data.role as any }),
      },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, isActive: true },
    });
  },

  async listAuditEntityTypes() {
    const result = await prisma.auditLog.findMany({
      distinct: ['entityType'],
      select: { entityType: true },
      where: { entityType: { not: null as any } },
    });
    return result.map((r) => r.entityType).filter(Boolean);
  },

  async deleteUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, deletedAt: true },
    });
  },
};
