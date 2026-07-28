'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function AdminSettings() {
  const { addToast } = useToast();
  const utils = trpc.useUtils() as any;
  const { data: settings, isFetching } = (trpc.settings.adminGetSystemSettings as any).useQuery();

  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState('string');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!newKey || !newValue) return;
    setSaving(true);
    try {
      await (utils.client as any).settings.adminUpsertSetting.mutate({ key: newKey, value: newValue, type: newType, description: newDesc || null });
      utils.settings.adminGetSystemSettings.invalidate();
      addToast('Настройка сохранена', 'success');
      setNewKey(''); setNewValue(''); setNewDesc('');
    } catch (e: unknown) {
      addToast(e instanceof Error ? e.message : 'Ошибка', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-text-primary">Настройки системы</h1>

      <Card className="p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Добавить настройку</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input id="skey" label="Ключ" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="business_hours" />
          <Input id="sval" label="Значение" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder='{"open":"09:00"}' />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-text-tertiary font-body">Тип</label>
            <select value={newType} onChange={(e) => setNewType(e.target.value)}
              className="rounded-lg border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary font-body">
              <option value="string">string</option><option value="number">number</option><option value="boolean">boolean</option><option value="json">json</option>
            </select>
          </div>
          <Input id="sdesc" label="Описание" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Часы работы" />
          <Button className="self-end" size="sm" onClick={handleAdd} loading={saving}>Добавить</Button>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-text-primary">Текущие настройки</h2>
        {isFetching ? (
          <p className="text-sm text-text-tertiary font-body">Загрузка...</p>
        ) : settings && settings.length > 0 ? (
          <div className="flex flex-col gap-2">
            {(settings as any[]).map((s: { id: string; key: string; value: unknown; type: string; description: string | null }) => (
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
