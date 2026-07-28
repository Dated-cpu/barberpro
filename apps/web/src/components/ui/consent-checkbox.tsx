'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { LEGAL_DOCUMENTS, type ConsentType } from '@/lib/legal';

interface ConsentCheckboxProps {
  consentType: ConsentType;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  className?: string;
}

const consentLinks: Record<ConsentType, { href: string; label: string }> = {
  privacy: { href: '/privacy', label: 'Политикой конфиденциальности' },
  terms: { href: '/terms', label: 'Пользовательским соглашением' },
  personalData: { href: '/personal-data', label: 'Политикой обработки персональных данных' },
  bookingRules: { href: '/booking-rules', label: 'Правилами записи и отмены' },
  cookies: { href: '/cookies', label: 'Политикой использования cookies' },
};

export function ConsentCheckbox({ consentType, checked, onChange, error, className }: ConsentCheckboxProps) {
  const link = consentLinks[consentType];
  const doc = LEGAL_DOCUMENTS[consentType];

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border bg-bg-secondary text-accent
            focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary
            cursor-pointer"
          aria-invalid={error ? 'true' : undefined}
        />
        <span className="text-xs sm:text-sm text-text-secondary font-body leading-relaxed select-none">
          Я принимаю{' '}
          <Link href={link.href} target="_blank" className="text-accent underline hover:text-accent-hover transition-colors">
            {link.label}
          </Link>
          {' '}(версия {doc.version})
        </span>
      </label>
      {error ? (
        <p role="alert" className="ml-7 text-xs text-error">{error}</p>
      ) : null}
    </div>
  );
}
