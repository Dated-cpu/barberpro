'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AuditItem = {
  id: string;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValue: unknown;
  newValue: unknown;
  ip: string | null;
  createdAt: Date;
};

export default function AdminAudit() {
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [limit, setLimit] = useState(50);

  const result = trpc.admin.getAuditLogs.useQuery({
    action: actionFilter || undefined,
    entityType: entityFilter || undefined,
    limit,
  });

  const { data: entityTypes } = trpc.admin.listAuditEntityTypes.useQuery();

  const data = result.data as { items: AuditItem[]; nextCursor: string | null } | undefined;
  const isFetching = result.isFetching;
  const allItems = data?.items ?? [];

  function exportCSV() {
    const headers = ['Дата', 'Действие', 'Тип', 'ID сущности', 'Актор', 'IP', 'Изменения'];
    const rows = allItems.map((l) => [
      new Date(l.createdAt).toISOString(),
      l.action,
      l.entityType,
      l.entityId ?? '',
      l.actorName ?? '',
      l.ip ?? '',
      l.newValue ? JSON.stringify(l.newValue).slice(0, 200) : '',
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 flex-wrap justify-end">
        <Input id="audit-filter" placeholder="Фильтр по действию..." value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setLimit(50); }} className="w-44" />
        <div className="flex flex-col gap-1">
          <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setLimit(50); }}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-xs text-text-primary font-body">
            <option value="">Все типы</option>
            {entityTypes?.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <Button size="sm" variant="ghost" onClick={exportCSV} disabled={allItems.length === 0}>CSV</Button>
      </div>

      {isFetching ? (
        <Card className="p-6 text-center"><p className="text-sm text-text-tertiary font-body">Загрузка...</p></Card>
      ) : allItems.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {allItems.map((l) => (
            <Card key={l.id} className="flex items-start gap-4 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="whitespace-nowrap rounded bg-accent-muted px-2 py-0.5 text-xs text-accent font-mono">{l.action}</span>
                  <span className="rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] text-text-tertiary">{l.entityType}</span>
                  <span className="text-xs text-text-tertiary font-body">
                    {new Date(l.createdAt).toLocaleString('ru-RU')}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-secondary font-body">
                  {l.actorName ? <>{l.actorName} · </> : null}
                  {l.entityId ? `#${l.entityId.slice(0, 8)}` : ''}
                  {l.ip ? <> · {l.ip}</> : null}
                </p>
                {l.newValue ? (
                  <pre className="mt-1 max-h-20 overflow-auto rounded bg-bg-tertiary p-2 text-[10px] text-text-tertiary font-mono">
                    {JSON.stringify(l.newValue, null, 1).slice(0, 300)}
                  </pre>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center"><p className="text-sm text-text-tertiary font-body">Записей аудита нет</p></Card>
      )}

      {data?.nextCursor && (
        <button onClick={() => setLimit((p) => p + 50)} className="self-center text-sm text-accent hover:text-accent/80 transition-colors font-body">
          Загрузить ещё
        </button>
      )}
    </div>
  );
}
