import type { ReactNode } from 'react';
import { SectionTitle } from './section-title';
import { MobileBackButton } from './mobile-back-button';

interface LegalPageProps {
  title: string;
  subtitle?: string;
  version: number;
  children: ReactNode;
}

export function LegalPage({ title, subtitle, version, children }: LegalPageProps) {
  return (
    <div className="py-16 sm:py-20 md:py-24">
      <MobileBackButton />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionTitle title={title} subtitle={subtitle} align="left" />
        <div className="mt-10 sm:mt-12 space-y-6 text-sm sm:text-base text-text-secondary font-body leading-relaxed">
          {children}
        </div>
        <div className="mt-10 border-t border-border pt-6 text-xs text-text-tertiary font-body">
          Версия документа: {version}. Актуально на {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}.
        </div>
      </div>
    </div>
  );
}
