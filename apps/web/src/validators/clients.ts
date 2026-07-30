import { z } from 'zod';

export const createClientSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phone: z.string().min(5).max(20),
  email: z.string().email().optional().nullable(),
});
