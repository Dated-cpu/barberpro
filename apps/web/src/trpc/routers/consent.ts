import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import { transaction } from '@/server/db/helpers';
import { consentService } from '@/server/services/consent';
import { auditService } from '@/server/services/audit';
import { LEGAL_DOCUMENTS } from '@/lib/legal';

export const consentRouter = router({
  record: publicProcedure
    .input(z.object({
      consentType: z.enum(Object.keys(LEGAL_DOCUMENTS) as [string, ...string[]]),
    }))
    .mutation(async ({ input, ctx }) => {
      const consent = await transaction(async (tx) => {
        const record = await consentService.record(tx, {
          userId: ctx.user?.id,
          consentType: input.consentType as keyof typeof LEGAL_DOCUMENTS,
          ip: ctx.ip ?? undefined,
          userAgent: ctx.userAgent ?? undefined,
        });

        await auditService.log(tx, {
          actorId: ctx.user?.id,
          action: 'consent.accept',
          entityType: 'UserConsent',
          entityId: record.id,
          ip: ctx.ip ?? undefined,
          userAgent: ctx.userAgent ?? undefined,
          metadata: { consentType: input.consentType, documentVersion: LEGAL_DOCUMENTS[input.consentType as keyof typeof LEGAL_DOCUMENTS].version },
        });

        return record;
      });

      return { id: consent.id };
    }),
});
