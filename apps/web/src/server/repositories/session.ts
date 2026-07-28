import type { TxClient } from '../db/helpers';

export const sessionRepository = {
  async create(
    tx: TxClient,
    data: {
      userId: string;
      device?: string;
      ip?: string;
      userAgent?: string;
      refreshTokenId: string;
      expiresAt: Date;
    },
  ) {
    return tx.session.create({ data });
  },

  async findByUserId(tx: TxClient, userId: string) {
    return tx.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { lastActiveAt: 'desc' },
    });
  },

  async revoke(tx: TxClient, id: string) {
    return tx.session.update({
      where: { id },
      data: { expiresAt: new Date() },
    });
  },

  async revokeAllByUserId(tx: TxClient, userId: string) {
    return tx.session.updateMany({
      where: { userId, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    });
  },

  async updateActivity(tx: TxClient, id: string) {
    return tx.session.update({
      where: { id },
      data: { lastActiveAt: new Date() },
    });
  },
};
