import type { TxClient } from '../db/helpers';
import type { Prisma } from '@prisma/client';

export interface EventPayload {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
}

export async function dispatchEvent(tx: TxClient, event: EventPayload): Promise<void> {
  await tx.event.create({
    data: {
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      payload: event.payload as Prisma.InputJsonValue,
      status: 'PENDING',
    },
  });
}

export const EventTypes = {
  USER_CREATED: 'user.created',
  APPOINTMENT_CREATED: 'appointment.created',
  APPOINTMENT_CONFIRMED: 'appointment.confirmed',
  APPOINTMENT_CANCELLED: 'appointment.cancelled',
  APPOINTMENT_COMPLETED: 'appointment.completed',
  REVIEW_CREATED: 'review.created',
} as const;
