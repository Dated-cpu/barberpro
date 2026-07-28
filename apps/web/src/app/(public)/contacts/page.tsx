import { SectionTitle } from '@/components/shared/section-title';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = { title: 'Контакты', description: 'Контакты барбершопа BarberPro' };

export default function ContactsPage() {
  return (
    <div className="py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle
          title="Контакты"
          subtitle="Всегда на связи"
        />

        <div className="mt-10 sm:mt-12 md:mt-16 grid gap-8 sm:gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="mb-2 font-display text-lg font-semibold text-text-primary">Адрес</h3>
              <p className="text-text-secondary font-body">ул. Тверская, 15, Москва</p>
              <p className="mt-2 text-sm text-text-tertiary font-body">
                ст. м. Пушкинская, Тверская, Чеховская — 5 минут пешком
              </p>
            </div>

            <div>
              <h3 className="mb-2 font-display text-lg font-semibold text-text-primary">Часы работы</h3>
              <div className="space-y-1 text-sm text-text-secondary font-body">
                <p>Пн–Пт: 09:00 – 21:00</p>
                <p>Сб: 10:00 – 21:00</p>
                <p>Вс: 10:00 – 20:00</p>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-display text-lg font-semibold text-text-primary">Телефон</h3>
              <a href="tel:+79991234567" className="text-accent transition-colors hover:text-accent-hover font-body">+7 (999) 123-45-67</a>
            </div>

            <div>
              <h3 className="mb-2 font-display text-lg font-semibold text-text-primary">Email</h3>
              <a href="mailto:info@barberpro.ru" className="text-accent transition-colors hover:text-accent-hover font-body">info@barberpro.ru</a>
            </div>

            <div>
              <h3 className="mb-2 font-display text-lg font-semibold text-text-primary">Социальные сети</h3>
              <div className="flex gap-3">
                <a href="#" className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
                </a>
                <a href="#" className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.5 4.5l-19 7.5 7 2.5 3 8 9-18z"/></svg>
                </a>
                <a href="#" className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-text-secondary hover:border-accent hover:text-accent transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.1 2C6.5 2 2 6.5 2 12.1v-.2C2 17.5 6.5 22 12.1 22h-.2c5.5 0 10.1-4.5 10.1-10.1v.2C22 6.5 17.5 2 12.1 2z"/></svg>
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center rounded-xl border border-border bg-bg-elevated p-6 sm:p-8">
            <div className="text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4 text-text-tertiary">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <p className="text-sm text-text-tertiary font-body">ул. Тверская, 15, Москва</p>
              <p className="mt-2 text-xs text-text-tertiary font-body">Карта будет добавлена позже</p>
            </div>
          </div>
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <Link href="/booking">
            <Button size="lg">Записаться онлайн</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
