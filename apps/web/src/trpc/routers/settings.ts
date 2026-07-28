import { z } from 'zod';
import { router, barberProcedure, adminProcedure } from '../trpc';
import { settingsService } from '@/server/services/settings';
import { updateWorkingDaySchema, createBlockedSlotSchema, deleteBlockedSlotSchema, updateProfileSchema } from '@/validators/settings';

export const settingsRouter = router({
  getWorkingDays: barberProcedure.query(async ({ ctx }) => {
    return settingsService.getWorkingDays(ctx.user!.id);
  }),

  upsertWorkingDay: barberProcedure
    .input(updateWorkingDaySchema)
    .mutation(async ({ ctx, input }) => {
      return settingsService.upsertWorkingDay(ctx.user!.id, input);
    }),

  getBlockedSlots: barberProcedure.query(async ({ ctx }) => {
    return settingsService.getBlockedSlots(ctx.user!.id);
  }),

  createBlockedSlot: barberProcedure
    .input(createBlockedSlotSchema)
    .mutation(async ({ ctx, input }) => {
      return settingsService.createBlockedSlot(ctx.user!.id, {
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        reason: input.reason,
      });
    }),

  deleteBlockedSlot: barberProcedure
    .input(deleteBlockedSlotSchema)
    .mutation(async ({ input }) => {
      return settingsService.deleteBlockedSlot(input.id);
    }),

  updateProfile: barberProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return settingsService.updateProfile(ctx.user!.id, input);
    }),

  adminGetSystemSettings: adminProcedure.query(async () => {
    return settingsService.getSystemSettings();
  }),

  adminUpsertSetting: adminProcedure
    .input(z.object({ key: z.string(), value: z.string(), type: z.string(), description: z.string().optional() }))
    .mutation(async ({ input }) => {
      let parsed: string | number | boolean | Record<string, unknown> = input.value;
      if (input.type === 'number') parsed = Number(input.value);
      else if (input.type === 'boolean') parsed = input.value === 'true';
      else if (input.type === 'json') { try { parsed = JSON.parse(input.value); } catch { parsed = input.value; } }
      return settingsService.upsertSystemSetting({ key: input.key, value: parsed, type: input.type, description: input.description ?? null });
    }),
});
