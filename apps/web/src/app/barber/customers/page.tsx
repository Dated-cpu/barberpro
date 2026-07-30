'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { PageHeader } from '@/components/shared/page-header';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает', CONFIRMED: 'Подтверждён', IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершён', CANCELLED: 'Отменён', NO_SHOW: 'Не пришёл',
};

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isFetching } = trpc.customers.list.useQuery({ search: search || undefined });
  const { data: customerDetail, isFetching: detailLoading } = trpc.customers.getById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId },
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Клиенты" action={
        <Input
          id="search-customers"
          placeholder="Поиск по имени или телефону..."
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      } />

      {isFetching ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : data?.items && data.items.length > 0 ? (
        <div className="flex flex-col gap-2">
          {data.items.map((c) => (
            <Card key={c.id} className="flex items-center justify-between p-4 cursor-pointer hover:border-accent/30 transition-all" variant="elevated" onClick={() => setSelectedId(c.id)}>
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent font-body">
                  {c.firstName[0]}{c.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary font-body">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-text-tertiary font-body">{c.phone ?? 'нет телефона'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge>{c.totalVisits} записей</Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center" variant="elevated">
          <p className="text-sm text-text-tertiary font-body">Клиенты не найдены</p>
        </Card>
      )}

      <Modal open={!!selectedId} onClose={() => setSelectedId(null)} title="Информация о клиенте" className="max-w-xl">
        {detailLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : customerDetail ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-muted text-lg font-semibold text-accent font-body">
                {customerDetail.firstName[0]}{customerDetail.lastName[0]}
              </div>
              <div>
                <p className="text-lg font-semibold text-text-primary font-body">{customerDetail.firstName} {customerDetail.lastName}</p>
                <p className="text-sm text-text-tertiary font-body">{customerDetail.phone ?? 'нет телефона'}</p>
                {customerDetail.email && <p className="text-xs text-text-tertiary font-body">{customerDetail.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Card className="p-3 text-center" variant="elevated">
                <p className="text-2xl font-bold text-text-primary font-display">{customerDetail.totalVisits}</p>
                <p className="text-xs text-text-tertiary font-body">Визитов</p>
              </Card>
              <Card className="p-3 text-center" variant="elevated">
                <p className="text-2xl font-bold text-accent font-display">{customerDetail.totalSpent.toLocaleString()} ₽</p>
                <p className="text-xs text-text-tertiary font-body">Потрачено</p>
              </Card>
              <Card className="p-3 text-center" variant="elevated">
                <p className="text-sm font-bold text-text-primary font-display">{customerDetail.favoriteService ?? '—'}</p>
                <p className="text-xs text-text-tertiary font-body">Любимая услуга</p>
              </Card>
            </div>

            <div>
              <h3 className="mb-2 font-display text-sm font-semibold text-text-primary">История записей</h3>
              {customerDetail.appointments.length > 0 ? (
                <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                  {customerDetail.appointments.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-bg-secondary px-3 py-2">
                      <div>
                        <p className="text-xs text-text-secondary font-body">
                          {new Date(a.startTime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-text-primary font-body">{a.serviceName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-accent font-body">{a.price.toLocaleString()} ₽</span>
                        <Badge variant={a.status === 'COMPLETED' ? 'success' : a.status === 'CANCELLED' ? 'error' : a.status === 'IN_PROGRESS' ? 'accent' : 'default'}>
                          {STATUS_LABELS[a.status] ?? a.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-tertiary font-body">Нет записей</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-tertiary font-body">Клиент не найден</p>
        )}
      </Modal>
    </div>
  );
}
