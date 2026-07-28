import { z } from 'zod';

export const moderateReviewSchema = z.object({
  reviewId: z.string().uuid(),
  status: z.enum(['APPROVED', 'REJECTED']),
});

export const reviewListSchema = z.object({
  status: z.enum(['ALL', 'PENDING', 'APPROVED', 'REJECTED']).default('ALL'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().uuid().optional(),
});
