'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/shared/page-header';

export default function ServicesPage() {
  const { addToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '', category: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: services } = trpc.services.list.useQuery({ includeInactive: true });

  const createMut = trpc.services.create.useMutation({
    onSuccess: () => { utils.services.list.invalidate(); setShowCreate(false); resetForm(); addToast('Услуга создана', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  const updateMut = trpc.services.update.useMutation({
    onSuccess: () => { utils.services.list.invalidate(); setEditingId(null); resetForm(); addToast('Услуга обновлена', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  const archiveMut = trpc.services.archive.useMutation({
    onSuccess: () => { utils.services.list.invalidate(); addToast('Услуга архивирована', 'success'); },
  });

  function resetForm() { setForm({ name: '', description: '', price: '', duration: '', category: '' }); }

  function handleEdit(svc: { id: string; name: string; description: string | null; price: number | string; duration: number; category: string | null }) {
    setEditingId(svc.id);
    setForm({ name: svc.name, description: svc.description ?? '', price: String(Number(svc.price)), duration: String(svc.duration), category: svc.category ?? '' });
    setShowCreate(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = { name: form.name, description: form.description || null, price: Number(form.price), duration: Number(form.duration), category: form.category || null };
    if (editingId) updateMut.mutate({ ...data, id: editingId, isActive: true });
    else createMut.mutate(data);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Услуги" action={
        <Button onClick={() => { setEditingId(null); resetForm(); setShowCreate(true); }} size="sm">Создать услугу</Button>
      } />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={editingId ? 'Редактировать услугу' : 'Новая услуга'}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input id="svc-name" label="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input id="svc-desc" label="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input id="svc-price" label="Цена (₽)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <Input id="svc-duration" label="Длительность (мин)" type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required />
          </div>
          <Input id="svc-cat" label="Категория" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="haircut, beard, shave..." />
          <Button type="submit" loading={createMut.isPending || updateMut.isPending}>{editingId ? 'Сохранить' : 'Создать'}</Button>
        </form>
      </Modal>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services?.map((s) => (
          <Card key={s.id} className={s.isActive ? 'p-5' : 'p-5 opacity-50'}>
            <div className="mb-2 flex items-start justify-between">
              <h3 className="font-display font-semibold text-text-primary">{s.name}</h3>
              <Badge variant={s.isActive ? 'accent' : 'default'}>{s.isActive ? 'Активна' : 'Архив'}</Badge>
            </div>
            {s.description ? <p className="mb-3 text-xs text-text-secondary font-body">{s.description}</p> : null}
            <div className="mb-3 flex items-center gap-3 text-sm text-text-tertiary font-body">
              <span>{s.duration} мин</span>
              <span className="text-accent font-semibold">{Number(s.price).toLocaleString()} ₽</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}>Редакт.</Button>
              {s.isActive ? (
                <Button variant="ghost" size="sm" onClick={() => archiveMut.mutate({ id: s.id })}>Архив.</Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
