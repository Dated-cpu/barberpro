'use client';

import Link from 'next/link';
import { trpc } from '@/trpc/client';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Доброе утро';
  if (hour >= 12 && hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

function QuickAction({ href, label, primary }: { href: string; label: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={
        primary
          ? 'flex min-h-10 items-center justify-center rounded-lg bg-gold text-obsidian text-xs font-semibold font-body hover:bg-gold-light transition-colors'
          : 'flex min-h-10 items-center justify-center rounded-lg border border-gold/20 bg-espresso/60 text-xs text-ivory/90 font-body hover:border-gold/40 hover:text-gold transition-colors'
      }
    >
      {label}
    </Link>
  );
}

export function PersonalWelcome() {
  const { data: user, isLoading } = trpc.auth.me.useQuery(undefined, { retry: false });
  const { data: upcoming, isPending: upcomingPending } = trpc.appointment.myUpcoming.useQuery();

  if (isLoading) {
    return <PersonalWelcomeSkeleton />;
  }

  if (!user || user.role !== 'CLIENT') {
    return null;
  }

  const name = user.firstName || user.email?.split('@')[0] || 'клиент';
  const services = (upcoming?.appointmentServices?.length ?? 0) > 0
    ? upcoming!.appointmentServices!
    : [];

  return (
    <div className="glass-card mt-8 sm:mt-10 w-full max-w-md rounded-2xl p-4 sm:p-5 text-left">
      <p className="mb-3 text-sm text-ivory font-body">
        {greeting()}, <span className="font-semibold text-gold">{name}</span>. Рады видеть вас снова
      </p>

      {upcomingPending ? (
        <div className="mb-3 h-16 rounded-xl border border-gold/10 bg-espresso/40 animate-pulse" />
      ) : upcoming ? (
        <div className="mb-3 rounded-xl border border-gold/10 bg-espresso/40 p-3">
          <p className="mb-1 text-[10px] text-gold/70 font-body uppercase tracking-[0.2em]">
            Ближайшая запись
          </p>
          <p className="text-sm font-medium text-ivory font-body">
            {new Date(upcoming.startTime).toLocaleDateString('ru-RU', {
              weekday: 'short', day: 'numeric', month: 'long',
            })} &middot;{' '}
            {new Date(upcoming.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-xs text-stone font-body">
            {services.length > 0
              ? services.map((s) => s.service.name).join(', ')
              : upcoming.service.name}
            {' '}&middot; {upcoming.barber.firstName} {upcoming.barber.lastName}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        <QuickAction href="/profile?tab=upcoming" label="Моя запись" />
        <QuickAction href="/booking" label="Записаться снова" primary />
        <QuickAction href="/profile?tab=history" label="История" />
      </div>
    </div>
  );
}

function PersonalWelcomeSkeleton() {
  return (
    <div className="glass-card mt-8 sm:mt-10 w-full max-w-md rounded-2xl p-4 sm:p-5 animate-pulse">
      <div className="mb-3 h-4 w-48 rounded bg-espresso/60" />
      <div className="mb-3 h-16 rounded-xl border border-gold/10 bg-espresso/40" />
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded-lg bg-espresso/60" />
        ))}
      </div>
    </div>
  );
}
