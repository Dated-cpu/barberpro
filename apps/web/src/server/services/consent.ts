import type { TxClient } from '../db/helpers';
import { LEGAL_DOCUMENTS, type ConsentType } from '@/lib/legal';

export const consentService = {
  async record(
    tx: TxClient,
    data: {
      userId?: string;
      consentType: ConsentType;
      ip?: string;
      userAgent?: string;
    },
  ) {
    const doc = LEGAL_DOCUMENTS[data.consentType];

    return tx.userConsent.create({
      data: {
        userId: data.userId ?? null,
        consentType: data.consentType,
        documentVersion: doc.version,
        ip: data.ip ?? null,
        userAgent: data.userAgent ?? null,
      },
    });
  },

  async hasAccepted(
    tx: TxClient,
    userId: string,
    consentType: ConsentType,
  ): Promise<boolean> {
    const doc = LEGAL_DOCUMENTS[consentType];
    const record = await tx.userConsent.findFirst({
      where: {
        userId,
        consentType,
        documentVersion: doc.version,
      },
      orderBy: { acceptedAt: 'desc' },
    });
    return record !== null;
  },
};
