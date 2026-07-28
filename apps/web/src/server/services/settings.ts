import prisma from '../db/client';

export const settingsService = {
  async getWorkingDays(barberId: string) {
    return prisma.workingDay.findMany({
      where: { barberId, date: null },
      orderBy: { dayOfWeek: 'asc' },
    });
  },

  async upsertWorkingDay(barberId: string, data: {
    id?: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    breakStart?: string | null;
    breakEnd?: string | null;
    isDayOff: boolean;
  }) {
    if (data.id) {
      return prisma.workingDay.update({
        where: { id: data.id },
        data: {
          startTime: data.startTime,
          endTime: data.endTime,
          breakStart: data.breakStart ?? null,
          breakEnd: data.breakEnd ?? null,
          isDayOff: data.isDayOff,
        },
      });
    }

    return prisma.workingDay.create({
      data: {
        barberId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        breakStart: data.breakStart ?? null,
        breakEnd: data.breakEnd ?? null,
        isDayOff: data.isDayOff,
      },
    });
  },

  async getBlockedSlots(barberId: string, from?: Date, to?: Date) {
    const where: Record<string, unknown> = { barberId, deletedAt: null };
    if (from && to) {
      where.startTime = { gte: from };
      where.endTime = { lte: to };
    }
    return prisma.blockedSlot.findMany({ where, orderBy: { startTime: 'asc' } });
  },

  async createBlockedSlot(barberId: string, data: { startTime: Date; endTime: Date; reason?: string | null }) {
    return prisma.blockedSlot.create({
      data: {
        barberId,
        startTime: data.startTime,
        endTime: data.endTime,
        reason: data.reason ?? null,
      },
    });
  },

  async deleteBlockedSlot(id: string) {
    return prisma.blockedSlot.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; avatarId?: string | null }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, firstName: true, lastName: true, phone: true, email: true },
    });
  },

  async getSystemSettings() {
    return prisma.setting.findMany({
      where: { scopeId: 'system' },
      orderBy: { key: 'asc' },
    });
  },

  async upsertSystemSetting(data: { key: string; value: unknown; type: string; description?: string | null }) {
    return prisma.setting.upsert({
      where: { scopeId_key: { scopeId: 'system', key: data.key } },
      update: { value: data.value as any, type: data.type, description: data.description ?? null },
      create: { scopeId: 'system', key: data.key, value: data.value as any, type: data.type, description: data.description ?? null },
    });
  },
};
