import { TRPCError } from '@trpc/server';
import prisma from '../db/client';
import { getStorageAdapter } from '../lib/storage';
import { transaction } from '../db/helpers';
import crypto from 'crypto';

export const mediaService = {
  async upload(file: { buffer: Buffer; originalname: string; mimetype: string; size: number }, uploadedById: string) {
    const storage = getStorageAdapter();
    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    const existing = await prisma.media.findFirst({ where: { hash, deletedAt: null } });
    if (existing) return existing;

    const result = await storage.upload(file.originalname, file.buffer, file.mimetype);

    return transaction(async (tx) => {
      return tx.media.create({
        data: {
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          provider: 'LOCAL',
          key: result.key,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl ?? null,
          hash,
          uploadedById,
        },
      });
    });
  },

  async delete(mediaId: string, userId: string) {
    const media = await prisma.media.findUnique({ where: { id: mediaId, deletedAt: null } });
    if (!media) return;

    if (media.uploadedById && media.uploadedById !== userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }
    }

    const storage = getStorageAdapter();
    await storage.delete(media.key);

    await prisma.media.update({
      where: { id: mediaId },
      data: { deletedAt: new Date() },
    });
  },

  async getById(mediaId: string) {
    return prisma.media.findUnique({ where: { id: mediaId, deletedAt: null } });
  },

  async listByUploader(uploadedById: string) {
    return prisma.media.findMany({
      where: { uploadedById, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },
};
