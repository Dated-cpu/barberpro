import { SectionTitle } from '@/components/shared/section-title';
import { MobileBackButton } from '@/components/shared/mobile-back-button';

export const metadata = { title: 'Портфолио', description: 'Работы мастера' };

export default function GalleryPage() {
  return (
    <div className="py-16 sm:py-20 md:py-24">
      <MobileBackButton />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle
          title="Портфолио"
          subtitle="Примеры наших работ"
        />

        <div className="mt-10 sm:mt-12 md:mt-16 flex flex-col items-center justify-center rounded-xl border border-border bg-bg-elevated p-12 sm:p-16 text-center">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-6 text-text-tertiary">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5-5 5-4-3-4 4v3a2 2 0 002 2h16a2 2 0 002-2v-2z"/>
          </svg>
          <h3 className="mb-2 font-display text-lg font-semibold text-text-primary">Портфолио скоро появится</h3>
          <p className="max-w-md text-sm text-text-tertiary font-body leading-relaxed">
            Мастер добавляет примеры работ. Загляните позже, чтобы оценить стиль и качество.
          </p>
        </div>
      </div>
    </div>
  );
}
