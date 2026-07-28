import type { TxClient } from '../db/helpers';
import { Prisma } from '@prisma/client';

export const auditService = {
  async log(
    tx: TxClient,
    data: {
      actorId?: string;
      action: string;
      entityType: string;
      entityId?: string;
      oldValue?: Record<string, unknown>;
      newValue?: Record<string, unknown>;
      ip?: string;
      userAgent?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    return tx.auditLog.create({
      data: {
        actorId: data.actorId ?? null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        oldValue: (data.oldValue ?? Prisma.DbNull) as Prisma.InputJsonValue,
        newValue: (data.newValue ?? Prisma.DbNull) as Prisma.InputJsonValue,
        ip: data.ip ?? null,
        userAgent: data.userAgent ?? null,
        metadata: (data.metadata ?? Prisma.DbNull) as Prisma.InputJsonValue,
      },
    });
  },
};
