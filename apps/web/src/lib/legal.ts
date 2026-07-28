export const LEGAL_DOCUMENTS = {
  privacy: { version: 1, slug: 'privacy', title: 'Политика конфиденциальности' },
  terms: { version: 1, slug: 'terms', title: 'Пользовательское соглашение' },
  personalData: { version: 1, slug: 'personal-data', title: 'Политика обработки персональных данных' },
  bookingRules: { version: 1, slug: 'booking-rules', title: 'Правила записи и отмены' },
  cookies: { version: 1, slug: 'cookies', title: 'Политика использования cookies' },
} as const;

export type ConsentType = keyof typeof LEGAL_DOCUMENTS;
export type LegalDoc = (typeof LEGAL_DOCUMENTS)[ConsentType];
