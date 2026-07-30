'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/shared/page-header';

const statusColors: Record<string, 'warning' | 'success' | 'error'> = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error' };
const statusLabels: Record<string, string> = { PENDING: 'На модерации', APPROVED: 'Одобрен', REJECTED: 'Отклонён' };

export default function AdminReviews() {
  const { addToast } = useToast();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const utils = trpc.useUtils();
  const { data, isFetching } = trpc.reviews.adminList.useQuery({ status: filter });
  const { data: stats } = trpc.reviews.adminStats.useQuery();

  const moderateMut = trpc.reviews.adminModerate.useMutation({
    onSuccess: () => { utils.reviews.adminList.invalidate(); utils.reviews.adminStats.invalidate(); addToast('Статус отзыва обновлён', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  const deleteMut = trpc.reviews.adminDelete.useMutation({
    onSuccess: () => { utils.reviews.adminList.invalidate(); utils.reviews.adminStats.invalidate(); addToast('Отзыв удалён', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Отзывы" action={
        stats ? (
          <div className="flex gap-3 text-sm text-text-tertiary font-body">
            <span>Всего: {stats.total}</span>
            <span className="text-warning">Ожидают: {stats.pending}</span>
          </div>
        ) : null
      } />

      <div className="flex gap-2">
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors font-body ${
              filter === s ? 'border-accent bg-accent-muted text-accent' : 'border-border text-text-secondary hover:border-accent/50'
            }`}>
            {s === 'ALL' ? 'Все' : statusLabels[s] ?? s}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {isFetching ? (
          <Card className="p-6 text-center"><p className="text-sm text-text-tertiary font-body">Загрузка...</p></Card>
        ) : data?.items && data.items.length > 0 ? (
          data.items.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary font-body">{r.clientName}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} width="12" height="12" viewBox="0 0 16 16" fill={i < r.rating ? 'var(--color-accent)' : 'var(--color-bg-tertiary)'}>
                          <path d="M8 1l1.8 3.6 4 .6-2.9 2.8.7 3.9L8 10.5l-3.6 1.9.7-3.9L2.2 5.2l4-.6L8 1z"/>
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-text-tertiary font-body">{r.serviceName} • {r.barberName}</p>
                </div>
                <Badge variant={statusColors[r.status]}>{statusLabels[r.status]}</Badge>
              </div>
              {r.text ? <p className="mb-3 text-sm text-text-secondary font-body leading-relaxed">{r.text}</p> : null}
              <div className="flex gap-2">
                {r.status === 'PENDING' ? (
                  <>
                    <Button size="sm" variant="primary" onClick={() => moderateMut.mutate({ reviewId: r.id, status: 'APPROVED' })}>Одобрить</Button>
                    <Button size="sm" variant="danger" onClick={() => moderateMut.mutate({ reviewId: r.id, status: 'REJECTED' })}>Отклонить</Button>
                  </>
                ) : null}
                <Button size="sm" variant="ghost" onClick={() => deleteMut.mutate({ reviewId: r.id })}>Удалить</Button>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-6 text-center"><p className="text-sm text-text-tertiary font-body">Нет отзывов</p></Card>
        )}
      </div>
    </div>
  );
}
