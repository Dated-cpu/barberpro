'use client';

import { useState } from 'react';
import { ClockIcon, WalletIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

interface ServiceDetail {
  label: string;
  value: string;
}

interface Service {
  name: string;
  price: string;
  time: string;
  desc: string;
  details: ServiceDetail[];
}

const services: Service[] = [
  {
    name: 'Мужская стрижка',
    price: '2 500 ₽',
    time: '60 мин',
    desc: 'Классическая или модельная стрижка с мытьём головы, укладкой и консультацией по уходу.',
    details: [
      { label: 'Что входит', value: 'Мытьё головы, стрижка ножницами и машинкой, укладка, консультация по уходу' },
      { label: 'Продолжительность', value: '60 минут' },
      { label: 'Для кого', value: 'Для всех типов волос и длины' },
    ],
  },
  {
    name: 'Стрижка машинкой',
    price: '2 000 ₽',
    time: '45 мин',
    desc: 'Быстрая стрижка машинкой с насадками любой длины, идеальный вариант для занятых.',
    details: [
      { label: 'Что входит', value: 'Стрижка машинкой, обработка краёв, лёгкая укладка' },
      { label: 'Продолжительность', value: '45 минут' },
      { label: 'Для кого', value: 'Для тех, кто предпочитает короткие стрижки' },
    ],
  },
  {
    name: 'Королевское бритьё',
    price: '3 000 ₽',
    time: '60 мин',
    desc: 'Бритьё опасной бритвой с горячим полотенцем, прешейвом и успокаивающим лосьоном.',
    details: [
      { label: 'Что входит', value: 'Горячее полотенце, прешейв, бритьё опасной бритвой, лосьон после бритья' },
      { label: 'Продолжительность', value: '60 минут' },
      { label: 'Для кого', value: 'Для ценителей классического бритья' },
    ],
  },
  {
    name: 'Моделирование бороды',
    price: '1 500 ₽',
    time: '30 мин',
    desc: 'Придание формы бороде, усов и бакенбардов с использованием профессиональных ножниц и машинки.',
    details: [
      { label: 'Что входит', value: 'Подравнивание длины, оформление линии, коррекция формы' },
      { label: 'Продолжительность', value: '30 минут' },
      { label: 'Для кого', value: 'Для обладателей бороды любой длины' },
    ],
  },
  {
    name: 'Стрижка + бритьё',
    price: '4 000 ₽',
    time: '90 мин',
    desc: 'Комплексная услуга: стрижка + королевское бритьё со скидкой 15%.',
    details: [
      { label: 'Что входит', value: 'Полный комплекс: стрижка + королевское бритьё' },
      { label: 'Продолжительность', value: '90 минут' },
      { label: 'Экономия', value: '15% против заказа услуг по отдельности' },
    ],
  },
  {
    name: 'Укладка',
    price: '1 000 ₽',
    time: '20 мин',
    desc: 'Укладка волос с использованием профессиональных средств: помада, воск, глина, лак.',
    details: [
      { label: 'Что входит', value: 'Мытьё, укладка с профессиональным средством, фиксация' },
      { label: 'Продолжительность', value: '20 минут' },
      { label: 'Для кого', value: 'Для любого типа волос' },
    ],
  },
  {
    name: 'Камуфляж седины',
    price: '2 000 ₽',
    time: '30 мин',
    desc: 'Маскировка седых волос с помощью профессиональных красок, естественный результат.',
    details: [
      { label: 'Что входит', value: 'Нанесение состава, выдержка, смывание, укладка' },
      { label: 'Продолжительность', value: '30 минут' },
      { label: 'Для кого', value: 'Для маскировки седины на висках и по всей голове' },
    ],
  },
  {
    name: 'Отец и сын',
    price: '4 000 ₽',
    time: '90 мин',
    desc: 'Совместная стрижка для папы и сына. Отличный вариант семейного визита.',
    details: [
      { label: 'Что входит', value: 'Две стрижки для взрослого и ребёнка' },
      { label: 'Продолжительность', value: '90 минут на двоих' },
      { label: 'Для кого', value: 'Для пап с сыновьями до 14 лет' },
    ],
  },
  {
    name: 'Экспресс-стрижка',
    price: '1 500 ₽',
    time: '20 мин',
    desc: 'Быстрая стрижка без мытья и укладки для тех, кто ценит своё время.',
    details: [
      { label: 'Что входит', value: 'Стрижка машинкой и ножницами, обработка краёв' },
      { label: 'Продолжительность', value: '20 минут' },
      { label: 'Для кого', value: 'Для занятых клиентов без лишних процедур' },
    ],
  },
  {
    name: 'Коррекция бровей',
    price: '800 ₽',
    time: '20 мин',
    desc: 'Аккуратное оформление мужских бровей с сохранением естественной формы. Подчёркивает взгляд и завершает образ.',
    details: [
      { label: 'Что входит', value: 'Коррекция пинцетом, оформление арки, успокаивающий лосьон' },
      { label: 'Продолжительность', value: '15–20 минут' },
      { label: 'Для кого', value: 'Для мужчин, следящих за своей внешностью' },
    ],
  },
];

export function ServicesAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleService = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={service.name}
            className="group rounded-xl border border-border bg-bg-elevated transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-gold/20"
          >
            <button
              type="button"
              onClick={() => toggleService(index)}
              aria-expanded={isOpen}
              aria-controls={`service-detail-${index}`}
              className="w-full p-5 sm:p-6 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-base sm:text-lg font-semibold text-text-primary">
                  {service.name}
                </h3>
                <span
                  className={cn(
                    'mt-1 shrink-0 text-text-tertiary transition-transform duration-300',
                    isOpen && 'rotate-180',
                  )}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </div>
              <p className="mb-4 mt-2 text-sm text-text-secondary font-body leading-relaxed">{service.desc}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 text-sm text-text-tertiary font-body">
                  <span className="flex items-center gap-1.5">
                    <ClockIcon />
                    {service.time}
                  </span>
                  <span className="flex items-center gap-1.5 text-base sm:text-lg font-semibold text-accent">
                    <WalletIcon className="text-accent/60" />
                    {service.price}
                  </span>
                </div>
              </div>
            </button>

            <div
              id={`service-detail-${index}`}
              role="region"
              className={cn(
                'overflow-hidden transition-all duration-300 ease-gold',
                isOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0',
              )}
            >
              <div className="border-t border-border px-5 sm:px-6 pb-5 sm:pb-6 pt-4">
                <div className="flex flex-col gap-3">
                  {service.details.map((detail) => (
                    <div key={detail.label} className="flex items-start gap-2">
                      <span className="mt-0.5 text-gold shrink-0">·</span>
                      <div>
                        <span className="text-xs font-medium text-text-tertiary font-body uppercase tracking-wider">{detail.label}:</span>
                        <p className="text-sm text-text-primary font-body">{detail.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
