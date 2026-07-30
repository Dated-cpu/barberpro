import Link from 'next/link';
import { SocialLinksFooter } from './social-links-footer';

export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-primary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="mb-3 sm:mb-4 font-display text-lg font-bold tracking-wider text-accent">
              BARBER<span className="text-text-primary">PRO</span>
            </h3>
            <p className="text-sm text-text-secondary font-body leading-relaxed max-w-xs">
              Премиальный барбершоп. Только профессиональный инструмент и индивидуальный подход.
            </p>
          </div>

          <div>
            <h4 className="mb-3 sm:mb-4 text-sm font-semibold text-text-primary font-body">Навигация</h4>
            <div className="flex flex-col gap-2">
              <Link href="/services" className="text-sm text-text-secondary hover:text-accent transition-colors font-body py-1">Услуги</Link>
              <Link href="/gallery" className="text-sm text-text-secondary hover:text-accent transition-colors font-body py-1">Портфолио</Link>
              <Link href="/reviews" className="text-sm text-text-secondary hover:text-accent transition-colors font-body py-1">Отзывы</Link>
              <Link href="/contacts" className="text-sm text-text-secondary hover:text-accent transition-colors font-body py-1">Контакты</Link>
            </div>
          </div>

          <div>
            <h4 className="mb-3 sm:mb-4 text-sm font-semibold text-text-primary font-body">Контакты</h4>
            <div className="flex flex-col gap-2 text-sm text-text-secondary font-body">
              <a href="tel:+79991234567" className="hover:text-accent transition-colors py-1">+7 (999) 123-45-67</a>
              <a href="mailto:info@barberpro.ru" className="hover:text-accent transition-colors py-1">info@barberpro.ru</a>
              <p className="py-1">ул. Тверская, 15</p>
              <p className="py-1">Москва, Россия</p>
            </div>
          </div>

          <div>
            <h4 className="mb-3 sm:mb-4 text-sm font-semibold text-text-primary font-body">Юридическая информация</h4>
            <div className="flex flex-col gap-2">
              <Link href="/privacy" className="text-sm text-text-secondary hover:text-accent transition-colors font-body py-1">Политика конфиденциальности</Link>
              <Link href="/terms" className="text-sm text-text-secondary hover:text-accent transition-colors font-body py-1">Пользовательское соглашение</Link>
              <Link href="/personal-data" className="text-sm text-text-secondary hover:text-accent transition-colors font-body py-1">Персональные данные</Link>
              <Link href="/booking-rules" className="text-sm text-text-secondary hover:text-accent transition-colors font-body py-1">Правила записи</Link>
              <Link href="/cookies" className="text-sm text-text-secondary hover:text-accent transition-colors font-body py-1">Cookies</Link>
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="mb-3 sm:mb-4 text-sm font-semibold text-text-primary font-body">Мы в соцсетях</h4>
            <SocialLinksFooter />
          </div>
        </div>

        <div className="mt-8 sm:mt-12 border-t border-border pt-6 text-center text-xs text-text-tertiary font-body">
          <p>&copy; {new Date().getFullYear()} BarberPro. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
