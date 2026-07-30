import { TRPCError } from '@trpc/server';
import prisma from '../db/client';
import type { Prisma } from '@prisma/client';
import { auditService } from './audit';
import { AuditEvent } from '@/server/security/audit/events';
import { transaction } from '../db/helpers';

export const adminService = {
  async listAllAppointments(opts: { status?: string; barberId?: string; limit?: number; cursor?: string; from?: Date; to?: Date }) {
    const where: Prisma.AppointmentWhereInput = { deletedAt: null };
    if (opts.status && opts.status !== 'ALL') where.status = opts.status as Prisma.AppointmentWhereInput['status'];
    if (opts.barberId) where.barberId = opts.barberId;
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

  async addClient(data: { firstName: string; lastName: string; phone: string; email?: string | null }) {
    const existingPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existingPhone) {
      throw new TRPCError({ code: 'CONFLICT', message: 'Телефон уже используется' });
    }
    if (data.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingEmail) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Email уже используется' });
      }
    }

    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email ?? null,
        role: 'CLIENT',
        isActive: true,
      },
    });

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      createdAt: user.createdAt,
    };
  },

  async listAllClients(search?: string, limit = 50, cursor?: string) {
    const where: Prisma.UserWhereInput = {
      role: 'CLIENT',
      isActive: true,
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

  async updateUserRole(actorId: string, targetUserId: string, newRole: string) {
    return transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: targetUserId, deletedAt: null } });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      if (user.role === newRole) {
        return user;
      }

      const oldRole = user.role;
      const updated = await tx.user.update({
        where: { id: targetUserId },
        data: {
          role: newRole as Prisma.UserUpdateInput['role'],
          roleChangedAt: new Date(),
          roleChangedBy: actorId,
        },
      });

      await auditService.log(tx, {
        actorId,
        action: AuditEvent.ROLE_CHANGED,
        entityType: 'User',
        entityId: targetUserId,
        oldValue: { role: oldRole },
        newValue: { role: newRole },
      });

      return updated;
    });
  },
};
