'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const statusMap: Record<string, string> = {
  PENDING: 'Ожидает', CONFIRMED: 'Подтверждён', IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершён', CANCELLED: 'Отменён', NO_SHOW: 'Не пришёл',
};

const statusColors: Record<string, 'warning' | 'accent' | 'success' | 'error' | 'default'> = {
  PENDING: 'warning', CONFIRMED: 'accent', IN_PROGRESS: 'accent',
  COMPLETED: 'success', CANCELLED: 'error', NO_SHOW: 'error',
};

export default function AppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const today = new Date().toISOString().slice(0, 10);

  const { data: todayData } = trpc.dashboard.today.useQuery({ date: today });

  const filtered = (todayData?.appointments ?? []).filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (search && !a.clientName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-primary">Записи</h1>
        <Input
          id="search"
          placeholder="Поиск клиента..."
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors font-body ${
              statusFilter === s ? 'border-accent bg-accent-muted text-accent' : 'border-border text-text-secondary hover:border-accent/50'
            }`}
          >
            {s === 'ALL' ? 'Все' : statusMap[s] ?? s}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length > 0 ? (
          filtered.map((a) => (
            <Card key={a.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <p className="min-w-[60px] font-body text-sm font-medium text-text-primary">
                  {new Date(a.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div>
                  <p className="text-sm text-text-primary font-body">{a.clientName}</p>
                  <p className="text-xs text-text-tertiary font-body">
                    {a.serviceName} • {a.clientPhone ?? 'нет телефона'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={statusColors[a.status] ?? 'default'}>{statusMap[a.status] ?? a.status}</Badge>
                <span className="text-sm text-accent font-body">{a.price.toLocaleString()} ₽</span>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-6 text-center">
            <p className="text-sm text-text-tertiary font-body">Записей не найдено</p>
          </Card>
        )}
      </div>
    </div>
  );
}
