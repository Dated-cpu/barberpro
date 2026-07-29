import { SectionTitle } from '@/components/shared/section-title';
import { MobileBackButton } from '@/components/shared/mobile-back-button';
import { EmptyState } from '@/components/shared/empty-state';

const reviews = [
  { name: 'Александр', date: '15 июля 2026', text: 'Лучший барбершоп в Москве! Александр сделал идеальную стрижку, учёл все пожелания. Буду ходить только сюда.', rating: 5 },
  { name: 'Михаил', date: '12 июля 2026', text: 'Отличная атмосфера, профессиональный подход. Отдельное спасибо за виски и кофе!', rating: 5 },
  { name: 'Дмитрий', date: '10 июля 2026', text: 'Давно не встречал такого уровня сервиса. Мастер подробно рассказал об уходе за бородой. Рекомендую!', rating: 5 },
  { name: 'Иван', date: '8 июля 2026', text: 'Хожу уже полгода, всегда отличный результат. Цены адекватные, качество на высоте.', rating: 5 },
  { name: 'Сергей', date: '5 июля 2026', text: 'Сделал королевское бритьё — это был невероятный опыт. Ощущения не compare ни с чем!', rating: 5 },
  { name: 'Евгений', date: '3 июля 2026', text: 'Отличный сервис онлайн-записи. Выбрал время, пришёл, меня уже ждали. Всё чётко!', rating: 4 },
  { name: 'Андрей', date: '28 июня 2026', text: 'Привёл сына на стрижку «Отец и сын». Ребёнок в восторге, я тоже. Спасибо BarberPro!', rating: 5 },
  { name: 'Владимир', date: '25 июня 2026', text: 'Мастер подробно проконсультировал по укладке, посоветовал средства. Результат превзошёл ожидания.', rating: 5 },
  { name: 'Павел', date: '20 июня 2026', text: 'Очень удобное расположение в центре. Записался онлайн, всё быстро и качественно. Рекомендую!', rating: 5 },
];

export const metadata = { title: 'Отзывы', description: 'Отзывы наших клиентов' };

export default function ReviewsPage() {
  return (
    <div className="py-16 sm:py-20 md:py-24">
      <MobileBackButton />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle
          title="Отзывы"
          subtitle="Более 500 довольных клиентов ежегодно"
        />

        <div className="mt-10 sm:mt-12 md:mt-16 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState
                icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
                title="Пока нет отзывов"
                subtitle="Когда клиенты оставят отзывы — они появятся здесь."
              />
            </div>
          ) : reviews.map((review) => (
            <div key={`${review.name}-${review.date}`} className="rounded-xl border border-border bg-bg-elevated p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-accent/50">
              <div className="mb-3 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="16" height="16" viewBox="0 0 16 16" fill={i < review.rating ? 'var(--color-accent)' : 'var(--color-bg-tertiary)'}>
                    <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 3.9L8 10.5l-3.6 1.9.7-3.9L2.2 5.2l4-.6L8 1z" />
                  </svg>
                ))}
              </div>
              <p className="mb-3 text-sm text-text-primary font-body leading-relaxed">{review.text}</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-primary font-body">{review.name}</p>
                <p className="text-xs text-text-tertiary font-body">{review.date}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 sm:mt-12 rounded-xl border border-border bg-bg-elevated p-6 sm:p-8 text-center">
          <p className="mb-2 text-sm sm:text-base text-text-secondary font-body">Хотите оставить отзыв?</p>
          <p className="text-sm text-text-tertiary font-body">Напишите нам в Telegram или WhatsApp</p>
          <div className="mt-4 flex justify-center gap-4 text-sm text-accent font-body">
            <a href="#" className="hover:underline py-2">Telegram</a>
            <a href="#" className="hover:underline py-2">WhatsApp</a>
          </div>
        </div>
      </div>
    </div>
  );
}
