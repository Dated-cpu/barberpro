import { z } from 'zod';

export const createPortfolioSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional().nullable(),
  imageIds: z.array(z.string().uuid()).min(1).max(20),
});

export const updatePortfolioSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
});

export const portfolioIdSchema = z.object({
  id: z.string().uuid(),
});

export const uploadImageSchema = z.object({
  file: z.instanceof(File).optional(),
  alt: z.string().max(200).optional(),
});
