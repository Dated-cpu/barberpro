'use client';

import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminOverview() {
  const { data, isFetching } = trpc.dashboard.adminOverview.useQuery();

  if (isFetching) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-2xl font-bold text-text-primary">Обзор</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5"><Skeleton className="h-16" /></Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Барберы', value: data?.totalBarbers ?? 0, icon: '💈' },
    { label: 'Клиенты', value: data?.totalClients ?? 0, icon: '👤' },
    { label: 'Записи всего', value: data?.totalAppointments ?? 0, icon: '📅' },
    { label: 'Выручка', value: `${(data?.totalRevenue ?? 0).toLocaleString()} ₽`, icon: '💰' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-text-primary">Обзор</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-4 p-5">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-xs text-text-tertiary font-body">{s.label}</p>
              <p className="text-xl font-bold text-text-primary font-display">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
