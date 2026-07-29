'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

export default function AdminBarbers() {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ firstName: string; lastName: string; email: string; phone: string; isActive: boolean; role: 'BARBER' | 'ADMIN' }>({ firstName: '', lastName: '', email: '', phone: '', isActive: true, role: 'BARBER' });

  const utils = trpc.useUtils();
  const { data, isFetching } = trpc.admin.listBarbers.useQuery({ search: search || undefined });

  const updateMut = trpc.admin.updateBarber.useMutation({
    onSuccess: () => { utils.admin.listBarbers.invalidate(); setEditingId(null); addToast('Барбер обновлён', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  const { data: barberDetail } = trpc.admin.getBarberById.useQuery(
    { id: editingId! },
    { enabled: !!editingId },
  );

  function openEdit(barber: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; isActive: boolean; role: string }) {
    setEditingId(barber.id);
    setEditForm({
      firstName: barber.firstName,
      lastName: barber.lastName,
      email: barber.email ?? '',
      phone: barber.phone ?? '',
      isActive: barber.isActive,
      role: barber.role === 'ADMIN' ? 'ADMIN' : 'BARBER',
    });
  }

  function handleSave() {
    updateMut.mutate({ id: editingId!, ...editForm, email: editForm.email || undefined, phone: editForm.phone || undefined });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <Input id="barber-search" placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
      </div>

      <Modal open={!!editingId} onClose={() => setEditingId(null)} title="Редактировать барбера">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input id="edit-firstname" label="Имя" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} required />
            <Input id="edit-lastname" label="Фамилия" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} required />
          </div>
          <Input id="edit-email" label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          <Input id="edit-phone" label="Телефон" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-text-secondary font-body">
              <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
              Активен
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary font-body">
              <input type="checkbox" checked={editForm.role === 'ADMIN'} onChange={(e) => setEditForm({ ...editForm, role: e.target.checked ? 'ADMIN' : 'BARBER' })} />
              Администратор
            </label>
          </div>

          {barberDetail && (
            <div className="rounded-lg border border-border bg-bg-secondary p-3 text-xs text-text-tertiary font-body">
              <p>Записей: {(barberDetail as any)._count?.barberAppointments ?? 0}</p>
              <p>Клиентов: {(barberDetail as any).totalClients ?? 0}</p>
              <p>Рейтинг: {(barberDetail as any).averageRating ? Number((barberDetail as any).averageRating).toFixed(1) + ' ★' : 'Нет оценок'}</p>
              <p>Отзывов: {(barberDetail as any).totalReviews ?? 0}</p>
              <p>Филиал: {(barberDetail as any).branchAssignments?.[0]?.branch?.name ?? 'Не назначен'}</p>
              {barberDetail.lastLogin ? <p>Последний вход: {new Date(barberDetail.lastLogin).toLocaleDateString('ru-RU')}</p> : null}
            </div>
          )}

          <Button onClick={handleSave} loading={updateMut.isPending}>Сохранить</Button>
        </div>
      </Modal>

      {isFetching ? (
        <Card className="p-6 text-center"><p className="text-sm text-text-tertiary font-body">Загрузка...</p></Card>
      ) : data?.items && data.items.length > 0 ? (
        <div className="flex flex-col gap-2">
          {data.items.map((b) => (
            <Card key={b.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                {b.avatarUrl ? (
                  <img src={b.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-muted text-sm text-accent font-body">
                    {b.firstName[0]}{b.lastName[0]}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-text-primary font-body">{b.firstName} {b.lastName}</p>
                  <p className="text-xs text-text-tertiary font-body">{b.email ?? b.phone ?? '—'} {b.branchName ? `• ${b.branchName}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-tertiary font-body">{b.totalAppointments} зап.</span>
                <Badge variant={b.isActive ? 'success' : 'error'}>{b.isActive ? 'Активен' : 'Неактивен'}</Badge>
                <Button size="sm" variant="ghost" onClick={() => openEdit(b as any)}>Редакт.</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center"><p className="text-sm text-text-tertiary font-body">Барберы не найдены</p></Card>
      )}
    </div>
  );
}
