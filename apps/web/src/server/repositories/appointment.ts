import type { TxClient } from '../db/helpers';
import type { AppointmentStatus } from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/library';

export interface CreateAppointmentData {
  clientId: string;
  barberId: string;
  serviceId: string;
  branchId: string | null;
  startTime: Date;
  endTime: Date;
  priceAtBooking: Decimal;
  durationAtBooking: number;
  source: string;
  clientNotes?: string | null;
}

const defaultSelect = {
  id: true,
  clientId: true,
  barberId: true,
  serviceId: true,
  branchId: true,
  startTime: true,
  endTime: true,
  status: true,
  source: true,
  notes: true,
  clientNotes: true,
  priceAtBooking: true,
  durationAtBooking: true,
  paymentStatus: true,
  cancelledAt: true,
  cancelReason: true,
  cancelledBy: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const appointmentRepository = {
  async findOverlapping(tx: TxClient, barberId: string, startTime: Date, endTime: Date) {
    return tx.appointment.findFirst({
      where: {
        barberId,
        deletedAt: null,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
      select: defaultSelect,
    });
  },

  async findOverlappingCount(tx: TxClient, barberId: string, startTime: Date, endTime: Date, excludeId?: string): Promise<number> {
    return tx.appointment.count({
      where: {
        barberId,
        deletedAt: null,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        ...(excludeId ? { id: { not: excludeId } } : {}),
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });
  },

  async findById(tx: TxClient, id: string) {
    return tx.appointment.findUnique({
      where: { id, deletedAt: null },
      select: {
        ...defaultSelect,
        client: { select: { id: true, firstName: true, lastName: true, phone: true } },
        barber: { select: { id: true, firstName: true, lastName: true } },
        service: { select: { id: true, name: true, duration: true, price: true } },
      },
    });
  },

  async create(tx: TxClient, data: CreateAppointmentData) {
    return tx.appointment.create({
      data: {
        clientId: data.clientId,
        barberId: data.barberId,
        serviceId: data.serviceId,
        branchId: data.branchId,
        startTime: data.startTime,
        endTime: data.endTime,
        priceAtBooking: data.priceAtBooking,
        durationAtBooking: data.durationAtBooking,
        source: data.source as 'WEBSITE' | 'INSTAGRAM' | 'TELEGRAM' | 'PHONE' | 'IN_PERSON' | 'WHATSAPP' | 'VK' | 'ADMIN',
        clientNotes: data.clientNotes ?? null,
      },
      select: defaultSelect,
    });
  },

  async updateStatus(
    tx: TxClient,
    id: string,
    status: AppointmentStatus,
    extra?: {
      cancelledAt?: Date;
      cancelReason?: string;
      cancelledBy?: string;
      notes?: string;
    },
  ) {
    return tx.appointment.update({
      where: { id },
      data: { status, ...extra },
      select: defaultSelect,
    });
  },

  async findByBarberAndDate(tx: TxClient, barberId: string, dateStart: Date, dateEnd: Date) {
    return tx.appointment.findMany({
      where: {
        barberId,
        deletedAt: null,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        startTime: { gte: dateStart, lt: dateEnd },
      },
      select: defaultSelect,
      orderBy: { startTime: 'asc' },
    });
  },

  async findByClient(tx: TxClient, clientId: string, opts?: { limit?: number; cursor?: string }) {
    return tx.appointment.findMany({
      where: { clientId, deletedAt: null },
      select: {
        ...defaultSelect,
        service: { select: { name: true } },
        barber: { select: { id: true, firstName: true, lastName: true } },
      },
      take: opts?.limit ?? 20,
      ...(opts?.cursor ? { skip: 1, cursor: { id: opts.cursor } } : {}),
      orderBy: { startTime: 'desc' },
    });
  },
};
