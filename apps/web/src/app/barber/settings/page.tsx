'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function SettingsPage() {
  const { addToast } = useToast();
  const utils = trpc.useUtils();
  const { data: workingDays } = trpc.settings.getWorkingDays.useQuery();
  const { data: blockedSlots } = trpc.settings.getBlockedSlots.useQuery();

  const [blockReason, setBlockReason] = useState('');
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');

  const [editingDay, setEditingDay] = useState<{ dayOfWeek: number; startTime: string; endTime: string; isDayOff: boolean; id?: string } | null>(null);

  const upsertDayMut = trpc.settings.upsertWorkingDay.useMutation({
    onSuccess: () => { utils.settings.getWorkingDays.invalidate(); addToast('Расписание сохранено', 'success'); setEditingDay(null); },
  });

  const createBlockMut = trpc.settings.createBlockedSlot.useMutation({
    onSuccess: () => { utils.settings.getBlockedSlots.invalidate(); addToast('Блокировка создана', 'success'); setBlockReason(''); setBlockStart(''); setBlockEnd(''); },
  });

  const deleteBlockMut = trpc.settings.deleteBlockedSlot.useMutation({
    onSuccess: () => { utils.settings.getBlockedSlots.invalidate(); addToast('Блокировка удалена', 'success'); },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="mb-6 font-display text-2xl font-bold text-text-primary">Настройки</h1>
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Рабочее расписание</h2>
        <div className="flex flex-col gap-2">
          {dayNames.map((name, i) => {
            const dayOfWeek = i + 1;
            const wd = workingDays?.find((d) => d.dayOfWeek === dayOfWeek);
            const isEditing = editingDay?.dayOfWeek === dayOfWeek;
            return (
              <Card key={dayOfWeek} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <p className="min-w-[32px] font-body text-sm font-medium text-text-primary">{name}</p>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      {editingDay.isDayOff ? (
                        <p className="text-sm text-text-tertiary font-body">Выходной</p>
                      ) : (
                        <>
                          <Input id={`start-${dayOfWeek}`} type="time" value={editingDay.startTime} onChange={(e) => setEditingDay({ ...editingDay, startTime: e.target.value })} className="w-28" />
                          <span className="text-text-tertiary">—</span>
                          <Input id={`end-${dayOfWeek}`} type="time" value={editingDay.endTime} onChange={(e) => setEditingDay({ ...editingDay, endTime: e.target.value })} className="w-28" />
                        </>
                      )}
                      <label className="flex items-center gap-2 text-xs text-text-secondary font-body">
                        <input type="checkbox" checked={editingDay.isDayOff} onChange={(e) => setEditingDay({ ...editingDay, isDayOff: e.target.checked })} />
                        Выходной
                      </label>
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary font-body">
                      {wd ? (wd.isDayOff ? 'Выходной' : `${wd.startTime} — ${wd.endTime}`) : 'Не настроено'}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={() => upsertDayMut.mutate(editingDay)}>Сохранить</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingDay(null)}>Отмена</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setEditingDay({ dayOfWeek, startTime: wd?.startTime ?? '09:00', endTime: wd?.endTime ?? '19:00', isDayOff: wd?.isDayOff ?? false, id: wd?.id })}>Изменить</Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Блокировка слотов</h2>
        <Card className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <Input id="block-start" label="Начало" type="datetime-local" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} className="flex-1" />
            <Input id="block-end" label="Конец" type="datetime-local" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} className="flex-1" />
            <Input id="block-reason" label="Причина" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} className="flex-1" />
            <Button size="sm" onClick={() => { if (blockStart && blockEnd) createBlockMut.mutate({ startTime: new Date(blockStart).toISOString(), endTime: new Date(blockEnd).toISOString(), reason: blockReason || null }); }}>
              Добавить
            </Button>
          </div>
        </Card>
        {blockedSlots && blockedSlots.length > 0 ? (
          <div className="mt-2 flex flex-col gap-2">
            {blockedSlots.map((s) => (
              <Card key={s.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm text-text-primary font-body">
                    {new Date(s.startTime).toLocaleString('ru-RU')} — {new Date(s.endTime).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {s.reason ? <p className="text-xs text-text-tertiary font-body">{s.reason}</p> : null}
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteBlockMut.mutate({ id: s.id })}>Удалить</Button>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
