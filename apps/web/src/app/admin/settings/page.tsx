'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/shared/page-header';

const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

type SettingsMap = Record<string, string>;

export default function AdminSettings() {
  const { addToast } = useToast();
  const utils = trpc.useUtils();

  const profileResult = (trpc.auth as any).getProfile.useQuery();
  const profile: { firstName: string; lastName: string; phone: string; email: string; description?: string } | undefined = profileResult.data;
  const wdResult = (trpc.settings as any).getWorkingDays.useQuery();
  const workingDays: { id: string; dayOfWeek: number; startTime: string; endTime: string; isDayOff: boolean }[] | undefined = wdResult.data;
  const rawSettingsResult = (trpc.settings as any).adminGetSystemSettings.useQuery();
  const rawSettings: { key: string; value: unknown }[] | undefined = rawSettingsResult.data;

  const rawItems: { key: string; value: unknown }[] | undefined = rawSettings;
  const settings: SettingsMap = {};
  if (rawItems) {
    for (const s of rawItems) {
      settings[s.key] = typeof s.value === 'string' ? (s.value as string) : JSON.stringify(s.value);
    }
  }

  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '', email: '' });
  const [editingDay, setEditingDay] = useState<{ dayOfWeek: number; startTime: string; endTime: string; isDayOff: boolean; id?: string } | null>(null);

  const [seo, setSeo] = useState({ title: '', description: '', keywords: '', ogImage: '' });
  const [social, setSocial] = useState({ instagram: '', telegram: '', whatsapp: '' });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phone: profile.phone ?? '',
        email: profile.email ?? '',
      });
    }
  }, [profile]);

  useEffect(() => {
    setSeo({
      title: settings['seo_title'] ?? '',
      description: settings['seo_description'] ?? '',
      keywords: settings['seo_keywords'] ?? '',
      ogImage: settings['seo_og_image'] ?? '',
    });
    setSocial({
      instagram: settings['social_instagram'] ?? '',
      telegram: settings['social_telegram'] ?? '',
      whatsapp: settings['social_whatsapp'] ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSettings]);

  const updateProfileMut = (trpc.settings as any).updateProfile.useMutation({
    onSuccess: () => { (utils.auth as any).getProfile.invalidate(); utils.auth.me.invalidate(); addToast('Профиль обновлён', 'success'); },
    onError: (e: Error) => addToast(e.message, 'error'),
  }) as { mutate: (data: { firstName?: string; lastName?: string; phone?: string; email?: string }) => void; isPending: boolean };

  const upsertDayMut = (trpc.settings as any).upsertWorkingDay.useMutation({
    onSuccess: () => { (utils.settings as any).getWorkingDays.invalidate(); addToast('Расписание сохранено', 'success'); setEditingDay(null); },
    onError: (e: Error) => addToast(e.message, 'error'),
  }) as { mutate: (data: { dayOfWeek: number; startTime: string; endTime: string; isDayOff: boolean; id?: string }) => void; isPending: boolean };

  const upsertSettingMut = (trpc.settings.adminUpsertSetting as any).useMutation({
    onSuccess: () => { (utils.settings as any).adminGetSystemSettings.invalidate(); },
    onError: (e: Error) => addToast(e.message, 'error'),
  }) as { mutateAsync: (input: { key: string; value: string; type: string; description?: string }) => Promise<unknown>; isPending: boolean; mutate: (input: { key: string; value: string; type: string; description?: string }) => void };

  function handleProfileSave() {
    updateProfileMut.mutate({
      firstName: profileForm.firstName || undefined,
      lastName: profileForm.lastName || undefined,
      phone: profileForm.phone || undefined,
      email: profileForm.email || undefined,
    });
  }

  async function handleSeoSave() {
    await Promise.all([
      upsertSettingMut.mutateAsync({ key: 'seo_title', value: seo.title, type: 'string', description: 'Название сайта' }),
      upsertSettingMut.mutateAsync({ key: 'seo_description', value: seo.description, type: 'string', description: 'Meta описание' }),
      upsertSettingMut.mutateAsync({ key: 'seo_keywords', value: seo.keywords, type: 'string', description: 'Meta keywords' }),
      upsertSettingMut.mutateAsync({ key: 'seo_og_image', value: seo.ogImage, type: 'string', description: 'OG image URL' }),
    ]);
    addToast('SEO сохранён', 'success');
  }

  async function handleSocialSave() {
    await Promise.all([
      upsertSettingMut.mutateAsync({ key: 'social_instagram', value: social.instagram, type: 'string', description: 'Instagram' }),
      upsertSettingMut.mutateAsync({ key: 'social_telegram', value: social.telegram, type: 'string', description: 'Telegram' }),
      upsertSettingMut.mutateAsync({ key: 'social_whatsapp', value: social.whatsapp, type: 'string', description: 'WhatsApp' }),
    ]);
    addToast('Социальные сети сохранены', 'success');
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Настройки" />

      {/* Profile */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Профиль</h2>
        <Card className="p-4" variant="elevated">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="pf-firstname" label="Имя" value={profileForm.firstName}
              onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })} />
            <Input id="pf-lastname" label="Фамилия" value={profileForm.lastName}
              onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })} />
            <Input id="pf-phone" label="Телефон" value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
            <Input id="pf-email" label="Email" type="email" value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={handleProfileSave} loading={updateProfileMut.isPending}>Сохранить изменения</Button>
          </div>
        </Card>
      </div>

      {/* Schedule */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Расписание</h2>
        <div className="flex flex-col gap-2">
          {dayNames.map((name, i) => {
            const dayOfWeek = i + 1;
            const wd = workingDays?.find((d) => d.dayOfWeek === dayOfWeek);
            const isEditing = editingDay?.dayOfWeek === dayOfWeek;
            return (
              <Card key={dayOfWeek} className="flex items-center justify-between p-4" variant="elevated">
                <div className="flex items-center gap-4">
                  <p className="min-w-[32px] font-body text-sm font-medium text-text-primary">{name}</p>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      {editingDay.isDayOff ? (
                        <p className="text-sm text-text-tertiary font-body">Выходной</p>
                      ) : (
                        <>
                          <Input id={`start-${dayOfWeek}`} type="time" value={editingDay.startTime}
                            onChange={(e) => setEditingDay({ ...editingDay, startTime: e.target.value })} className="w-28" />
                          <span className="text-text-tertiary">—</span>
                          <Input id={`end-${dayOfWeek}`} type="time" value={editingDay.endTime}
                            onChange={(e) => setEditingDay({ ...editingDay, endTime: e.target.value })} className="w-28" />
                        </>
                      )}
                      <label className="flex items-center gap-2 text-xs text-text-secondary font-body">
                        <input type="checkbox" checked={editingDay.isDayOff}
                          onChange={(e) => setEditingDay({ ...editingDay, isDayOff: e.target.checked })} />
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
                    <Button size="sm" variant="ghost"
                      onClick={() => setEditingDay({ dayOfWeek, startTime: wd?.startTime ?? '09:00', endTime: wd?.endTime ?? '19:00', isDayOff: wd?.isDayOff ?? false, id: wd?.id })}>
                      Изменить
                    </Button>
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
        <Card className="p-4" variant="elevated">
          <div className="grid gap-4">
            <Input id="seo-title" label="Название сайта (title)" placeholder="Барбершоп в Москве | BarberPRO"
              value={seo.title} onChange={(e) => setSeo({ ...seo, title: e.target.value })} />
            <div>
              <label className="mb-1 block text-xs text-text-tertiary font-body">Описание (meta description)</label>
              <textarea className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary font-body placeholder:text-text-tertiary/50"
                placeholder="Лучший барбершоп в центре Москвы. Стрижки, бритьё, укладка. Запись онлайн."
                rows={2} value={seo.description}
                onChange={(e) => setSeo({ ...seo, description: e.target.value })} />
            </div>
            <Input id="seo-keywords" label="Keywords (через запятую)" placeholder="барбершоп, стрижка, Москва"
              value={seo.keywords} onChange={(e) => setSeo({ ...seo, keywords: e.target.value })} />
            <Input id="seo-ogimage" label="OG Image (URL)" placeholder="https://example.com/og.jpg"
              value={seo.ogImage} onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={handleSeoSave} loading={upsertSettingMut.isPending}>Сохранить SEO</Button>
          </div>
        </Card>
      </div>

      {/* Social Networks */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Социальные сети</h2>
        <Card className="p-4" variant="elevated">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input id="soc-insta" label="Instagram" placeholder="@username" value={social.instagram}
              onChange={(e) => setSocial({ ...social, instagram: e.target.value })} />
            <Input id="soc-tg" label="Telegram" placeholder="@username" value={social.telegram}
              onChange={(e) => setSocial({ ...social, telegram: e.target.value })} />
            <Input id="soc-wa" label="WhatsApp" placeholder="+7 (999) 123-45-67" value={social.whatsapp}
              onChange={(e) => setSocial({ ...social, whatsapp: e.target.value })} />
          </div>
          <div className="mt-4 flex justify-end">
            <Button size="sm" onClick={handleSocialSave} loading={upsertSettingMut.isPending}>Сохранить</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
