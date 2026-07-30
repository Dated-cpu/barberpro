import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, adminProcedure } from '../trpc';
import prisma from '@/server/db/client';
import { Permission, hasPermission } from '@/server/auth/permissions';
import { AuditEvent } from '@/server/security/audit/events';

export const auditRouter = router({
  list: adminProcedure
    .input(z.object({
      cursor: z.string().uuid().optional(),
      limit: z.coerce.number().int().min(1).max(100).default(30),
      userId: z.string().uuid().optional(),
      action: z.string().max(100).optional(),
      entityType: z.string().max(50).optional(),
      dateFrom: z.string().datetime({ offset: true }).optional(),
      dateTo: z.string().datetime({ offset: true }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!hasPermission(ctx.user.role, Permission.AUDIT_VIEW)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Audit access required' });
      }

      const where: Record<string, unknown> = {};
      if (input.userId) where.actorId = input.userId;
      if (input.action) where.action = input.action;
      if (input.entityType) where.entityType = input.entityType;
      if (input.dateFrom || input.dateTo) {
        const createdAt: Record<string, Date> = {};
        if (input.dateFrom) createdAt.gte = new Date(input.dateFrom);
        if (input.dateTo) createdAt.lte = new Date(input.dateTo);
        where.createdAt = createdAt;
      }

      const limit = input.limit;
      const items = await prisma.auditLog.findMany({
        where,
        take: limit + 1,
        ...(input.cursor ? { skip: 1, cursor: { id: input.cursor } } : {}),
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
      });

      const hasMore = items.length > limit;
      const data = hasMore ? items.slice(0, limit) : items;

      return {
        items: data.map((e) => ({
          id: e.id,
          actorId: e.actorId,
          actorName: e.actor ? `${e.actor.firstName} ${e.actor.lastName}` : null,
          action: e.action,
          entityType: e.entityType,
          entityId: e.entityId,
          ip: e.ip,
          userAgent: e.userAgent,
          metadata: e.metadata,
          createdAt: e.createdAt,
        })),
        nextCursor: hasMore ? data[data.length - 1]?.id ?? null : null,
      };
    }),

  securityEvents: adminProcedure
    .query(async ({ ctx }) => {
      if (!hasPermission(ctx.user.role, Permission.AUDIT_VIEW)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Audit access required' });
      }

      const securityActions = [
        AuditEvent.LOGIN_FAILED,
        AuditEvent.TOKEN_REUSE_DETECTED,
        AuditEvent.PASSWORD_CHANGED,
        AuditEvent.PASSWORD_RESET,
        AuditEvent.ROLE_CHANGED,
      ];

      const items = await prisma.auditLog.findMany({
        where: { action: { in: securityActions } },
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
      });

      return items.map((e) => ({
        id: e.id,
        actorId: e.actorId,
        actorName: e.actor ? `${e.actor.firstName} ${e.actor.lastName}` : null,
        action: e.action,
        entityType: e.entityType,
        entityId: e.entityId,
        ip: e.ip,
        metadata: e.metadata,
        createdAt: e.createdAt,
      }));
    }),
});
