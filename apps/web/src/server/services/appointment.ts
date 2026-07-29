import { TRPCError } from '@trpc/server';
import { transaction } from '../db/helpers';
import prisma from '../db/client';
import { appointmentRepository } from '../repositories/appointment';
import { serviceRepository } from '../repositories/service';
import { dispatchEvent, EventTypes } from '../lib/events';
import logger from '../lib/logger';
import { NotFoundError, ConflictError } from '../lib/errors';

import type { CreateAppointmentInput } from '@/validators/booking';

export const appointmentService = {
  async create(input: CreateAppointmentInput & { clientId: string }) {
    return prisma.$transaction(async (tx) => {
      const service = await serviceRepository.findById(tx, input.serviceId);
      if (!service) throw new NotFoundError('Service');

      const barber = await tx.user.findUnique({
        where: { id: input.barberId, deletedAt: null, role: 'BARBER', isActive: true },
        include: { branchAssignments: { include: { branch: true }, take: 1 } },
      });
      if (!barber) throw new NotFoundError('Barber');

      const branch = barber.branchAssignments[0]?.branch;

      const startTime = new Date(input.startTime);
      const endTime = new Date(startTime.getTime() + service.duration * 60 * 1000);

      const overlapCount = await appointmentRepository.findOverlappingCount(tx, input.barberId, startTime, endTime);
      if (overlapCount > 0) {
        throw new ConflictError('Это время уже занято');
      }

      const blockedSlots = await tx.blockedSlot.findMany({
        where: {
          barberId: input.barberId,
          deletedAt: null,
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
          ],
        },
      });
      if (blockedSlots.length > 0) {
        throw new ConflictError('Барбер не работает в это время');
      }

      const appointment = await appointmentRepository.create(tx, {
        clientId: input.clientId,
        barberId: input.barberId,
        serviceId: input.serviceId,
        branchId: branch?.id ?? null,
        startTime,
        endTime,
        priceAtBooking: service.price,
        durationAtBooking: service.duration,
        source: 'WEBSITE',
        clientNotes: input.clientNotes ?? null,
      });

      await dispatchEvent(tx, {
        eventType: EventTypes.APPOINTMENT_CREATED,
        aggregateType: 'Appointment',
        aggregateId: appointment.id,
        payload: {
          appointmentId: appointment.id,
          clientId: input.clientId,
          barberId: input.barberId,
          serviceId: input.serviceId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });

      logger.info('Appointment created', { appointmentId: appointment.id, barberId: input.barberId });

      return appointment;
    }, { isolationLevel: 'Serializable' });
  },

  async confirm(appointmentId: string) {
    return transaction(async (tx) => {
      const appointment = await appointmentRepository.findById(tx, appointmentId);
      if (!appointment) throw new NotFoundError('Appointment');
      if (appointment.status !== 'PENDING') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Можно подтвердить только ожидающую запись' });
      }

      const updated = await appointmentRepository.updateStatus(tx, appointmentId, 'CONFIRMED');

      await dispatchEvent(tx, {
        eventType: EventTypes.APPOINTMENT_CONFIRMED,
        aggregateType: 'Appointment',
        aggregateId: appointmentId,
        payload: { appointmentId },
      });

      logger.info('Appointment confirmed', { appointmentId });
      return updated;
    });
  },

  async cancel(appointmentId: string, userId: string, userRole: string, reason?: string) {
    return transaction(async (tx) => {
      const appointment = await appointmentRepository.findById(tx, appointmentId);
      if (!appointment) throw new NotFoundError('Appointment');

      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'BARBER') {
        if (appointment.clientId !== userId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Вы можете отменить только свою запись' });
        }
      }

      if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Запись уже отменена или завершена' });
      }

      let cancelledBy = 'client';
      if (userRole === 'BARBER') cancelledBy = 'barber';
      if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') cancelledBy = 'admin';

      const updated = await appointmentRepository.updateStatus(tx, appointmentId, 'CANCELLED', {
        cancelledAt: new Date(),
        cancelReason: reason ?? undefined,
        cancelledBy,
      });

      await dispatchEvent(tx, {
        eventType: EventTypes.APPOINTMENT_CANCELLED,
        aggregateType: 'Appointment',
        aggregateId: appointmentId,
        payload: { appointmentId, cancelledBy, reason: reason ?? null },
      });

      logger.info('Appointment cancelled', { appointmentId, cancelledBy });
      return updated;
    });
  },

  async complete(appointmentId: string, notes?: string) {
    return transaction(async (tx) => {
      const appointment = await appointmentRepository.findById(tx, appointmentId);
      if (!appointment) throw new NotFoundError('Appointment');

      if (appointment.status !== 'CONFIRMED' && appointment.status !== 'IN_PROGRESS') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Можно завершить только подтверждённую запись' });
      }

      const updated = await appointmentRepository.updateStatus(tx, appointmentId, 'COMPLETED', { notes: notes ?? undefined });

      await dispatchEvent(tx, {
        eventType: EventTypes.APPOINTMENT_COMPLETED,
        aggregateType: 'Appointment',
        aggregateId: appointmentId,
        payload: { appointmentId },
      });

      logger.info('Appointment completed', { appointmentId });
      return updated;
    });
  },

  async markNoShow(appointmentId: string) {
    return transaction(async (tx) => {
      const appointment = await appointmentRepository.findById(tx, appointmentId);
      if (!appointment) throw new NotFoundError('Appointment');

      if (appointment.status !== 'CONFIRMED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Можно отметить только подтверждённую запись' });
      }

      const updated = await appointmentRepository.updateStatus(tx, appointmentId, 'NO_SHOW');

      logger.info('Appointment marked no-show', { appointmentId });
      return updated;
    });
  },

  async getById(appointmentId: string) {
    return transaction(async (tx) => {
      const appointment = await appointmentRepository.findById(tx, appointmentId);
      if (!appointment) throw new NotFoundError('Appointment');
      return appointment;
    });
  },

  async getMyAppointments(clientId: string, opts?: { limit?: number; cursor?: string }) {
    return transaction(async (tx) => {
      return appointmentRepository.findByClient(tx, clientId, opts);
    });
  },

  async getMyUpcoming(clientId: string) {
    return transaction(async (tx) => {
      return appointmentRepository.findUpcomingByClient(tx, clientId);
    });
  },

  async getMyHistory(clientId: string, opts?: { limit?: number; cursor?: string }) {
    return transaction(async (tx) => {
      return appointmentRepository.findHistoryByClient(tx, clientId, opts);
    });
  },

  async updateStatus(appointmentId: string, status: string, notes?: string) {
    return transaction(async (tx) => {
      const appointment = await appointmentRepository.findById(tx, appointmentId);
      if (!appointment) throw new NotFoundError('Appointment');

      const data: Record<string, unknown> = {};
      if (status === 'CANCELLED') { data.cancelledAt = new Date(); data.cancelledBy = 'barber'; }
      if (notes !== undefined) data.notes = notes;

      const updated = await appointmentRepository.updateStatus(tx, appointmentId, status as any, data);
      return updated;
    });
  },

  async reschedule(appointmentId: string, startTime: Date) {
    return transaction(async (tx) => {
      const appointment = await appointmentRepository.findById(tx, appointmentId);
      if (!appointment) throw new NotFoundError('Appointment');

      const service = await serviceRepository.findById(tx, appointment.serviceId);
      if (!service) throw new NotFoundError('Service');

      const endTime = new Date(startTime.getTime() + (appointment.durationAtBooking ?? service.duration) * 60 * 1000);

      const overlapCount = await appointmentRepository.findOverlappingCount(tx, appointment.barberId, startTime, endTime, appointmentId);
      if (overlapCount > 0) {
        throw new ConflictError('Это время уже занято');
      }

      return tx.appointment.update({
        where: { id: appointmentId },
        data: { startTime, endTime },
      });
    });
  },
};
