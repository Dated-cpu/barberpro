import type { TxClient } from '../db/helpers';

export const serviceRepository = {
  async findById(tx: TxClient, id: string) {
    return tx.service.findUnique({ where: { id, deletedAt: null, isActive: true } });
  },

  async findActiveByBranch(tx: TxClient, branchId: string | null) {
    return tx.service.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(branchId ? { branchId } : { branchId: null }),
      },
      orderBy: { sortOrder: 'asc' },
    });
  },

  async findActive(tx: TxClient) {
    return tx.service.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  },
};
