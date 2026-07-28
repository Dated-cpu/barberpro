'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

export default function AdminBranches() {
  const { addToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', address: '', phone: '', email: '', timezone: 'Europe/Moscow' });

  const utils = trpc.useUtils();
  const { data: branches, isFetching } = trpc.admin.listBranches.useQuery({});

  const createMut = trpc.admin.createBranch.useMutation({
    onSuccess: () => { utils.admin.listBranches.invalidate(); setShowCreate(false); resetForm(); addToast('Филиал создан', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  const updateMut = trpc.admin.updateBranch.useMutation({
    onSuccess: () => { utils.admin.listBranches.invalidate(); setEditingId(null); resetForm(); addToast('Филиал обновлён', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  const deleteMut = trpc.admin.deleteBranch.useMutation({
    onSuccess: () => { utils.admin.listBranches.invalidate(); addToast('Филиал удалён', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  function resetForm() { setForm({ name: '', slug: '', address: '', phone: '', email: '', timezone: 'Europe/Moscow' }); }

  function openEdit(b: { id: string; name: string; slug: string; address: string | null; phone: string | null; email: string | null; timezone: string; isActive: boolean }) {
    setEditingId(b.id);
    setForm({ name: b.name, slug: b.slug, address: b.address ?? '', phone: b.phone ?? '', email: b.email ?? '', timezone: b.timezone });
  }

  function handleSubmit() {
    const data = { ...form, address: form.address || undefined, phone: form.phone || undefined, email: form.email || undefined, timezone: form.timezone || undefined };
    if (editingId) updateMut.mutate({ id: editingId, ...data });
    else createMut.mutate(data as any);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-primary">Филиалы</h1>
        <Button size="sm" onClick={() => { setEditingId(null); resetForm(); setShowCreate(true); }}>Создать филиал</Button>
      </div>

      <Modal open={showCreate || !!editingId} onClose={() => { setShowCreate(false); setEditingId(null); }} title={editingId ? 'Редактировать филиал' : 'Новый филиал'}>
        <div className="flex flex-col gap-4">
          <Input id="br-name" label="Название" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input id="br-slug" label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required placeholder="main-branch" />
          <Input id="br-address" label="Адрес" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input id="br-phone" label="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input id="br-email" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Input id="br-tz" label="Часовой пояс" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="Europe/Moscow" />
          <Button onClick={handleSubmit} loading={createMut.isPending || updateMut.isPending}>{editingId ? 'Сохранить' : 'Создать'}</Button>
        </div>
      </Modal>

      {isFetching ? (
        <Card className="p-6 text-center"><p className="text-sm text-text-tertiary font-body">Загрузка...</p></Card>
      ) : branches && branches.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((b) => (
            <Card key={b.id} className="p-5">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-display font-semibold text-text-primary">{b.name}</h3>
                  <p className="text-xs text-text-tertiary font-body">{b.address ?? 'Адрес не указан'}</p>
                </div>
                <Badge variant={b.isActive ? 'success' : 'error'}>{b.isActive ? 'Активен' : 'Неактивен'}</Badge>
              </div>
              <div className="mb-3 flex gap-3 text-xs text-text-tertiary font-body">
                <span>👥 {b._count.staff}</span>
                <span>📅 {b._count.appointments}</span>
              </div>
              {b.phone ? <p className="text-xs text-text-secondary font-body">📞 {b.phone}</p> : null}
              {b.email ? <p className="text-xs text-text-secondary font-body">✉️ {b.email}</p> : null}
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(b as any)}>Редакт.</Button>
                <Button variant="ghost" size="sm" onClick={() => deleteMut.mutate({ id: b.id })}>Удалить</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center"><p className="text-sm text-text-tertiary font-body">Филиалы не найдены</p></Card>
      )}
    </div>
  );
}
