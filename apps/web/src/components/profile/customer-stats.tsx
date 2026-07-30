'use client';

import { trpc } from '@/trpc/client';

export function CustomerStats() {
  const { data: stats, isPending } = trpc.appointment.myStats.useQuery();

  if (isPending) {
    return <CustomerStatsSkeleton />;
  }

  if (!stats || stats.totalVisits === 0) {
    return null;
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
      {stats.favoriteService && (
        <StatCard
          label="Любимая услуга"
          value={stats.favoriteService.name}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          }
        />
      )}
      {stats.favoriteBarber && (
        <StatCard
          label="Любимый мастер"
          value={stats.favoriteBarber.name}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
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
