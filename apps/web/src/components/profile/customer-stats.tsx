'use client';

import { trpc } from '@/trpc/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CustomerStats() {
  const { data: stats, isPending } = trpc.appointment.myStats.useQuery();

  if (isPending) {
    return <CustomerStatsSkeleton />;
  }

  if (!stats || stats.totalVisits === 0) {
    return (
      <div className="rounded-xl border border-border bg-bg-secondary p-5 text-center">
        <p className="text-sm text-text-tertiary font-body mb-3">
          У вас пока нет посещений
        </p>
        <Link href="/booking">
          <Button size="sm">Записаться впервые</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard
        label="Визитов"
        value={`${stats.totalVisits}`}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        }
      />
      <StatCard
        label="Потрачено"
        value={`${stats.totalSpent.toLocaleString('ru-RU')} ₽`}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
        }
      />
      <StatCard
        label="Средний чек"
        value={`${stats.avgCheck.toLocaleString('ru-RU')} ₽`}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      />
      {stats.lastVisitDate && (
        <StatCard
          label="Последний визит"
          value={new Date(stats.lastVisitDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          }
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-bg-elevated p-3.5">
      <div className="flex items-center gap-1.5 text-text-tertiary">
        {icon}
        <span className="text-xs font-body">{label}</span>
      </div>
      <p className="text-sm font-semibold text-text-primary font-body truncate">{value}</p>
    </div>
  );
}

function CustomerStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-16 rounded-xl bg-bg-elevated animate-pulse" />
      ))}
    </div>
  );
}
