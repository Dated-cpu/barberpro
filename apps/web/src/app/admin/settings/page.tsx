'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

const STRUCTURED_KEYS: { key: string; label: string; type: string; description: string }[] = [
  { key: 'site_name', label: 'Название сайта', type: 'string', description: 'BARBERPRO' },
  { key: 'site_phone', label: 'Телефон', type: 'string', description: '+7 (999) 123-45-67' },
  { key: 'site_email', label: 'Email', type: 'string', description: 'info@barberpro.ru' },
  { key: 'site_address', label: 'Адрес', type: 'string', description: 'г. Москва, ул. Примерная, 1' },
  { key: 'social_instagram', label: 'Instagram', type: 'string', description: '@barberpro' },
  { key: 'social_vk', label: 'VK', type: 'string', description: 'vk.com/barberpro' },
  { key: 'social_telegram', label: 'Telegram', type: 'string', description: '@barberpro_bot' },
  { key: 'seo_title', label: 'SEO Title', type: 'string', description: 'Барбершоп BarberPRO' },
  { key: 'seo_description', label: 'SEO Description', type: 'string', description: 'Лучший барбершоп в городе' },
  { key: 'working_hours', label: 'Часы работы (JSON)', type: 'json', description: '{"mon":"09:00-20:00","tue":"09:00-20:00"}' },
];

export default function AdminSettings() {
  const { addToast } = useToast();
  const utils = trpc.useUtils();
  const { data: settings, isFetching } = trpc.settings.adminGetSystemSettings.useQuery();

  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState('string');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const structuredValues: Record<string, string> = {};
  if (settings) {
    for (const s of (settings as Array<{ id: string; key: string; value: unknown; type: string; description: string | null }>)) {
      structuredValues[s.key] = String(s.value);
    }
  }

  async function handleAdd(key: string, value: string, type: string, desc?: string) {
    setSaving(true);
    try {
      const client = (utils as any).client;
      await client.settings.adminUpsertSetting.mutate({ key, value, type, description: desc ?? null });
      utils.settings.adminGetSystemSettings.invalidate();
      addToast(`Настройка "${key}" сохранена`, 'success');
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : 'Ошибка', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleCustomAdd() {
    if (!newKey || !newValue) return;
    await handleAdd(newKey, newValue, newType, newDesc);
    setNewKey(''); setNewValue(''); setNewDesc('');
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Structured settings */}
      <Card className="p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Основные настройки</h2>
        {isFetching ? (
          <p className="text-sm text-text-tertiary font-body">Загрузка...</p>
        ) : (
          <div className="flex flex-col gap-3">
            {STRUCTURED_KEYS.map((sk) => (
              <StructuredSettingRow
                key={sk.key}
                setting={sk}
                currentValue={structuredValues[sk.key] ?? ''}
                onSave={(value) => handleAdd(sk.key, value, sk.type, sk.description)}
                saving={saving}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Raw settings */}
      <Card className="p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Добавить настройку</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input id="skey" label="Ключ" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="custom_key" />
          <Input id="sval" label="Значение" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="value" />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-tertiary font-body">Тип</label>
            <select value={newType} onChange={(e) => setNewType(e.target.value)}
              className="rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary font-body">
              <option value="string">string</option><option value="number">number</option><option value="boolean">boolean</option><option value="json">json</option>
            </select>
          </div>
          <Input id="sdesc" label="Описание" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Описание" />
          <Button className="self-end" size="sm" onClick={handleCustomAdd} loading={saving}>Добавить</Button>
        </div>
      </Card>

      {/* All settings list */}
      <Card className="p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Все настройки</h2>
        {isFetching ? (
          <p className="text-sm text-text-tertiary font-body">Загрузка...</p>
        ) : settings && settings.length > 0 ? (
          <div className="flex flex-col gap-2">
            {(settings as Array<{ id: string; key: string; value: unknown; type: string; description: string | null }>).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-text-primary font-body">{s.key}</p>
                  <p className="text-xs text-text-tertiary font-body">{s.description ?? '—'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <code className="rounded bg-bg-tertiary px-2 py-1 text-xs text-text-secondary">{String(s.value).slice(0, 50)}</code>
                  <span className="rounded bg-accent-muted px-2 py-0.5 text-xs text-accent">{s.type}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary font-body">Настройки не найдены</p>
        )}
      </Card>
    </div>
  );
}

function StructuredSettingRow({ setting, currentValue, onSave, saving }: {
  setting: { key: string; label: string; type: string; description: string };
  currentValue: string;
  onSave: (value: string) => Promise<void>;
  saving: boolean;
}) {
  const [editValue, setEditValue] = useState(currentValue);
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-text-primary font-body">{setting.label}</p>
          <code className="rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] text-text-tertiary">{setting.key}</code>
        </div>
        {editing ? (
          <div className="mt-1 flex gap-2">
            <Input id={`edit-${setting.key}`} value={editValue} onChange={(e) => setEditValue(e.target.value)} className="max-w-sm" />
            <Button size="xs" onClick={async () => { await onSave(editValue); setEditing(false); }} loading={saving}>Сохранить</Button>
            <Button size="xs" variant="ghost" onClick={() => { setEditValue(currentValue); setEditing(false); }}>Отмена</Button>
          </div>
        ) : (
          <p className="text-xs text-text-tertiary font-body mt-0.5">{currentValue || '—'}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        {!editing && <Button size="xs" variant="ghost" onClick={() => { setEditValue(currentValue); setEditing(true); }}>Изменить</Button>}
      </div>
    </div>
  );
}
