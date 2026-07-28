import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional().nullable(),
  price: z.number().positive(),
  duration: z.number().int().positive(),
  category: z.string().optional().nullable(),
  branchId: z.string().uuid().optional().nullable(),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
});

export const serviceIdSchema = z.object({
  id: z.string().uuid(),
});

export const serviceListSchema = z.object({
  includeInactive: z.boolean().optional().default(false),
  category: z.string().optional(),
  branchId: z.string().uuid().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
