import { z } from 'zod';

export const customerListSchema = z.object({
  search: z.string().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});

export const customerIdSchema = z.object({
  id: z.string().uuid(),
});

export const updateCustomerNotesSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(2000).optional().nullable(),
});
