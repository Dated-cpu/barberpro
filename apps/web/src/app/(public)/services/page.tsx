import { SectionTitle } from '@/components/shared/section-title';
import { MobileBackButton } from '@/components/shared/mobile-back-button';
import { ServicesAccordion } from '@/components/shared/services-accordion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = { title: 'Услуги', description: 'Полный список услуг барбершопа BarberPro' };

export default function ServicesPage() {
  return (
    <div className="py-16 sm:py-20 md:py-24">
      <MobileBackButton />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle
          title="Услуги и цены"
          subtitle="Прозрачные цены без скрытых доплат"
        />
        <div className="mt-10 sm:mt-12 md:mt-16">
          <ServicesAccordion />
        </div>

        <div className="mt-12 sm:mt-16 text-center">
          <p className="mb-4 sm:mb-6 text-sm sm:text-base text-text-secondary font-body">Не нашли то, что искали? Свяжитесь с нами!</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <Link href="/booking">
              <Button size="lg" className="w-full sm:w-auto">Записаться онлайн</Button>
            </Link>
            <Link href="/contacts">
              <Button variant="glass" size="lg" className="w-full sm:w-auto">Связаться с нами</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
