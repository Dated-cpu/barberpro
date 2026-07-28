import { SectionTitle } from '@/components/shared/section-title';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const services = [
  { name: 'Мужская стрижка', price: '2 500 ₽', time: '60 мин', desc: 'Классическая или модельная стрижка с мытьём головы, укладкой и консультацией по уходу.' },
  { name: 'Стрижка машинкой', price: '2 000 ₽', time: '45 мин', desc: 'Быстрая стрижка машинкой с насадками любой длины, идеальный вариант для занятых.' },
  { name: 'Королевское бритьё', price: '3 000 ₽', time: '60 мин', desc: 'Бритьё опасной бритвой с горячим полотенцем, прешейвом и успокаивающим лосьоном.' },
  { name: 'Моделирование бороды', price: '1 500 ₽', time: '30 мин', desc: 'Придание формы бороде, усов и бакенбардов с использованием профессиональных ножниц и машинки.' },
  { name: 'Стрижка + бритьё', price: '4 000 ₽', time: '90 мин', desc: 'Комплексная услуга: стрижка + королевское бритьё со скидкой 15%.' },
  { name: 'Укладка', price: '1 000 ₽', time: '20 мин', desc: 'Укладка волос с использованием профессиональных средств: помада, воск, глина, лак.' },
  { name: 'Камуфляж седины', price: '2 000 ₽', time: '30 мин', desc: 'Маскировка седых волос с помощью профессиональных красок, естественный результат.' },
  { name: 'Отец и сын', price: '4 000 ₽', time: '90 мин', desc: 'Совместная стрижка для папы и сына. Отличный вариант семейного визита.' },
  { name: 'Экспресс-стрижка', price: '1 500 ₽', time: '20 мин', desc: 'Быстрая стрижка без мытья и укладки для тех, кто ценит своё время.' },
];

export const metadata = { title: 'Услуги', description: 'Полный список услуг барбершопа BarberPro' };

export default function ServicesPage() {
  return (
    <div className="py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle
          title="Услуги и цены"
          subtitle="Прозрачные цены без скрытых доплат"
        />
        <div className="mt-10 sm:mt-12 md:mt-16 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div key={service.name} className="group glass-card rounded-xl p-5 sm:p-6">
              <h3 className="mb-2 font-display text-base sm:text-lg font-semibold text-text-primary">{service.name}</h3>
              <p className="mb-4 text-sm text-text-secondary font-body leading-relaxed">{service.desc}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 text-sm text-text-tertiary font-body">
                  <span className="flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    {service.time}
                  </span>
                  <span className="text-base sm:text-lg font-semibold text-accent">{service.price}</span>
                </div>
              </div>
            </div>
          ))}
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
