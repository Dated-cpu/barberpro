import { z } from 'zod';

export const uuidSchema = z.string().uuid('Invalid UUID');

export const paginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime({ offset: true }),
  endDate: z.string().datetime({ offset: true }),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
