import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { adminService } from '@/server/services/admin';

export const adminRouter = router({
  listAllAppointments: adminProcedure
    .input(z.object({ status: z.string().optional(), barberId: z.string().uuid().optional(), limit: z.coerce.number().int().min(1).max(100).default(30), cursor: z.string().uuid().optional(), from: z.string().datetime({ offset: true }).optional(), to: z.string().datetime({ offset: true }).optional() }))
    .query(async ({ input }) => {
      const opts: Record<string, unknown> = { ...input };
      if (input.from) opts.from = new Date(input.from);
      if (input.to) opts.to = new Date(input.to);
      return adminService.listAllAppointments(opts as any);
    }),

  listAllClients: adminProcedure
    .input(z.object({ search: z.string().max(100).optional(), limit: z.coerce.number().int().min(1).max(100).default(50), cursor: z.string().uuid().optional() }))
    .query(async ({ input }) => adminService.listAllClients(input.search, input.limit, input.cursor)),
});
