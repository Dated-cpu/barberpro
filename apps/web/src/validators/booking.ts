import { z } from 'zod';

const phoneRegex = /^\+7\d{10}$/;

export const createAppointmentSchema = z.object({
  barberId: z.string().uuid(),
  serviceId: z.string().uuid(),
  branchId: z.string().uuid().nullable().optional(),
  startTime: z.string().datetime({ offset: true }),
  clientNotes: z.string().max(500).optional().nullable(),
  clientPhone: z.string().regex(phoneRegex, 'Некорректный номер телефона. Формат: +7XXXXXXXXXX'),
  clientName: z.string().min(2).max(100),
  clientEmail: z.string().email().optional().nullable(),
});

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const completeAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});

export const markNoShowSchema = z.object({
  appointmentId: z.string().uuid(),
});

export const slotQuerySchema = z.object({
  barberId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат даты: YYYY-MM-DD'),
  serviceId: z.string().uuid(),
});

export const dateSlotsQuerySchema = z.object({
  barberId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceId: z.string().uuid(),
});

export const appointmentIdSchema = z.object({
  id: z.string().uuid(),
});

export const clientAppointmentsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});

export const updateAppointmentStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  notes: z.string().max(1000).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  id: z.string().uuid(),
  startTime: z.string().datetime({ offset: true }),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type SlotQueryInput = z.infer<typeof slotQuerySchema>;
