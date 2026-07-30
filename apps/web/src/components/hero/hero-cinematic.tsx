'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/shared/reveal';
import { GoldThread } from '@/components/shared/gold-thread';
import { Button } from '@/components/ui/button';

interface MasterInfo {
  name: string;
  profession: string;
  experience: string;
  rating: number;
  clientsCount: number;
}

interface HeroCinematicProps {
  backgroundImage?: string;
  master?: MasterInfo;
}

function AmbientParticle({ index }: { index: number }) {
  const style = useMemo(() => {
    const left = ((index * 17 + 5) % 100);
    const delay = (index * 1.3) % 8;
    const duration = 6 + ((index * 1.7) % 6);
    const size = 2 + ((index * 0.3) % 2);
    return {
      left: `${left}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
      width: `${size}px`,
      height: `${size}px`,
    } as React.CSSProperties;
  }, [index]);

  return (
    <div
      className="absolute rounded-full bg-gold/10 animate-[float-up_linear_infinite]"
      style={style}
      aria-hidden="true"
    />
  );
}

function LightStreak({ index }: { index: number }) {
  const style = useMemo(() => {
    const top = 20 + ((index * 23) % 60);
    const delay = (index * 2.7) % 6;
    const duration = 4 + ((index * 1.3) % 4);
    return {
      top: `${top}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    } as React.CSSProperties;
  }, [index]);

  return (
    <div
      className="absolute left-1/2 h-px w-1/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-gold/5 to-transparent animate-[streak_linear_infinite]"
      style={style}
      aria-hidden="true"
    />
  );
}

function ScrollIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-[fade-in_0.7s_ease-out_2s_forwards] opacity-0">
      <span className="text-[10px] text-stone font-body uppercase tracking-[0.2em]">
        Scroll
      </span>
      <div className="h-8 w-[1px] bg-gradient-to-b from-gold/40 to-transparent overflow-hidden">
        <div className="h-3 w-full bg-gold/60 rounded-full animate-[scroll-dot_2s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill={star <= Math.round(rating) ? 'var(--color-gold)' : 'var(--color-espresso)'}
          >
            <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 3.9L8 10.5l-3.6 1.9.7-3.9L2.2 5.2l4-.6L8 1z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-medium text-gold font-body">{rating}</span>
    </div>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-gold/10 bg-espresso/60 backdrop-blur-sm px-4 py-2.5">
      <div className="flex items-center text-gold">{icon}</div>
      <span className="text-xs text-ivory/80 font-body whitespace-nowrap">{label}</span>
    </div>
  );
}

export function HeroCinematic({ backgroundImage, master }: HeroCinematicProps) {
  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
  const streaks = useMemo(() => Array.from({ length: 4 }, (_, i) => i), []);

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      {/* Base dark layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-obsidian to-espresso/80" />

      {/* Background image with Ken Burns effect */}
      {backgroundImage ? (
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={backgroundImage}
            alt=""
            fill
            className="object-cover animate-[ken-burns_20s_ease-in-out_infinite_alternate]"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-obsidian/70 via-obsidian/50 to-obsidian/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-obsidian/30 via-transparent to-obsidian/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_var(--color-obsidian)_100%)] opacity-40" />
        </div>
      ) : (
        <>
          {/* Warm ambient glow (no image fallback) */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,_var(--color-gold-glow)_0%,_transparent_50%)] opacity-[0.15]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,_rgba(201,169,110,0.06)_0%,_transparent_40%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,_rgba(139,94,60,0.08)_0%,_transparent_40%)]" />
        </>
      )}

      {/* Light streaks (subtler when image is present) */}
      {streaks.map((i) => (
        <LightStreak key={i} index={i} />
      ))}

      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((i) => (
          <AmbientParticle key={i} index={i} />
        ))}
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.5)] pointer-events-none" />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-obsidian to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 py-24 md:py-32">
        <div className="flex flex-col items-center text-center">
          <Reveal animation="fade-up" delay={200}>
            <p className="mb-4 sm:mb-6 font-body text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gold/80">
              Barber Ritual
            </p>
          </Reveal>

          {master && (
            <Reveal animation="fade-up" delay={350}>
              <h1 className="mb-2 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-ivory">
                {master.name}
              </h1>
              <p className="mb-4 font-body text-sm sm:text-base text-stone tracking-widest uppercase">
                {master.profession}
              </p>
            </Reveal>
          )}

          {master && (
            <Reveal animation="fade-up" delay={500}>
              <div className="mb-6 sm:mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <TrustBadge
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                    </svg>
                  }
                  label={master.experience}
                />
                <TrustBadge
                  icon={<StarRating rating={master.rating} />}
                  label=""
                />
                <TrustBadge
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                  }
                  label={`${master.clientsCount > 1000 ? `${Math.round(master.clientsCount / 1000)}+` : master.clientsCount}`}
                />
              </div>
            </Reveal>
          )}

          <Reveal animation="scale-in" delay={700}>
            <GoldThread className="mb-6 sm:mb-8 w-16 sm:w-20" />
          </Reveal>

          <Reveal animation="fade-up" delay={850}>
            <div className="mb-8 sm:mb-10 space-y-1">
              <p className="text-sm sm:text-base text-stone font-body tracking-wide">
                Точная работа.
              </p>
              <p className="text-sm sm:text-base text-stone font-body tracking-wide">
                Премиальный уход.
              </p>
              <p className="text-sm sm:text-base text-ivory/60 font-body tracking-wide">
                Ваш образ начинается здесь.
              </p>
            </div>
          </Reveal>

          <Reveal animation="scale-in" delay={1000}>
            <Link href="/booking">
              <Button size="lg" variant="primary" className="min-w-[200px]">
                Записаться
              </Button>
            </Link>
          </Reveal>
        </div>
      </div>

      <ScrollIndicator />

      <style>{`
        @keyframes float-up {
          0% { transform: translateY(100vh) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-10vh) translateX(20px); opacity: 0; }
        }
        @keyframes streak {
          0% { opacity: 0; transform: translateX(-50%) scaleX(0); }
          30% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) scaleX(1.5); }
        }
        @keyframes scroll-dot {
          0%, 100% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
        }
        @keyframes ken-burns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.08) translate(-1.5%, -1%); }
        }
      `}</style>
    </section>
  );
}
