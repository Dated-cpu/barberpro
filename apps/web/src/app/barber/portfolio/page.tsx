'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { PageHeader } from '@/components/shared/page-header';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PortfolioPage() {
  const { addToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: portfolios, isFetching } = trpc.portfolio.list.useQuery();

  const uploadMut = trpc.media.upload.useMutation();
  const addImagesMut = trpc.portfolio.addImages.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); addToast('Фото добавлены', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  const createMut = trpc.portfolio.create.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); setShowCreate(false); setTitle(''); setDescription(''); addToast('Работа добавлена', 'success'); },
    onError: (e) => addToast(e.message, 'error'),
  });

  const deleteMut = trpc.portfolio.delete.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); addToast('Работа удалена', 'success'); },
  });

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      await uploadMut.mutateAsync({ name: file.name, type: file.type, size: file.size, base64 });
      addToast('Фото загружено', 'success');
    } catch {
      addToast('Ошибка загрузки', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleAddImages(portfolioId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const imageIds: string[] = [];
      for (const file of files) {
        const base64 = await fileToBase64(file);
        const media = await uploadMut.mutateAsync({ name: file.name, type: file.type, size: file.size, base64 });
        imageIds.push(media.id);
      }
      addImagesMut.mutate({ id: portfolioId, imageIds });
    } catch {
      addToast('Ошибка загрузки', 'error');
    } finally {
      setUploading(false);
      if (addFileInputRef.current) addFileInputRef.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Портфолио" action={
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} loading={uploading}>Загрузить фото</Button>
          <Button onClick={() => setShowCreate(true)} size="sm">Добавить работу</Button>
        </div>
      } />

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Новая работа">
        <form onSubmit={(e) => { e.preventDefault(); createMut.mutate({ title, description: description || null, imageIds: [] }); }} className="flex flex-col gap-4">
          <Input id="pf-title" label="Название" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Input id="pf-desc" label="Описание" value={description} onChange={(e) => setDescription(e.target.value)} />
          <p className="text-xs text-text-tertiary font-body">Изображения можно добавить после создания</p>
          <Button type="submit" loading={createMut.isPending}>Создать</Button>
        </form>
      </Modal>

      {isFetching ? (
        <Card className="p-6 text-center"><p className="text-sm text-text-tertiary font-body">Загрузка...</p></Card>
      ) : portfolios && portfolios.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              {p.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-0.5">
                  {p.images.slice(0, 4).map((img) => (
                    <div key={img.id} className="relative aspect-square bg-bg-tertiary overflow-hidden">
                      <Image src={img.media.url} alt={img.media.alt ?? ''} fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aspect-video bg-bg-tertiary flex items-center justify-center">
                  <p className="text-xs text-text-tertiary font-body">Нет фото</p>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-display font-semibold text-text-primary">{p.title}</h3>
                {p.description ? <p className="mt-1 text-xs text-text-secondary font-body">{p.description}</p> : null}
                <div className="mt-2 flex gap-2">
                  <input ref={addFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleAddImages(p.id, e)} />
                  <Button variant="ghost" size="sm" onClick={() => addFileInputRef.current?.click()}>+ Фото</Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMut.mutate({ id: p.id })}>Удалить</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-sm text-text-tertiary font-body">Портфолио пусто. Добавьте свою первую работу!</p>
        </Card>
      )}
    </div>
  );
}
