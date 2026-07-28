import prisma from '../db/client';
import { transaction } from '../db/helpers';

export const portfolioService = {
  async listByBarber(barberId: string) {
    const portfolios = await prisma.portfolio.findMany({
      where: { barberId, deletedAt: null },
      include: {
        images: {
          include: { media: { select: { id: true, url: true, thumbnailUrl: true, alt: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return portfolios;
  },

  async create(barberId: string, data: { title: string; description?: string | null; imageIds: string[] }) {
    return transaction(async (tx) => {
      const portfolio = await tx.portfolio.create({
        data: {
          barberId,
          title: data.title,
          description: data.description ?? null,
        },
      });

      for (let i = 0; i < data.imageIds.length; i++) {
        await tx.portfolioImage.create({
          data: {
            portfolioId: portfolio.id,
            mediaId: data.imageIds[i]!,
            sortOrder: i,
          },
        });
      }

      return tx.portfolio.findUnique({
        where: { id: portfolio.id },
        include: {
          images: {
            include: { media: { select: { id: true, url: true, thumbnailUrl: true, alt: true } } },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });
  },

  async update(id: string, data: { title?: string; description?: string | null }) {
    return prisma.portfolio.update({
      where: { id, deletedAt: null },
      data,
    });
  },

  async delete(id: string) {
    return prisma.portfolio.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async addImages(portfolioId: string, imageIds: string[]) {
    return transaction(async (tx) => {
      const currentCount = await tx.portfolioImage.count({ where: { portfolioId } });
      const images = await Promise.all(
        imageIds.map((mediaId, i) =>
          tx.portfolioImage.create({
            data: { portfolioId, mediaId, sortOrder: currentCount + i },
            include: { media: { select: { id: true, url: true, thumbnailUrl: true, alt: true } } },
          }),
        ),
      );
      return images;
    });
  },

  async removeImage(imageId: string) {
    return prisma.portfolioImage.delete({ where: { id: imageId } });
  },
};
