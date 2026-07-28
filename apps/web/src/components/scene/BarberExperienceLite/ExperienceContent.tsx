'use client';

import { usePhaseVisibility } from './ScrollTimeline';
import Link from 'next/link';

const content = {
  craft: {
    title: 'Мастерство',
    subtitle: 'Каждая стрижка — произведение искусства',
    body: 'Наши барберы — не просто специалисты. Это мастера, посвятившие годы изучению мужского стиля. Регулярные стажировки в Европе, работа с премиальными брендами и индивидуальный подход к каждому клиенту.',
  },
  ambiance: {
    title: 'Атмосфера',
    subtitle: 'Пространство, где рождается стиль',
    body: 'Кожаные кресла, приглушённый свет, бокал виски. Мы создали пространство, в котором хочется задержаться. Здесь вы не просто клиент — вы гость.',

  },
  precision: {
    title: 'Точность',
    subtitle: 'Внимание к каждой детали',
    body: 'От идеальной линии пробора до безупречной формы бороды. Мы используем только профессиональные инструменты и премиальную косметику. Результат, который говорит сам за себя.',
  },
};

export function ExperienceContent() {
  const craftVis = usePhaseVisibility('craft', 0.08);
  const ambianceVis = usePhaseVisibility('ambiance', 0.08);
  const precisionVis = usePhaseVisibility('precision', 0.08);
  const ctaVis = usePhaseVisibility('cta', 0.08);

  return (
    <>
      <div
        className="absolute inset-0 z-10 flex items-center justify-center px-6"
        style={{
          opacity: craftVis,
          transform: `translateY(${(1 - craftVis) * 30}px)`,
          transition: 'opacity 0.2s linear, transform 0.6s ease-out',
        }}
      >
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-4 font-body text-xs uppercase tracking-[0.3em] text-gold">
            {content.craft.subtitle}
          </p>
          <h2 className="mb-6 font-display text-3xl font-bold text-ivory sm:text-5xl">
            {content.craft.title}
          </h2>
          <div className="mx-auto mb-6 h-px w-16 bg-gold/60" />
          <p className="text-sm text-stone font-body leading-relaxed sm:text-base">
            {content.craft.body}
          </p>
        </div>
      </div>

      <div
        className="absolute inset-0 z-10 flex items-center justify-center px-6"
        style={{
          opacity: ambianceVis,
          transform: `translateY(${(1 - ambianceVis) * 30}px)`,
          transition: 'opacity 0.2s linear, transform 0.6s ease-out',
        }}
      >
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-4 font-body text-xs uppercase tracking-[0.3em] text-gold">
            {content.ambiance.subtitle}
          </p>
          <h2 className="mb-6 font-display text-3xl font-bold text-ivory sm:text-5xl">
            {content.ambiance.title}
          </h2>
          <div className="mx-auto mb-6 h-px w-16 bg-gold/60" />
          <p className="text-sm text-stone font-body leading-relaxed sm:text-base">
            {content.ambiance.body}
          </p>
        </div>
      </div>

      <div
        className="absolute inset-0 z-10 flex items-center justify-center px-6"
        style={{
          opacity: precisionVis,
          transform: `translateY(${(1 - precisionVis) * 30}px)`,
          transition: 'opacity 0.2s linear, transform 0.6s ease-out',
        }}
      >
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-4 font-body text-xs uppercase tracking-[0.3em] text-gold">
            {content.precision.subtitle}
          </p>
          <h2 className="mb-6 font-display text-3xl font-bold text-ivory sm:text-5xl">
            {content.precision.title}
          </h2>
          <div className="mx-auto mb-6 h-px w-16 bg-gold/60" />
          <p className="text-sm text-stone font-body leading-relaxed sm:text-base">
            {content.precision.body}
          </p>
        </div>
      </div>

      <div
        className="absolute inset-0 z-10 flex items-center justify-center px-6"
        style={{
          opacity: ctaVis,
          transform: `translateY(${(1 - ctaVis) * 30}px)`,
          transition: 'opacity 0.2s linear, transform 0.6s ease-out',
        }}
      >
        <div className="mx-auto max-w-xl text-center">
          <p className="mb-4 font-body text-xs uppercase tracking-[0.3em] text-gold">
            Ваш стиль
          </p>
          <h2 className="mb-6 font-display text-3xl font-bold text-ivory sm:text-5xl">
            Запишитесь онлайн
          </h2>
          <div className="mx-auto mb-6 h-px w-16 bg-gold/60" />
          <p className="mb-8 text-sm text-stone font-body leading-relaxed sm:text-base">
            Выберите удобное время и мастера. Первое посещение — со скидкой 20%.
          </p>
          <Link href="/booking">
            <span className="inline-block rounded-xl border border-gold px-8 py-3 font-body text-sm font-medium text-gold transition-all duration-400 hover:bg-gold-muted hover:shadow-[0_0_25px_var(--color-gold-glow)] sm:text-base">
              Выбрать время
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}
