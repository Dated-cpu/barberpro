import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, backHref, backLabel, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="mb-1 inline-flex items-center gap-1 text-xs text-text-tertiary hover:text-accent transition-colors font-body"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {backLabel}
          </Link>
        )}
        <h1 className="font-display text-2xl font-bold text-text-primary">{title}</h1>
      </div>
      {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
    </div>
  );
}
