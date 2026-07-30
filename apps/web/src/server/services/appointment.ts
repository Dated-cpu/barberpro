import { TRPCError } from '@trpc/server';
import { transaction } from '../db/helpers';
import prisma from '../db/client';
import type { AppointmentStatus } from '@prisma/client';
import { appointmentRepository } from '../repositories/appointment';
import { serviceRepository } from '../repositories/service';
import { userRepository } from '../repositories/user';
import { dispatchEvent, EventTypes } from '../lib/events';
import logger from '../lib/logger';
import { NotFoundError, ConflictError } from '../lib/errors';
import { assertAppointmentAccess, assertBarberOrAdmin } from '../auth/authorization';
import { auditService } from './audit';
import { AuditEvent } from '@/server/security/audit/events';
import type { AuthUser } from '../auth/authorization';
import type { TxClient } from '../db/helpers';
import type { CreateAppointmentInput } from '@/validators/booking';
import { Decimal } from '@prisma/client/runtime/library';

async function resolveBarberId(tx: TxClient, barberId?: string | null): Promise<string> {
  if (barberId) return barberId;
  const barber = await tx.user.findFirst({
    where: { role: 'BARBER', isActive: true, deletedAt: null },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!barber) throw new NotFoundError('Barber');
  return barber.id;
}

async function resolveGuestClientId(
  tx: TxClient,
  clientId: string | undefined | null,
  phone: string | undefined | null,
  name: string | undefined | null,
  email: string | undefined | null,
): Promise<string> {
  // Authenticated user — use their ID
  if (clientId && clientId !== 'guest') return clientId;

  // Try to find existing user by phone
  const phone_ = phone?.trim();
  if (!phone_) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Телефон обязателен для записи' });

  const existing = await userRepository.findByPhone(tx, phone_);
  if (existing) return existing.id;

  // Create a temporary CLIENT user for guest booking
  const name_ = name?.trim() || 'Гость';
  const firstName = name_.split(' ')[0] || 'Гость';
  const lastName = name_.split(' ').slice(1).join(' ') || 'Гость';

  const guest = await tx.user.create({
    data: {
      firstName,
      lastName,
      phone: phone_,
      email: email?.trim() || null,
      role: 'CLIENT',
      isActive: true,
    },
    select: { id: true },
  });

  logger.info('Guest user created for appointment', { userId: guest.id, phone: phone_ });
  return guest.id;
}

function extractServiceIds(input: CreateAppointmentInput): string[] {
  if (input.services && input.services.length > 0) return input.services;
  if (input.serviceId) return [input.serviceId];
  throw new TRPCError({ code: 'BAD_REQUEST', message: 'Укажите хотя бы одну услугу' });
}

export const appointmentService = {
  async create(input: CreateAppointmentInput & { clientId?: string }) {
    return prisma.$transaction(async (tx) => {
      const barberId = await resolveBarberId(tx, input.barberId);
      const serviceIds = extractServiceIds(input);

      const services = await Promise.all(
        serviceIds.map((sid) => serviceRepository.findById(tx, sid)),
      );
      const validServices = services.filter(Boolean);
      if (validServices.length !== serviceIds.length) {
        throw new NotFoundError('Service');
      }

      const barber = await tx.user.findUnique({
        where: { id: barberId, deletedAt: null, role: 'BARBER', isActive: true },
        include: { branchAssignments: { include: { branch: true }, take: 1 } },
      });
      if (!barber) throw new NotFoundError('Barber');

      const branch = barber.branchAssignments[0]?.branch;

      const totalDuration = validServices.reduce((sum, s) => sum + s!.duration, 0);
      const totalPrice = validServices.reduce(
        (sum, s) => sum.add(s!.price),
        new Decimal(0),
      );

      const startTime = new Date(input.startTime);
      const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000);

      const overlapCount = await appointmentRepository.findOverlappingCount(tx, barberId, startTime, endTime);
      if (overlapCount > 0) {
        throw new ConflictError('Это время уже занято');
      }

      const blockedSlots = await tx.blockedSlot.findMany({
        where: {
          barberId: barberId,
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

      const clientId = await resolveGuestClientId(tx, input.clientId, input.clientPhone, input.clientName, input.clientEmail);

      const appointmentServicesData = validServices.map((s) => ({
        serviceId: s!.id,
        priceAtBooking: s!.price,
        durationAtBooking: s!.duration,
      }));

      const appointment = await appointmentRepository.create(tx, {
        clientId,
        barberId: barberId,
        serviceId: validServices[0]!.id,
        branchId: branch?.id ?? null,
        startTime,
        endTime,
        priceAtBooking: totalPrice,
        durationAtBooking: totalDuration,
        source: 'WEBSITE',
        clientNotes: input.clientNotes ?? null,
        appointmentServices: appointmentServicesData,
      });

      await dispatchEvent(tx, {
        eventType: EventTypes.APPOINTMENT_CREATED,
        aggregateType: 'Appointment',
        aggregateId: appointment.id,
        payload: {
          appointmentId: appointment.id,
          clientId,
          barberId: barberId,
          serviceIds: validServices.map((s) => s!.id),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });

      logger.info('Appointment created', { appointmentId: appointment.id, barberId: barberId, clientId, serviceCount: validServices.length });

      return { ...appointment, clientId };
    }, { isolationLevel: 'Serializable' });
  },

  async confirm(appointmentId: string, user: AuthUser) {
    return transaction(async (tx) => {
      const appointment = await appointmentRepository.findById(tx, appointmentId);
      if (!appointment) throw new NotFoundError('Appointment');

      assertBarberOrAdmin(user, appointment.barberId);

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

      await auditService.log(tx, { actorId: user.id, action: AuditEvent.APPOINTMENT_CONFIRMED, entityType: 'Appointment', entityId: appointmentId });

      logger.info('Appointment confirmed', { appointmentId });
      return updated;
    });
  },

  async cancel(appointmentId: string, user: AuthUser, reason?: string) {
    return transaction(async (tx) => {
      const appointment = await appointmentRepository.findById(tx, appointmentId);
      if (!appointment) throw new NotFoundError('Appointment');

      // Authorization enforced here. Do not remove ownership check.
      assertAppointmentAccess(user, appointment.clientId, appointment.barberId);

      if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Запись уже отменена или завершена' });
      }

      let cancelledBy = 'client';
      if (user.role === 'BARBER') cancelledBy = 'barber';
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') cancelledBy = 'admin';

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

      await auditService.log(tx, { actorId: user.id, action: AuditEvent.APPOINTMENT_CANCELLED, entityType: 'Appointment', entityId: appointmentId, metadata: { cancelledBy, reason: reason ?? null } });

      logger.info('Appointment cancelled', { appointmentId, cancelledBy });
      return updated;
    });
  },

  async complete(appointmentId: string, user: AuthUser, notes?: string) {
    return transaction(async (tx) => {
      const appointment = await appointmentRepository.findById(tx, appointmentId);
      if (!appointment) throw new NotFoundError('Appointment');

      assertBarberOrAdmin(user, appointment.barberId);

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

      await auditService.log(tx, { actorId: user.id, action: AuditEvent.APPOINTMENT_COMPLETED, entityType: 'Appointment', entityId: appointmentId });

      logger.info('Appointment completed', { appointmentId });
      return updated;
    });
  },

  async markNoShow(appointmentId: string, user: AuthUser) {
    return transaction(async (tx) => {
      const appointment = await appointmentRepository.findById(tx, appointmentId);
      if (!appointment) throw new NotFoundError('Appointment');

      assertBarberOrAdmin(user, appointment.barberId);

      if (appointment.status !== 'CONFIRMED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Можно отметить только подтверждённую запись' });
      }

      const updated = await appointmentRepository.updateStatus(tx, appointmentId, 'NO_SHOW');

      await auditService.log(tx, { actorId: user.id, action: AuditEvent.APPOINTMENT_NO_SHOW, entityType: 'Appointment', entityId: appointmentId });

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

  async getMyStats(clientId: string) {
    return transaction(async (tx) => {
      const allAppointments = await tx.appointment.findMany({
        where: { clientId, deletedAt: null },
        select: {
          id: true,
          startTime: true,
          priceAtBooking: true,
          status: true,
          barberId: true,
          barber: { select: { id: true, firstName: true, lastName: true } },
          service: { select: { id: true, name: true } },
          appointmentServices: {
            select: {
              serviceId: true,
              service: { select: { id: true, name: true } },
              priceAtBooking: true,
            },
          },
        },
        orderBy: { startTime: 'asc' },
      });

      const completed = allAppointments.filter((a) => a.status === 'COMPLETED');
      const cancelled = allAppointments.filter((a) => a.status === 'CANCELLED');
      const totalVisits = completed.length;
      const totalSpent = completed.reduce((sum, a) => sum.add(a.priceAtBooking), new Decimal(0));
      const firstVisitDate = allAppointments.length > 0 ? allAppointments[0]!.startTime : null;
      const lastVisitDate = completed.length > 0 ? completed[completed.length - 1]!.startTime : null;

      const serviceCount: Record<string, { name: string; count: number }> = {};
      for (const a of allAppointments) {
        if (a.appointmentServices && a.appointmentServices.length > 0) {
          for (const as of a.appointmentServices) {
            if (!serviceCount[as.serviceId]) serviceCount[as.serviceId] = { name: as.service.name, count: 0 };
            serviceCount[as.serviceId]!.count++;
          }
        } else {
          if (!serviceCount[a.service.id]) serviceCount[a.service.id] = { name: a.service.name, count: 0 };
          serviceCount[a.service.id]!.count++;
        }
      }
      const favoriteService = Object.values(serviceCount).sort((a, b) => b.count - a.count)[0] ?? null;

      const barberCount: Record<string, { name: string; count: number }> = {};
      for (const a of allAppointments) {
        if (!barberCount[a.barberId]) barberCount[a.barberId] = { name: `${a.barber.firstName} ${a.barber.lastName}`, count: 0 };
        barberCount[a.barberId]!.count++;
      }
      const favoriteBarber = Object.values(barberCount).sort((a, b) => b.count - a.count)[0] ?? null;

      return {
        totalVisits,
        totalSpent: Number(totalSpent),
        avgCheck: totalVisits > 0 ? Math.round(Number(totalSpent) / totalVisits) : 0,
        firstVisitDate,
        lastVisitDate,
        cancelledCount: cancelled.length,
        favoriteService,
        favoriteBarber,
      };
    });
  },

  async updateStatus(appointmentId: string, status: AppointmentStatus, user: AuthUser, notes?: string) {
    return transaction(async (tx) => {
      const appointment = await appointmentRepository.findById(tx, appointmentId);
      if (!appointment) throw new NotFoundError('Appointment');

      assertBarberOrAdmin(user, appointment.barberId);

      const data: Record<string, unknown> = {};
      if (status === 'CANCELLED') { data.cancelledAt = new Date(); data.cancelledBy = 'barber'; }
      if (notes !== undefined) data.notes = notes;

      const updated = await appointmentRepository.updateStatus(tx, appointmentId, status, data);

      await auditService.log(tx, { actorId: user.id, action: AuditEvent.APPOINTMENT_STATUS_CHANGED, entityType: 'Appointment', entityId: appointmentId, metadata: { newStatus: status } });
      return updated;
    });
  },

  async reschedule(appointmentId: string, startTime: Date, user: AuthUser) {
    return transaction(async (tx) => {
      const appointment = await appointmentRepository.findById(tx, appointmentId);
      if (!appointment) throw new NotFoundError('Appointment');

      assertBarberOrAdmin(user, appointment.barberId);

      const service = await serviceRepository.findById(tx, appointment.serviceId);
      if (!service) throw new NotFoundError('Service');

      const endTime = new Date(startTime.getTime() + (appointment.durationAtBooking ?? service.duration) * 60 * 1000);

      const overlapCount = await appointmentRepository.findOverlappingCount(tx, appointment.barberId, startTime, endTime, appointmentId);
      if (overlapCount > 0) {
        throw new ConflictError('Это время уже занято');
      }

      const updated = await tx.appointment.update({
        where: { id: appointmentId },
        data: { startTime, endTime },
      });

      await auditService.log(tx, { actorId: user.id, action: AuditEvent.APPOINTMENT_RESCHEDULED, entityType: 'Appointment', entityId: appointmentId, metadata: { newStartTime: startTime.toISOString() } });
      return updated;
    });
  },
};
