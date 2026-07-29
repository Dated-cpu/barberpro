'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает', CONFIRMED: 'Подтверждён', IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершён', CANCELLED: 'Отменён', NO_SHOW: 'Не пришёл',
};

const STATUS_COLORS: Record<string, 'warning' | 'accent' | 'success' | 'error' | 'default'> = {
  PENDING: 'warning', CONFIRMED: 'accent', IN_PROGRESS: 'accent',
  COMPLETED: 'success', CANCELLED: 'error', NO_SHOW: 'error',
};

const statuses = ['ALL', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
type UpdateStatus = 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export default function AdminAppointments() {
  const { addToast } = useToast();
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(30);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState('');

  const { data, isFetching } = trpc.admin.listAllAppointments.useQuery({
    status: filter === 'ALL' ? undefined : filter,
    limit,
  });

  const updateStatusMut = trpc.appointment.updateStatus.useMutation({
    onSuccess: () => { utils.admin.listAllAppointments.invalidate(); addToast('Статус обновлён', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  const rescheduleMut = trpc.appointment.reschedule.useMutation({
    onSuccess: () => { utils.admin.listAllAppointments.invalidate(); setRescheduleId(null); addToast('Время изменено', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  const allItems = data?.items ?? [];

  const filtered = search
    ? allItems.filter((a) =>
        a.clientName.toLowerCase().includes(search.toLowerCase()) ||
        a.barberName.toLowerCase().includes(search.toLowerCase()) ||
        a.serviceName.toLowerCase().includes(search.toLowerCase()),
      )
    : allItems;

  const detailItem = detailId ? allItems.find((a) => a.id === detailId) ?? null : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
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

      <Modal open={!!detailId} onClose={() => setDetailId(null)} title="Детали записи" className="max-w-lg">
        {detailItem ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-text-tertiary font-body">Клиент</p>
                <p className="text-sm text-text-primary font-body">{detailItem.clientName}</p>
                {detailItem.clientPhone ? <p className="text-xs text-text-tertiary font-body">{detailItem.clientPhone}</p> : null}
              </div>
              <div>
                <p className="text-xs text-text-tertiary font-body">Барбер</p>
                <p className="text-sm text-text-primary font-body">{detailItem.barberName}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary font-body">Услуга</p>
                <p className="text-sm text-text-primary font-body">{detailItem.serviceName}</p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary font-body">Статус</p>
                <Badge variant={STATUS_COLORS[detailItem.status] ?? 'default'}>{STATUS_LABELS[detailItem.status] ?? detailItem.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-text-tertiary font-body">Время</p>
                <p className="text-sm text-text-primary font-body">
                  {new Date(detailItem.startTime).toLocaleString('ru-RU')}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary font-body">Стоимость</p>
                <p className="text-sm text-accent font-body">{detailItem.price.toLocaleString()} ₽</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {detailItem.status === 'PENDING' && <Button size="sm" onClick={() => updateStatusMut.mutate({ id: detailItem.id, status: 'CONFIRMED' })}>Подтвердить</Button>}
              {detailItem.status === 'CONFIRMED' && <Button size="sm" onClick={() => updateStatusMut.mutate({ id: detailItem.id, status: 'IN_PROGRESS' })}>Начать</Button>}
              {detailItem.status === 'IN_PROGRESS' && <Button size="sm" variant="primary" onClick={() => updateStatusMut.mutate({ id: detailItem.id, status: 'COMPLETED' })}>Завершить</Button>}
              <Button size="sm" variant="ghost" onClick={() => { setDetailId(null); setRescheduleId(detailItem.id); setRescheduleTime(new Date(detailItem.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })); }}>Перенести</Button>
              <Button size="sm" variant="danger" onClick={() => updateStatusMut.mutate({ id: detailItem.id, status: 'CANCELLED' })}>Отменить</Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-tertiary font-body">Загрузка...</p>
        )}
      </Modal>

      <Modal open={!!rescheduleId} onClose={() => setRescheduleId(null)} title="Перенести запись">
        <div className="flex flex-col gap-4">
          <Input id="rs-time" label="Новое время" type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} required />
          <div className="flex gap-2">
            <Button onClick={() => { if (rescheduleId && rescheduleTime) rescheduleMut.mutate({ id: rescheduleId, startTime: new Date(rescheduleTime).toISOString() }); }} loading={rescheduleMut.isPending}>Сохранить</Button>
            <Button variant="ghost" onClick={() => setRescheduleId(null)}>Отмена</Button>
          </div>
        </div>
      </Modal>

      {isFetching ? (
        <Card className="p-6 text-center"><p className="text-sm text-text-tertiary font-body">Загрузка...</p></Card>
      ) : filtered.length > 0 ? (
        <div className="flex flex-col gap-2">
          {filtered.map((a) => (
            <Card key={a.id} className="flex items-center justify-between p-4 cursor-pointer hover:border-accent/30 transition-all" onClick={() => setDetailId(a.id)}>
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
                <span className="text-xs text-text-tertiary font-body">{a.source}</span>
                <Badge variant={STATUS_COLORS[a.status] ?? 'default'}>{STATUS_LABELS[a.status] ?? a.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center"><p className="text-sm text-text-tertiary font-body">Записи не найдены</p></Card>
      )}

      {data?.nextCursor && (
        <button onClick={() => setLimit((p) => p + 30)} className="self-center text-sm text-accent hover:text-accent/80 transition-colors font-body">
          Загрузить ещё
        </button>
      )}
    </div>
  );
}
