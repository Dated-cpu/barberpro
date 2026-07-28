import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GoldThread } from '@/components/shared/gold-thread';
import { SectionTitle } from '@/components/shared/section-title';
import { Reveal } from '@/components/shared/reveal';
import { BarberExperienceDynamic } from '@/components/scene/BarberExperienceDynamic';

export default function Home() {
  return (
    <>
      <section className="relative flex min-h-screen items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-obsidian to-espresso/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_var(--color-gold-glow)_0%,_transparent_60%)] opacity-30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,_rgba(201,169,110,0.04)_0%,_transparent_50%)]" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 py-20 md:py-32">
          <div className="max-w-2xl">
            <Reveal animation="fade-up" delay={200}>
              <p className="mb-4 sm:mb-6 font-body text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] text-gold">
                Premium Barber Shop
              </p>
            </Reveal>
            <Reveal animation="fade-up" delay={400}>
              <h1 className="mb-6 sm:mb-8 font-display text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold leading-[1.1] sm:leading-tight text-ivory">
                Искусство
                <br />
                <span className="text-gold">мужского стиля</span>
              </h1>
            </Reveal>
            <Reveal animation="fade-up" delay={600}>
              <GoldThread className="mb-6 sm:mb-8 w-20 sm:w-24" />
            </Reveal>
            <Reveal animation="fade-up" delay={700}>
              <p className="mb-8 sm:mb-10 max-w-lg text-sm sm:text-base text-stone font-body leading-relaxed">
                Премиальные стрижки, бритьё и уход. Только лучшие мастера и профессиональная косметика.
              </p>
            </Reveal>
            <Reveal animation="fade-up" delay={800}>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link href="/booking" className="w-full sm:w-auto">
                  <Button size="lg" variant="primary" className="w-full sm:w-auto">Записаться онлайн</Button>
                </Link>
                <Link href="/services" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">Наши услуги</Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-obsidian to-transparent" />
      </section>

      <section className="content-below-fold relative py-16 sm:py-20 md:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              title="Философия мастерства"
              subtitle="Три принципа, на которых построен каждый визит"
            />
          </Reveal>
          <div className="mt-10 sm:mt-12 md:mt-16 grid gap-4 sm:gap-6 sm:grid-cols-3">
            {[
              { title: 'Мастерство', desc: 'Опыт от 5 лет, регулярное обучение у топ-барберов Европы, победы в чемпионатах', icon: '01' },
              { title: 'Атмосфера', desc: 'Интерьер премиального клуба: кожаные кресла, виски, безупречный сервис', icon: '02' },
              { title: 'Точность', desc: 'Каждая стрижка — индивидуальный проект. Никаких шаблонов, только ваш стиль', icon: '03' },
            ].map((item, i) => (
              <Reveal key={item.title} animation="fade-up" delay={i * 120}>
                <div className="group glass-card rounded-2xl p-6 sm:p-8">
                  <p className="mb-3 sm:mb-4 font-display text-3xl sm:text-4xl font-bold text-gold/20">{item.icon}</p>
                  <h3 className="mb-2 sm:mb-3 font-display text-lg sm:text-xl font-semibold text-ivory">{item.title}</h3>
                  <p className="text-sm text-stone font-body leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Reveal>
        <BarberExperienceDynamic />
      </Reveal>

      <section className="content-below-fold relative py-16 sm:py-20 md:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              title="Наши услуги"
              subtitle="От классической стрижки до королевского бритья"
            />
          </Reveal>
          <div className="mt-10 sm:mt-12 md:mt-16 grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Мужская стрижка', price: '2 500 ₽', time: '60 мин' },
              { name: 'Стрижка машинкой', price: '2 000 ₽', time: '45 мин' },
              { name: 'Королевское бритьё', price: '3 000 ₽', time: '60 мин' },
              { name: 'Моделирование бороды', price: '1 500 ₽', time: '30 мин' },
              { name: 'Стрижка + бритьё', price: '4 000 ₽', time: '90 мин' },
              { name: 'Укладка', price: '1 000 ₽', time: '20 мин' },
            ].map((service, i) => (
              <Reveal key={service.name} animation="fade-up" delay={i * 80}>
                <div className="glass-card group rounded-xl p-5 sm:p-6">
                  <div className="mb-3 h-px w-8 bg-gold/40 transition-all duration-400 group-hover:w-12" />
                  <h3 className="mb-2 font-display text-base sm:text-lg font-semibold text-ivory">{service.name}</h3>
                  <div className="mb-4 flex items-center gap-4 text-sm text-stone font-body">
                    <span>{service.time}</span>
                    <span className="font-semibold text-gold">{service.price}</span>
                  </div>
                  <Link href="/booking">
                    <Button variant="secondary" size="sm" className="w-full">Записаться</Button>
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="content-below-fold relative py-16 sm:py-20 md:py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-espresso/20 to-obsidian" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              title="Голос клиентов"
              subtitle="Что говорят те, кто уже доверил свой стиль"
            />
          </Reveal>
          <div className="mt-10 sm:mt-12 md:mt-16 grid gap-4 sm:gap-6 sm:grid-cols-3">
            {[
              { name: 'Александр', text: 'Лучший барбершоп в Москве! Александр сделал идеальную стрижку, учёл все пожелания. Буду ходить только сюда.', rating: 5 },
              { name: 'Михаил', text: 'Отличная атмосфера, профессиональный подход. Отдельное спасибо за виски и кофе!', rating: 5 },
              { name: 'Дмитрий', text: 'Давно не встречал такого уровня сервиса. Мастер подробно рассказал об уходе за бородой. Рекомендую!', rating: 5 },
            ].map((review, i) => (
              <Reveal key={review.name} animation="fade-up" delay={i * 150}>
                <div className="glass-card rounded-2xl p-6 sm:p-8">
                  <div className="mb-4 sm:mb-6 h-px w-10 sm:w-12 bg-gold/30" />
                  <p className="mb-4 sm:mb-6 text-sm text-ivory/80 font-body leading-relaxed italic">
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {Array.from({ length: review.rating }).map((_, ri) => (
                        <svg key={ri} width="14" height="14" viewBox="0 0 16 16" fill="var(--color-gold)">
                          <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 3.9L8 10.5l-3.6 1.9.7-3.9L2.2 5.2l4-.6L8 1z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-stone font-body">{review.name}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="content-below-fold relative overflow-hidden py-16 sm:py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-espresso/40 to-obsidian" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-gold-glow)_0%,_transparent_50%)] opacity-20" />
        <div className="relative z-10 mx-auto max-w-xl px-4 sm:px-6 text-center">
          <Reveal animation="fade-up" delay={200}>
            <p className="mb-4 font-body text-xs uppercase tracking-[0.3em] text-gold">
              Ваш стиль
            </p>
          </Reveal>
          <Reveal animation="fade-up" delay={350}>
            <h2 className="mb-6 font-display text-3xl font-bold text-ivory sm:text-5xl">
              Запишитесь онлайн
            </h2>
          </Reveal>
          <Reveal animation="scale-in" delay={500}>
            <div className="mx-auto mb-6 h-px w-16 bg-gold/60" />
          </Reveal>
          <Reveal animation="fade-up" delay={600}>
            <p className="mb-8 text-sm text-stone font-body leading-relaxed sm:text-base break-words">
              Выберите удобное время и мастера. Первое посещение — со скидкой 20%.
            </p>
          </Reveal>
          <Reveal animation="scale-in" delay={700}>
            <Link href="/booking">
              <Button size="lg" variant="primary">Выбрать время</Button>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
