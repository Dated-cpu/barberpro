import type { TxClient } from '../db/helpers';

export const workingDayRepository = {
  async findByBarberAndDate(tx: TxClient, barberId: string, date: Date) {
    return tx.workingDay.findUnique({
      where: { barberId_date: { barberId, date } },
    });
  },

  async findTemplateByDayOfWeek(tx: TxClient, barberId: string, dayOfWeek: number) {
    return tx.workingDay.findUnique({
      where: { barberId_dayOfWeek: { barberId, dayOfWeek } },
    });
  },

  async findTemplatesByBarber(tx: TxClient, barberId: string) {
    return tx.workingDay.findMany({
      where: { barberId, date: null, isDayOff: false },
      orderBy: { dayOfWeek: 'asc' },
    });
  },

  async findByBarberAndDateRange(tx: TxClient, barberId: string, startDate: Date, endDate: Date) {
    return tx.workingDay.findMany({
      where: {
        barberId,
        date: { gte: startDate, lte: endDate },
      },
    });
  },
};
