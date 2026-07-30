import { SectionTitle } from '@/components/shared/section-title';
import { Button } from '@/components/ui/button';
import { MobileBackButton } from '@/components/shared/mobile-back-button';
import { SocialLinksFooter } from '@/components/shared/social-links-footer';
import { MapPinIcon, PhoneIcon } from '@/components/ui/icons';
import Link from 'next/link';

export const metadata = { title: 'Контакты', description: 'Контакты барбершопа BarberPro' };

export default function ContactsPage() {
  return (
    <div className="py-16 sm:py-20 md:py-24">
      <MobileBackButton />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle
          title="Контакты"
          subtitle="Всегда на связи"
        />

        <div className="mt-10 sm:mt-12 md:mt-16 grid gap-8 sm:gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="mb-3 font-display text-lg font-semibold text-text-primary">Адрес</h3>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-bg-elevated text-accent">
                  <MapPinIcon width="16" height="16" />
                </div>
                <div>
                  <p className="text-text-secondary font-body">ул. Тверская, 15, Москва</p>
                  <p className="mt-1 text-sm text-text-tertiary font-body">
                    ст. м. Пушкинская, Тверская, Чеховская — 5 минут пешком
                  </p>
                </div>
              </div>
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
              <h3 className="mb-3 font-display text-lg font-semibold text-text-primary">Телефон</h3>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-bg-elevated text-accent">
                  <PhoneIcon width="16" height="16" />
                </div>
                <a href="tel:+79991234567" className="text-accent transition-colors hover:text-accent-hover font-body">+7 (999) 123-45-67</a>
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-display text-lg font-semibold text-text-primary">Email</h3>
              <a href="mailto:info@barberpro.ru" className="text-accent transition-colors hover:text-accent-hover font-body">info@barberpro.ru</a>
            </div>

            <div>
              <h3 className="mb-3 font-display text-lg font-semibold text-text-primary">Социальные сети</h3>
              <SocialLinksFooter />
            </div>
          </div>

          <div className="flex items-center justify-center rounded-xl border border-border bg-bg-elevated p-6 sm:p-8">
            <div className="text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4 text-text-tertiary">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <p className="text-sm text-text-tertiary font-body">ул. Тверская, 15, Москва</p>
              <p className="mt-2 text-xs text-text-tertiary font-body">Ждём вас в гости</p>
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
