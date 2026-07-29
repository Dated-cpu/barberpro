'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useToast } from '@/components/ui/toast';

const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function AdminSettings() {
  const { addToast } = useToast();
  const utils = trpc.useUtils();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: workingDays } = trpc.settings.getWorkingDays.useQuery();

  const [profileForm, setProfileForm] = useState<Record<string, string> | null>(null);
  const [editingDay, setEditingDay] = useState<{ dayOfWeek: number; startTime: string; endTime: string; isDayOff: boolean; id?: string } | null>(null);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [socialInsta, setSocialInsta] = useState('');
  const [socialTelegram, setSocialTelegram] = useState('');
  const [socialWhatsapp, setSocialWhatsapp] = useState('');

  const updateProfileMut = trpc.settings.updateProfile.useMutation({
    onSuccess: () => { utils.auth.me.invalidate(); addToast('Профиль обновлён', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  const upsertDayMut = trpc.settings.upsertWorkingDay.useMutation({
    onSuccess: () => { utils.settings.getWorkingDays.invalidate(); addToast('Расписание сохранено', 'success'); setEditingDay(null); },
  });

  function handleProfileSave() {
    if (!profileForm) return;
    updateProfileMut.mutate({ firstName: profileForm.firstName, lastName: profileForm.lastName, phone: profileForm.phone });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Profile */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Профиль</h2>
        <Card className="p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="pf-firstname" label="Имя" value={profileForm?.firstName ?? user?.firstName ?? ''}
              onChange={(e) => setProfileForm({ ...(profileForm ?? { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '' }), firstName: e.target.value })} />
            <Input id="pf-lastname" label="Фамилия" value={profileForm?.lastName ?? user?.lastName ?? ''}
              onChange={(e) => setProfileForm({ ...(profileForm ?? { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '' }), lastName: e.target.value })} />
            <Input id="pf-phone" label="Телефон" value={profileForm?.phone ?? user?.phone ?? ''}
              onChange={(e) => setProfileForm({ ...(profileForm ?? { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '' }), phone: e.target.value })} />
            <Input id="pf-email" label="Email" value={user?.email ?? ''} disabled className="opacity-50" />
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-text-tertiary font-body">Описание</label>
              <textarea className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary font-body placeholder:text-text-tertiary/50"
                placeholder="Краткое описание вас и ваших услуг" rows={3}
                value={profileForm?.description ?? ''}
                onChange={(e) => setProfileForm({ ...(profileForm ?? { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', phone: user?.phone ?? '' }), description: e.target.value })} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={handleProfileSave} loading={updateProfileMut.isPending}>Сохранить</Button>
          </div>
        </Card>
      </div>

      {/* Social */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Социальные сети</h2>
        <Card className="p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input id="soc-insta" label="Instagram" placeholder="@username" value={socialInsta} onChange={(e) => setSocialInsta(e.target.value)} />
            <Input id="soc-tg" label="Telegram" placeholder="@username" value={socialTelegram} onChange={(e) => setSocialTelegram(e.target.value)} />
            <Input id="soc-wa" label="WhatsApp" placeholder="+7 (999) 123-45-67" value={socialWhatsapp} onChange={(e) => setSocialWhatsapp(e.target.value)} />
          </div>
        </Card>
      </div>

      {/* Working hours */}
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

      {/* SEO */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">SEO</h2>
        <Card className="p-4">
          <div className="grid gap-4">
            <Input id="seo-title" label="Заголовок (title)" placeholder="Барбершоп в Москве | BarberPRO" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
            <div>
              <label className="mb-1 block text-xs text-text-tertiary font-body">Описание (meta description)</label>
              <textarea className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary font-body placeholder:text-text-tertiary/50"
                placeholder="Лучший барбершоп в центре Москвы. Стрижки, бритьё, укладка. Запись онлайн."
                rows={2} value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
