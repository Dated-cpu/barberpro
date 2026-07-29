import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { adminService } from '@/server/services/admin';

export const adminRouter = router({
  listBarbers: adminProcedure
    .input(z.object({ search: z.string().max(100).optional(), limit: z.coerce.number().int().min(1).max(100).default(50), cursor: z.string().uuid().optional() }))
    .query(async ({ input }) => adminService.listBarbers(input.search, input.limit, input.cursor)),

  getBarberById: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => adminService.getBarberById(input.id)),

  updateBarber: adminProcedure
    .input(z.object({ id: z.string().uuid(), firstName: z.string().min(2).max(50).optional(), lastName: z.string().min(2).max(50).optional(), email: z.string().email().optional(), phone: z.string().optional(), isActive: z.boolean().optional(), role: z.enum(['BARBER', 'ADMIN']).optional() }))
    .mutation(async ({ input }) => adminService.updateBarber(input.id, input)),

  listBranches: adminProcedure
    .input(z.object({ search: z.string().max(100).optional() }))
    .query(async ({ input }) => adminService.listBranches(input.search)),

  createBranch: adminProcedure
    .input(z.object({ name: z.string().min(2).max(100), slug: z.string().min(2).max(100), address: z.string().max(300).optional(), phone: z.string().max(20).optional(), email: z.string().email().optional(), timezone: z.string().optional() }))
    .mutation(async ({ input }) => adminService.createBranch(input)),

  updateBranch: adminProcedure
    .input(z.object({ id: z.string().uuid(), name: z.string().min(2).max(100).optional(), slug: z.string().min(2).max(100).optional(), address: z.string().max(300).optional(), phone: z.string().max(20).optional(), email: z.string().email().optional(), timezone: z.string().optional(), isActive: z.boolean().optional() }))
    .mutation(async ({ input }) => adminService.updateBranch(input.id, input)),

  deleteBranch: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => adminService.deleteBranch(input.id)),

  listAllAppointments: adminProcedure
    .input(z.object({ status: z.string().optional(), barberId: z.string().uuid().optional(), branchId: z.string().uuid().optional(), limit: z.coerce.number().int().min(1).max(100).default(30), cursor: z.string().uuid().optional(), from: z.string().datetime({ offset: true }).optional(), to: z.string().datetime({ offset: true }).optional() }))
    .query(async ({ input }) => {
      const opts: Record<string, unknown> = { ...input };
      if (input.from) opts.from = new Date(input.from);
      if (input.to) opts.to = new Date(input.to);
      return adminService.listAllAppointments(opts as any);
    }),

  getAuditLogs: adminProcedure
    .input(z.object({ action: z.string().optional(), entityType: z.string().optional(), limit: z.coerce.number().int().min(1).max(200).default(50), cursor: z.string().uuid().optional(), from: z.string().datetime({ offset: true }).optional(), to: z.string().datetime({ offset: true }).optional() }))
    .query(async ({ input }) => {
      const opts: Record<string, unknown> = { ...input };
      if (input.from) opts.from = new Date(input.from);
      if (input.to) opts.to = new Date(input.to);
      return adminService.getAuditLogs(opts as any);
    }),

  exportAuditLogs: adminProcedure
    .input(z.object({ action: z.string().optional(), entityType: z.string().optional(), from: z.string().datetime({ offset: true }).optional(), to: z.string().datetime({ offset: true }).optional() }))
    .query(async ({ input }) => {
      const opts: Record<string, unknown> = { ...input, limit: 10000 };
      if (input.from) opts.from = new Date(input.from);
      if (input.to) opts.to = new Date(input.to);
      return adminService.getAuditLogs(opts as any);
    }),

  listAuditEntityTypes: adminProcedure.query(async () => {
    return adminService.listAuditEntityTypes();
  }),

  listAllClients: adminProcedure
    .input(z.object({ search: z.string().max(100).optional(), limit: z.coerce.number().int().min(1).max(100).default(50), cursor: z.string().uuid().optional() }))
    .query(async ({ input }) => adminService.listAllClients(input.search, input.limit, input.cursor)),

  listAllUsers: adminProcedure
    .input(z.object({ search: z.string().max(100).optional(), role: z.enum(['ADMIN', 'BARBER', 'CLIENT']).optional(), limit: z.coerce.number().int().min(1).max(100).default(50), cursor: z.string().uuid().optional() }))
    .query(async ({ input }) => adminService.listAllUsers(input.search, input.role, input.limit, input.cursor)),

  updateUser: adminProcedure
    .input(z.object({ id: z.string().uuid(), firstName: z.string().min(2).max(50).optional(), lastName: z.string().min(2).max(50).optional(), email: z.string().email().optional(), phone: z.string().optional(), isActive: z.boolean().optional(), role: z.enum(['CLIENT', 'BARBER', 'ADMIN']).optional() }))
    .mutation(async ({ input }) => adminService.updateUser(input.id, input)),

  deleteUser: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => adminService.deleteUser(input.id)),
});
