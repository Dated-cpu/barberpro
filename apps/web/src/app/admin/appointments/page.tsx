'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает', CONFIRMED: 'Подтверждён', IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершён', CANCELLED: 'Отменён', NO_SHOW: 'Не пришёл',
};

const STATUS_COLORS: Record<string, 'warning' | 'accent' | 'success' | 'error' | 'default'> = {
  PENDING: 'warning', CONFIRMED: 'accent', IN_PROGRESS: 'accent',
  COMPLETED: 'success', CANCELLED: 'error', NO_SHOW: 'error',
};

const statuses = ['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;

export default function AdminAppointments() {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(30);

  const { data, isFetching } = trpc.admin.listAllAppointments.useQuery({
    status: filter === 'ALL' ? undefined : filter,
    limit,
  });

  const allItems = data?.items ?? [];

  const filtered = search
    ? allItems.filter((a) =>
        a.clientName.toLowerCase().includes(search.toLowerCase()) ||
        a.barberName.toLowerCase().includes(search.toLowerCase()) ||
        a.serviceName.toLowerCase().includes(search.toLowerCase()),
      )
    : allItems;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-primary">Все записи</h1>
        <Input id="apt-search" placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button key={s} onClick={() => { setFilter(s); setLimit(30); }}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors font-body ${
              filter === s ? 'border-accent bg-accent-muted text-accent' : 'border-border text-text-secondary hover:border-accent/50'
            }`}>
            {STATUS_LABELS[s] ?? 'Все'}
          </button>
        ))}
      </div>

      {isFetching ? (
        <Card className="p-6 text-center"><p className="text-sm text-text-tertiary font-body">Загрузка...</p></Card>
      ) : filtered.length > 0 ? (
        <div className="flex flex-col gap-2">
          {filtered.map((a) => (
            <Card key={a.id} className="flex items-center justify-between p-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text-primary font-body">{a.clientName}</p>
                  <span className="text-xs text-text-tertiary font-body">→ {a.barberName}</span>
                </div>
                <p className="text-xs text-text-tertiary font-body">
                  {new Date(a.startTime).toLocaleDateString('ru-RU')} {new Date(a.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  {' · '}{a.serviceName}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-accent font-body">{a.price.toLocaleString()} ₽</span>
                <Badge variant={STATUS_COLORS[a.status] ?? 'default'}>{STATUS_LABELS[a.status] ?? a.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center"><p className="text-sm text-text-tertiary font-body">Записи не найдены</p></Card>
      )}

      {data?.nextCursor && (
        <button
          onClick={() => setLimit((p) => p + 30)}
          className="self-center text-sm text-accent hover:text-accent/80 transition-colors font-body"
        >
          Загрузить ещё
        </button>
      )}
    </div>
  );
}
