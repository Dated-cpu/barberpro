import { z } from 'zod';

export const updateWorkingDaySchema = z.object({
  id: z.string().uuid().optional(),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  isDayOff: z.boolean().default(false),
});

export const createBlockedSlotSchema = z.object({
  startTime: z.string().datetime({ offset: true }),
  endTime: z.string().datetime({ offset: true }),
  reason: z.string().max(500).optional().nullable(),
});

export const deleteBlockedSlotSchema = z.object({
  id: z.string().uuid(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  avatarId: z.string().uuid().optional().nullable(),
});

export const systemSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.any(),
  type: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
  description: z.string().max(500).optional().nullable(),
});
