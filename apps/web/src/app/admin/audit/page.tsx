'use client';

import { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card } from '@/components/ui/card';
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
  const [limit, setLimit] = useState(50);

  const result = trpc.admin.getAuditLogs.useQuery({
    action: actionFilter || undefined,
    limit,
  });

  const data = result.data as { items: AuditItem[]; nextCursor: string | null } | undefined;
  const isFetching = result.isFetching;
  const allItems = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-text-primary">Журнал аудита</h1>
        <Input
          id="audit-filter"
          placeholder="Фильтр по действию..."
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setLimit(50); }}
          className="w-56"
        />
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
                  <span className="text-xs text-text-tertiary font-body">
                    {new Date(l.createdAt).toLocaleString('ru-RU')}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-secondary font-body">
                  {l.actorName ? <>{l.actorName} · </> : null}
                  {l.entityType}{l.entityId ? ` #${l.entityId.slice(0, 8)}` : ''}
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
        <button
          onClick={() => setLimit((p) => p + 50)}
          className="self-center text-sm text-accent hover:text-accent/80 transition-colors font-body"
        >
          Загрузить ещё
        </button>
      )}
    </div>
  );
}
