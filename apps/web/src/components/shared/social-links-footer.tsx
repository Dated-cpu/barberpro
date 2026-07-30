'use client';

import { trpc } from '@/trpc/client';

function buildSocialUrl(key: string, value: string): string {
  if (!value) return '#';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (key === 'social_instagram') return `https://instagram.com/${value.replace('@', '')}`;
  if (key === 'social_telegram') return `https://t.me/${value.replace('@', '')}`;
  if (key === 'social_whatsapp') {
    const digits = value.replace(/\D/g, '');
    return digits ? `https://wa.me/${digits}` : '#';
  }
  return '#';
}

export function SocialLinksFooter() {
  const result = trpc.settings.adminGetSystemSettings.useQuery(undefined, { staleTime: 60_000 });
  const data: { key: string; value: unknown }[] | undefined = result.data;

  const getVal = (key: string) => {
    if (!data) return '';
    const s = data.find((item) => item.key === key);
    return s ? String(s.value) : '';
  };

  const instagram = getVal('social_instagram');
  const telegram = getVal('social_telegram');
  const whatsapp = getVal('social_whatsapp');

  return (
    <div className="flex gap-3">
      <a
        href={buildSocialUrl('social_instagram', instagram)}
        target="_blank" rel="noopener noreferrer"
        aria-label="Instagram"
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" /></svg>
      </a>
      <a
        href={buildSocialUrl('social_telegram', telegram)}
        target="_blank" rel="noopener noreferrer"
        aria-label="Telegram"
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.5 4.5l-19 7.5 7 2.5 3 8 9-18z" /></svg>
      </a>
      <a
        href={buildSocialUrl('social_whatsapp', whatsapp)}
        target="_blank" rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
      </a>
    </div>
  );
}
