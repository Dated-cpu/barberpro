import type { TxClient } from '../db/helpers';

export const tokenRepository = {
  async create(
    tx: TxClient,
    data: { userId: string; tokenHash: string; family: string; expiresAt: Date },
  ) {
    return tx.refreshToken.create({ data });
  },

  async findByHash(tx: TxClient, tokenHash: string) {
    return tx.refreshToken.findUnique({ where: { tokenHash } });
  },

  async revoke(tx: TxClient, id: string) {
    return tx.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },

  async revokeAllByUserId(tx: TxClient, userId: string) {
    return tx.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async revokeFamily(tx: TxClient, family: string) {
    return tx.refreshToken.updateMany({
      where: { family, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async deleteExpired(tx: TxClient) {
    return tx.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },
};
