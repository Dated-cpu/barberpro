import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GoldThread } from '@/components/shared/gold-thread';
import { SectionTitle } from '@/components/shared/section-title';
import { Reveal } from '@/components/shared/reveal';

interface MasterProfile {
  name: string;
  profession: string;
  photoUrl: string | null;
  rating: number;
  reviewCount: number;
  experience: string;
  clientsCount: number;
  specializationTitle: string;
  about: string;
  specializations: Array<{
    title: string;
    desc: string;
    icon: React.ReactNode;
  }>;
}

const master: MasterProfile = {
  name: 'Александр',
  profession: 'Барбер',
  photoUrl: null,
  rating: 4.9,
  reviewCount: 250,
  experience: '7 лет',
  clientsCount: 3500,
  specializationTitle: 'Мужские стрижки и бритьё',
  about: 'Стрижка — это больше, чем просто форма. Это диалог мастера и клиента, где инструмент говорит то, что не скажешь словами. Я работаю с ножницами и машинкой так, чтобы каждый вышел не просто подстриженным — а уверенным в себе. Я слушаю, предлагаю, спорю — и нахожу тот самый силуэт, который идёт именно вам. Мой подход строится на доверии и полном погружении в задачу.',
  specializations: [
    {
      title: 'Стрижки',
      desc: 'Классические и модельные стрижки любой сложности. Работаю с любым типом волос и формой лица.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 15l14-7" /><path d="M5 9l14 7" /><circle cx="5" cy="15" r="2" /><circle cx="19" cy="8" r="2" /><circle cx="19" cy="16" r="2" /><circle cx="5" cy="9" r="2" />
        </svg>
      ),
    },
    {
      title: 'Борода',
      desc: 'Моделирование, коррекция и уход за бородой и усами. Оформление линии роста, придание формы.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8c0 3 1.5 6 3 8h12c1.5-2 3-5 3-8" /><path d="M8 16c.5-2 2-4 4-4s3.5 2 4 4" /><path d="M6 12c1-1 2-2 4-2" /><path d="M18 12c-1-1-2-2-4-2" />
        </svg>
      ),
    },
    {
      title: 'Оформление',
      desc: 'Укладка, камуфляж седины, окрашивание. Индивидуальный подбор стиля и средств ухода.',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18" /><path d="M8 9h8" /><path d="M6 14h12" /><path d="M4 19h16" />
        </svg>
      ),
    },
  ],
};

export const metadata = {
  title: 'Мастер',
  description: 'Ваш мастер BarberPro — профессиональный барбер с опытом 7 лет',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill={star <= Math.round(rating) ? 'var(--color-gold)' : 'var(--color-espresso)'}
          >
            <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 3.9L8 10.5l-3.6 1.9.7-3.9L2.2 5.2l4-.6L8 1z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-medium text-gold font-body">{rating}</span>
      <span className="text-xs text-stone font-body">({master.reviewCount} отзывов)</span>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 text-center">
      <p className="mb-1 font-display text-2xl sm:text-3xl font-bold text-gold">{value}</p>
      <p className="text-xs text-stone font-body uppercase tracking-wider">{label}</p>
    </div>
  );
}

export default function MasterPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[80vh] sm:min-h-screen items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-obsidian to-espresso/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,_var(--color-gold-glow)_0%,_transparent_60%)] opacity-20" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 py-24 md:py-32">
          <div className="flex flex-col items-center text-center gap-6 sm:gap-8">
            <Reveal animation="scale-in" delay={200}>
              <div className="relative">
                <div className="mx-auto h-32 w-32 sm:h-40 sm:w-40 overflow-hidden rounded-full border-2 border-gold/30 bg-espresso shadow-[0_0_40px_var(--color-gold-glow)]">
                  {master.photoUrl ? (
                    <img src={master.photoUrl} alt={master.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-display text-4xl sm:text-5xl font-bold text-gold/60">
                        {master.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-gold text-obsidian shadow-lg">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                </div>
              </div>
            </Reveal>

            <Reveal animation="fade-up" delay={400}>
              <div className="space-y-2">
                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-ivory">
                  {master.name}
                </h1>
                <p className="font-body text-base sm:text-lg text-stone tracking-widest uppercase">
                  {master.profession}
                </p>
              </div>
            </Reveal>

            <Reveal animation="fade-up" delay={500}>
              <StarRating rating={master.rating} />
            </Reveal>

            <Reveal animation="fade-up" delay={600}>
              <GoldThread className="w-16" />
            </Reveal>

            <Reveal animation="fade-up" delay={700}>
              <p className="max-w-md text-sm text-stone font-body leading-relaxed">
                {master.specializationTitle}
              </p>
            </Reveal>

            <Reveal animation="fade-up" delay={800}>
              <Link href="/booking">
                <Button size="lg" variant="primary" className="w-full sm:w-auto min-w-[200px]">
                  Записаться
                </Button>
              </Link>
            </Reveal>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-obsidian to-transparent" />
      </section>

      {/* Experience */}
      <section className="content-below-fold relative py-16 sm:py-20 md:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              title="Опыт и цифры"
              subtitle="За каждым числом — реальные истории и результат"
            />
          </Reveal>
          <div className="mt-10 sm:mt-12 md:mt-16 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
            <Reveal animation="fade-up" delay={100}>
              <StatCard value={master.experience} label="Стаж работы" />
            </Reveal>
            <Reveal animation="fade-up" delay={200}>
              <StatCard value={`${master.clientsCount > 1000 ? `${Math.round(master.clientsCount / 1000)}+` : master.clientsCount}`} label="Довольных клиентов" />
            </Reveal>
            <Reveal animation="fade-up" delay={300}>
              <StatCard value={master.specializationTitle} label="Специализация" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="content-below-fold relative overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-espresso/20 to-obsidian" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <SectionTitle
                title="О мастере"
                subtitle="Философия и подход к работе"
              />
            </Reveal>
            <Reveal animation="fade-up" delay={200}>
              <div className="glass-card relative rounded-2xl p-6 sm:p-8 md:p-10">
                <div className="absolute -top-3 -left-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold text-obsidian">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 11h-4v-4h4v4zm8 0h-4v-4h4v4zm-8 6h-4v-4h4v4zm8 0h-4v-4h4v4z" /></svg>
                </div>
                <p className="text-sm sm:text-base text-ivory/90 font-body leading-relaxed">
                  {master.about}
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-gold/10 pt-6">
                  <div className="h-px flex-1 bg-gold/20" />
                  <p className="font-display text-base font-semibold text-gold">{master.name}</p>
                  <div className="h-px flex-1 bg-gold/20" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Specialization */}
      <section className="content-below-fold relative py-16 sm:py-20 md:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionTitle
              title="Специализация"
              subtitle="Основные направления работы"
            />
          </Reveal>
          <div className="mt-10 sm:mt-12 md:mt-16 grid gap-4 sm:gap-6 sm:grid-cols-3">
            {master.specializations.map((spec, i) => (
              <Reveal key={spec.title} animation="fade-up" delay={i * 120}>
                <div className="glass-card group rounded-2xl p-6 sm:p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 text-gold group-hover:bg-gold/20 transition-colors duration-300">
                    {spec.icon}
                  </div>
                  <h3 className="mb-2 font-display text-lg sm:text-xl font-semibold text-ivory">
                    {spec.title}
                  </h3>
                  <p className="text-sm text-stone font-body leading-relaxed">
                    {spec.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="content-below-fold relative overflow-hidden py-16 sm:py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-espresso/40 to-obsidian" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--color-gold-glow)_0%,_transparent_50%)] opacity-20" />
        <div className="relative z-10 mx-auto max-w-xl px-4 sm:px-6 text-center">
          <Reveal animation="fade-up" delay={200}>
            <p className="mb-4 font-body text-xs uppercase tracking-[0.3em] text-gold">
              Готов к работе
            </p>
          </Reveal>
          <Reveal animation="fade-up" delay={350}>
            <h2 className="mb-6 font-display text-3xl font-bold text-ivory sm:text-5xl">
              Запишитесь на приём
            </h2>
          </Reveal>
          <Reveal animation="scale-in" delay={500}>
            <div className="mx-auto mb-6 h-px w-16 bg-gold/60" />
          </Reveal>
          <Reveal animation="fade-up" delay={600}>
            <p className="mb-8 text-sm text-stone font-body leading-relaxed sm:text-base">
              Выберите удобное время. Первое посещение — со скидкой 20%.
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
