'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/page-header';

type ViewMode = 'day' | 'week';
type UpdateStatus = 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

const HOURS = Array.from({ length: 10 }, (_, i) => i + 8); // 08:00 – 17:00
const STATUS_ACTIONS: { label: string; status: UpdateStatus; color: string }[] = [
  { label: 'Подтвердить', status: 'CONFIRMED', color: 'border-accent text-accent hover:bg-accent-muted' },
  { label: 'Начать', status: 'IN_PROGRESS', color: 'border-warning text-warning hover:bg-warning/10' },
  { label: 'Завершить', status: 'COMPLETED', color: 'border-success text-success hover:bg-success/10' },
  { label: 'Отменить', status: 'CANCELLED', color: 'border-red-500 text-red-500 hover:bg-red-500/10' },
  { label: 'Не пришёл', status: 'NO_SHOW', color: 'border-red-500/50 text-red-500/70 hover:bg-red-500/5' },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает', CONFIRMED: 'Подтв.', IN_PROGRESS: 'В работе',
  COMPLETED: 'Готово', CANCELLED: 'Отменён', NO_SHOW: 'Не пришёл',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'border-l-warning', CONFIRMED: 'border-l-accent',
  IN_PROGRESS: 'border-l-warning', COMPLETED: 'border-l-success',
  CANCELLED: 'border-l-red-500', NO_SHOW: 'border-l-red-500/50',
};

export default function CalendarPage() {
  const { addToast } = useToast();
  const utils = trpc.useUtils();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [showManualCreate, setShowManualCreate] = useState(false);
  const [showBlockSlot, setShowBlockSlot] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [newAppt, setNewAppt] = useState({ clientName: '', clientPhone: '', startTime: '', serviceId: '' });
  const [blockSlot, setBlockSlot] = useState({ startTime: '', endTime: '', reason: '' });
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);

  const { data: services } = trpc.services.list.useQuery({ includeInactive: false });

  const weekStart = useMemo(() => {
    const d = new Date(selectedDate + 'T00:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
  }, [selectedDate]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart + 'T00:00:00');
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  }, [weekStart]);

  const { data: appointments, isFetching } = trpc.dashboard.calendar.useQuery({
    startDate: viewMode === 'day' ? selectedDate : weekStart,
    endDate: viewMode === 'day' ? selectedDate : weekEnd,
  });

  const { data: blockedSlots } = trpc.settings.getBlockedSlots.useQuery();

  const updateStatusMut = trpc.appointment.updateStatus.useMutation({
    onSuccess: () => { utils.dashboard.calendar.invalidate(); addToast('Статус обновлён', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  const rescheduleMut = trpc.appointment.reschedule.useMutation({
    onSuccess: () => { utils.dashboard.calendar.invalidate(); setRescheduleId(null); addToast('Время изменено', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  const createManualMut = trpc.appointment.createManual.useMutation({
    onSuccess: () => { utils.dashboard.calendar.invalidate(); setShowManualCreate(false); setNewAppt({ clientName: '', clientPhone: '', startTime: '', serviceId: '' }); addToast('Запись создана', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  const createBlockMut = trpc.settings.createBlockedSlot.useMutation({
    onSuccess: () => { utils.settings.getBlockedSlots.invalidate(); setShowBlockSlot(false); setBlockSlot({ startTime: '', endTime: '', reason: '' }); addToast('Блокировка создана', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  const weekDays = useMemo(() => {
    const days = [];
    const start = new Date(weekStart + 'T00:00:00');
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, [weekStart]);

  const today = new Date().toISOString().slice(0, 10);

  const dayAppointments = useMemo(() =>
    appointments?.filter((a) => a.startTime.slice(0, 10) === selectedDate) ?? [],
  [appointments, selectedDate]);

  const dayBlocks = useMemo(() =>
    blockedSlots?.filter((s) => s.startTime.slice(0, 10) === selectedDate) ?? [],
  [blockedSlots, selectedDate]);

  function handleStatusChange(id: string, status: UpdateStatus) {
    updateStatusMut.mutate({ id, status });
  }

  function handleReschedule() {
    if (!rescheduleId || !rescheduleTime) return;
    rescheduleMut.mutate({ id: rescheduleId, startTime: new Date(selectedDate + 'T' + rescheduleTime).toISOString() });
  }

  function getAppointmentStyle(startTime: string, endTime: string) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const top = ((start.getHours() - 8) * 60 + start.getMinutes()) * 1.5;
    const height = Math.max((end.getTime() - start.getTime()) / (1000 * 60) * 1.5, 24);
    return { top: `${top}px`, height: `${height}px` };
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Календарь" action={
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => { setShowManualCreate(true); setNewAppt({ ...newAppt, startTime: new Date().toISOString().slice(0, 16) }); }}>+ Запись</Button>
          <Button size="sm" variant="secondary" onClick={() => setShowBlockSlot(true)}>Блокировка</Button>
          <div className="flex gap-1 rounded-xl border border-border bg-bg-secondary p-1">
            <button onClick={() => setViewMode('day')} className={cn('rounded-lg px-4 py-2 text-sm transition-colors font-body', viewMode === 'day' ? 'bg-accent text-text-inverse' : 'text-text-secondary hover:text-text-primary')}>День</button>
            <button onClick={() => setViewMode('week')} className={cn('rounded-lg px-4 py-2 text-sm transition-colors font-body', viewMode === 'week' ? 'bg-accent text-text-inverse' : 'text-text-secondary hover:text-text-primary')}>Неделя</button>
          </div>
        </div>
      } />

      {/* Manual Create Modal */}
      <Modal open={showManualCreate} onClose={() => setShowManualCreate(false)} title="Создать запись">
        <form onSubmit={(e) => { e.preventDefault(); if (newAppt.clientName && newAppt.startTime && newAppt.serviceId) createManualMut.mutate({ clientName: newAppt.clientName, clientPhone: newAppt.clientPhone, startTime: new Date(newAppt.startTime).toISOString(), serviceId: newAppt.serviceId }); }} className="flex flex-col gap-4">
          <Input id="mc-name" label="Имя клиента" value={newAppt.clientName} onChange={(e) => setNewAppt({ ...newAppt, clientName: e.target.value })} required />
          <Input id="mc-phone" label="Телефон" value={newAppt.clientPhone} onChange={(e) => setNewAppt({ ...newAppt, clientPhone: e.target.value })} required />
          <Input id="mc-time" label="Время" type="datetime-local" value={newAppt.startTime} onChange={(e) => setNewAppt({ ...newAppt, startTime: e.target.value })} required />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-tertiary font-body">Услуга</label>
            <select value={newAppt.serviceId} onChange={(e) => setNewAppt({ ...newAppt, serviceId: e.target.value })} required className="rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary font-body">
              <option value="">Выберите услугу</option>
              {services?.map((s) => <option key={s.id} value={s.id}>{s.name} — {Number(s.price).toLocaleString()} ₽</option>)}
            </select>
          </div>
          <Button type="submit" loading={createManualMut.isPending}>Создать</Button>
        </form>
      </Modal>

      {/* Block Slot Modal */}
      <Modal open={showBlockSlot} onClose={() => setShowBlockSlot(false)} title="Блокировка времени">
        <form onSubmit={(e) => { e.preventDefault(); if (blockSlot.startTime && blockSlot.endTime) createBlockMut.mutate({ startTime: new Date(blockSlot.startTime).toISOString(), endTime: new Date(blockSlot.endTime).toISOString(), reason: blockSlot.reason || null }); }} className="flex flex-col gap-4">
          <Input id="bs-start" label="Начало" type="datetime-local" value={blockSlot.startTime} onChange={(e) => setBlockSlot({ ...blockSlot, startTime: e.target.value })} required />
          <Input id="bs-end" label="Конец" type="datetime-local" value={blockSlot.endTime} onChange={(e) => setBlockSlot({ ...blockSlot, endTime: e.target.value })} required />
          <Input id="bs-reason" label="Причина" value={blockSlot.reason} onChange={(e) => setBlockSlot({ ...blockSlot, reason: e.target.value })} />
          <Button type="submit" loading={createBlockMut.isPending}>Заблокировать</Button>
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal open={!!rescheduleId} onClose={() => setRescheduleId(null)} title="Изменить время">
        <div className="flex flex-col gap-4">
          <Input id="rs-time" label="Новое время" type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} required />
          <div className="flex gap-2">
            <Button onClick={handleReschedule} loading={rescheduleMut.isPending}>Сохранить</Button>
            <Button variant="secondary" onClick={() => setRescheduleId(null)}>Отмена</Button>
          </div>
        </div>
      </Modal>

      {/* Week Day Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {weekDays.map((d) => {
          const date = new Date(d + 'T12:00:00');
          const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
          const dayNum = date.getDate();
          const isToday = d === today;
          const isSelected = d === selectedDate;
          const dayApps = appointments?.filter((a) => a.startTime.slice(0, 10) === d) ?? [];
          return (
            <button
              key={d}
              onClick={() => { setSelectedDate(d); setViewMode('day'); }}
              className={cn(
                'flex min-w-[72px] flex-col items-center gap-1 rounded-xl border p-3 transition-all duration-200',
                isSelected ? 'border-accent bg-accent-muted' : isToday ? 'border-accent/30' : 'border-border bg-bg-elevated hover:border-accent/50',
              )}
            >
              <span className="text-xs text-text-tertiary font-body">{dayName}</span>
              <span className={cn('text-lg font-semibold font-display', isSelected ? 'text-accent' : isToday ? 'text-accent' : 'text-text-primary')}>{dayNum}</span>
              {dayApps.length > 0 && <span className="text-xs text-accent font-body">{dayApps.length}</span>}
            </button>
          );
        })}
      </div>

      {/* Day View — Time Grid */}
      {viewMode === 'day' ? (
        <div className="relative rounded-xl border border-border bg-bg-elevated">
          {/* Time labels */}
          <div className="pointer-events-none sticky top-0 z-10 bg-bg-elevated">
            {HOURS.map((h) => (
              <div key={h} className="flex" style={{ height: '90px' }}>
                <div className="w-16 border-r border-border px-2 pt-0 text-xs text-text-tertiary font-body">
                  {String(h).padStart(2, '0')}:00
                </div>
                <div className="flex-1 border-b border-border/30" />
              </div>
            ))}
          </div>

          {/* Appointment blocks */}
          <div className="absolute left-16 right-0 top-0" style={{ height: `${HOURS.length * 90}px` }}>
            {isFetching ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-text-tertiary font-body">Загрузка...</p>
              </div>
            ) : (
              <>
                {dayAppointments.map((a) => {
                  const style = getAppointmentStyle(a.startTime, a.endTime);
                  const isSelected = selectedAppointment === a.id;
                  return (
                    <div
                      key={a.id}
                      className={cn(
                        'absolute left-1 right-1 rounded-lg border-l-4 bg-bg-secondary px-3 py-2 text-xs transition-all hover:shadow-lg cursor-pointer overflow-hidden',
                        STATUS_COLORS[a.status] ?? 'border-l-accent',
                        isSelected && 'ring-2 ring-accent z-20',
                      )}
                      style={style}
                      onClick={() => setSelectedAppointment(isSelected ? null : a.id)}
                    >
                      <p className="font-medium text-text-primary">
                        {new Date(a.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="truncate text-text-primary font-medium">{a.client.firstName} {a.client.lastName}</p>
                      <p className="truncate text-text-tertiary">{a.service.name}</p>
                      {isSelected && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {STATUS_ACTIONS.filter((act) => act.status !== a.status && act.status !== 'NO_SHOW').map((act) => (
                            <button
                              key={act.status}
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(a.id, act.status); }}
                              className={cn('rounded border px-2 py-0.5 text-[10px] transition-colors', act.color)}
                            >
                              {act.label}
                            </button>
                          ))}
                          <button
                            onClick={(e) => { e.stopPropagation(); setRescheduleId(a.id); setRescheduleTime(new Date(a.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })); }}
                            className="rounded border border-border text-text-secondary hover:bg-bg-tertiary px-2 py-0.5 text-[10px] transition-colors"
                          >
                            Перенести
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Blocked slots */}
                {dayBlocks.map((s) => (
                  <div
                    key={s.id}
                    className="absolute left-1 right-1 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs"
                    style={{
                      top: `${(new Date(s.startTime).getHours() - 8) * 90 + new Date(s.startTime).getMinutes() * 1.5}px`,
                      height: `${Math.max((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60) * 1.5, 24)}px`,
                    }}
                  >
                    <p className="text-red-500 font-medium">Заблокировано</p>
                    {s.reason && <p className="text-red-500/70 truncate">{s.reason}</p>}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      ) : (
        /* Week View — Simple list */
        <div className="flex flex-col gap-2">
          {isFetching ? (
            <Card className="p-6 text-center"><p className="text-sm text-text-tertiary font-body">Загрузка...</p></Card>
          ) : dayAppointments.length > 0 ? (
            dayAppointments.map((a) => (
              <Card key={a.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <p className="min-w-[60px] font-body text-sm font-medium text-text-primary">
                    {new Date(a.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div>
                    <p className="text-sm text-text-primary font-body">{a.client.firstName} {a.client.lastName}</p>
                    <p className="text-xs text-text-tertiary font-body">{a.service.name} • {a.service.duration} мин</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {STATUS_ACTIONS.filter((act) => act.status !== a.status).slice(0, 2).map((act) => (
                      <button
                        key={act.status}
                        onClick={() => handleStatusChange(a.id, act.status)}
                        className={cn('rounded border px-2 py-0.5 text-[10px] transition-colors', act.color)}
                      >
                        {act.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-sm text-accent font-body">{Number(a.priceAtBooking).toLocaleString()} ₽</span>
                  <Badge variant={a.status === 'PENDING' ? 'warning' : a.status === 'CONFIRMED' ? 'accent' : a.status === 'COMPLETED' ? 'success' : 'default'}>
                    {STATUS_LABELS[a.status] ?? a.status}
                  </Badge>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-6 text-center">
              <p className="text-sm text-text-tertiary font-body">Нет записей на этот день</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
