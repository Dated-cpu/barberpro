import { router, publicProcedure } from '../trpc';
import { transaction } from '@/server/db/helpers';

export const barbersRouter = router({
  listActive: publicProcedure
    .query(async () => {
      return transaction(async (tx) =>
        tx.user.findMany({
          where: { role: 'BARBER', isActive: true, deletedAt: null },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarId: true,
          },
          orderBy: { firstName: 'asc' },
        }),
      );
    }),
});
