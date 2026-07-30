import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { adminService } from '@/server/services/admin';
import { createClientSchema } from '@/validators/clients';

export const adminRouter = router({
  addClient: adminProcedure
    .input(createClientSchema)
    .mutation(async ({ input }) => {
      return adminService.addClient(input);
    }),

  listAllAppointments: adminProcedure
    .input(z.object({ status: z.string().optional(), barberId: z.string().uuid().optional(), limit: z.coerce.number().int().min(1).max(100).default(30), cursor: z.string().uuid().optional(), from: z.string().datetime({ offset: true }).optional(), to: z.string().datetime({ offset: true }).optional() }))
    .query(async ({ input }) => {
      return adminService.listAllAppointments({
        status: input.status,
        barberId: input.barberId,
        limit: input.limit,
        cursor: input.cursor,
        from: input.from ? new Date(input.from) : undefined,
        to: input.to ? new Date(input.to) : undefined,
      });
    }),

  listAllClients: adminProcedure
    .input(z.object({ search: z.string().max(100).optional(), limit: z.coerce.number().int().min(1).max(100).default(50), cursor: z.string().uuid().optional() }))
    .query(async ({ input }) => adminService.listAllClients(input.search, input.limit, input.cursor)),
});
