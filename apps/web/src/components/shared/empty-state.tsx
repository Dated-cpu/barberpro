import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-text-tertiary">{icon}</div>
      <h3 className="mb-2 font-display text-base font-semibold text-text-primary">{title}</h3>
      <p className="max-w-xs text-sm text-text-tertiary font-body leading-relaxed">{subtitle}</p>
    </div>
  );
}
