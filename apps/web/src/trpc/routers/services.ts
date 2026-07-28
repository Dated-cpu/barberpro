import { router, barberProcedure, adminProcedure } from '../trpc';
import { serviceRepository } from '@/server/repositories/service';
import { transaction } from '@/server/db/helpers';
import { createServiceSchema, updateServiceSchema, serviceIdSchema, serviceListSchema } from '@/validators/services';

export const servicesRouter = router({
  list: barberProcedure
    .input(serviceListSchema)
    .query(async ({ input }) => {
      return transaction(async (tx) => {
        const where: Record<string, unknown> = { deletedAt: null };
        if (!input.includeInactive) where.isActive = true;
        if (input.category) where.category = input.category;
        if (input.branchId) where.branchId = input.branchId;
        return tx.service.findMany({ where, orderBy: { sortOrder: 'asc' } });
      });
    }),

  getById: barberProcedure
    .input(serviceIdSchema)
    .query(async ({ input }) => {
      return transaction(async (tx) => serviceRepository.findById(tx, input.id));
    }),

  create: barberProcedure
    .input(createServiceSchema)
    .mutation(async ({ input }) => {
      return transaction(async (tx) =>
        tx.service.create({
          data: {
            name: input.name,
            description: input.description ?? null,
            price: input.price,
            duration: input.duration,
            category: input.category ?? null,
            branchId: input.branchId ?? null,
          },
        }),
      );
    }),

  update: barberProcedure
    .input(updateServiceSchema)
    .mutation(async ({ input }) => {
      return transaction(async (tx) =>
        tx.service.update({
          where: { id: input.id, deletedAt: null },
          data: {
            ...(input.name !== undefined && { name: input.name }),
            ...(input.description !== undefined && { description: input.description ?? null }),
            ...(input.price !== undefined && { price: input.price }),
            ...(input.duration !== undefined && { duration: input.duration }),
            ...(input.category !== undefined && { category: input.category ?? null }),
            ...(input.isActive !== undefined && { isActive: input.isActive }),
            ...(input.branchId !== undefined && { branchId: input.branchId ?? null }),
          },
        }),
      );
    }),

  archive: barberProcedure
    .input(serviceIdSchema)
    .mutation(async ({ input }) => {
      return transaction(async (tx) =>
        tx.service.update({
          where: { id: input.id },
          data: { isActive: false },
        }),
      );
    }),

  delete: adminProcedure
    .input(serviceIdSchema)
    .mutation(async ({ input }) => {
      return transaction(async (tx) =>
        tx.service.update({
          where: { id: input.id },
          data: { deletedAt: new Date() },
        }),
      );
    }),
});
