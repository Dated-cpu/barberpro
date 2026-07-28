import type { TxClient } from '../db/helpers';

export interface CreateBlockedSlotData {
  barberId: string;
  startTime: Date;
  endTime: Date;
  reason?: string | null;
  branchId?: string | null;
}

export const blockedSlotRepository = {
  async findByBarberAndTimeRange(tx: TxClient, barberId: string, startTime: Date, endTime: Date) {
    return tx.blockedSlot.findMany({
      where: {
        barberId,
        deletedAt: null,
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
      orderBy: { startTime: 'asc' },
    });
  },

  async create(tx: TxClient, data: CreateBlockedSlotData) {
    return tx.blockedSlot.create({ data: { barberId: data.barberId, startTime: data.startTime, endTime: data.endTime, reason: data.reason ?? null, branchId: data.branchId ?? null } });
  },

  async findById(tx: TxClient, id: string) {
    return tx.blockedSlot.findUnique({ where: { id, deletedAt: null } });
  },

  async softDelete(tx: TxClient, id: string) {
    return tx.blockedSlot.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
