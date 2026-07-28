import type { TxClient } from '../db/helpers';
import type { RegisterInput } from '@/validators/auth';

export const userRepository = {
  async findById(tx: TxClient, id: string) {
    return tx.user.findUnique({ where: { id, deletedAt: null } });
  },

  async findByEmail(tx: TxClient, email: string) {
    return tx.user.findUnique({ where: { email, deletedAt: null } });
  },

  async findByPhone(tx: TxClient, phone: string) {
    return tx.user.findUnique({ where: { phone, deletedAt: null } });
  },

  async findByLogin(tx: TxClient, login: string) {
    return tx.user.findFirst({
      where: {
        OR: [{ email: login }, { phone: login }],
        deletedAt: null,
      },
    });
  },

  async create(tx: TxClient, data: RegisterInput & { passwordHash: string }) {
    return tx.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ?? null,
        phone: data.phone,
        passwordHash: data.passwordHash,
        role: 'CLIENT',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  },

  async updateLastLogin(tx: TxClient, id: string) {
    return tx.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  },

  async update(tx: TxClient, id: string, data: Record<string, unknown>) {
    return tx.user.update({
      where: { id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        avatarId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async updatePassword(tx: TxClient, id: string, passwordHash: string) {
    return tx.user.update({
      where: { id },
      data: { passwordHash, resetPasswordToken: null, resetPasswordExpiresAt: null },
    });
  },

  async findByVerificationToken(tx: TxClient, tokenHash: string) {
    return tx.user.findFirst({
      where: { verificationToken: tokenHash, verificationTokenExpiresAt: { gt: new Date() }, deletedAt: null },
    });
  },

  async findByResetToken(tx: TxClient, tokenHash: string) {
    return tx.user.findFirst({
      where: { resetPasswordToken: tokenHash, resetPasswordExpiresAt: { gt: new Date() }, deletedAt: null },
    });
  },

  async listByRole(tx: TxClient, role: string, opts?: { limit?: number; cursor?: string }) {
    return tx.user.findMany({
      where: { role: role as 'ADMIN' | 'BARBER' | 'CLIENT', isActive: true, deletedAt: null },
      take: opts?.limit ?? 20,
      ...(opts?.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
      orderBy: { createdAt: 'desc' },
    });
  },
};
