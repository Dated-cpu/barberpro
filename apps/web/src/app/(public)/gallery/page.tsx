import { SectionTitle } from '@/components/shared/section-title';

const categories = ['Все работы', 'Стрижки', 'Борода', 'Бритьё', 'Укладка'];

export const metadata = { title: 'Портфолио', description: 'Работы наших мастеров' };

export default function GalleryPage() {
  return (
    <div className="py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle
          title="Портфолио"
          subtitle="Работы наших мастеров"
        />

        <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="Категории работ">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={cat === 'Все работы'}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-all duration-200 hover:border-accent hover:text-accent font-body aria-selected:border-accent aria-selected:bg-accent-muted aria-selected:text-accent"
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl bg-bg-tertiary">
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-bg-tertiary to-bg-elevated">
                <div className="text-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-2 text-text-tertiary">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5-5 5-4-3-4 4v3a2 2 0 002 2h16a2 2 0 002-2v-2z"/>
                  </svg>
                  <p className="text-xs text-text-tertiary font-body">Фото {i + 1}</p>
                </div>
              </div>
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <p className="text-sm font-medium text-white font-body">Работа мастера</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
