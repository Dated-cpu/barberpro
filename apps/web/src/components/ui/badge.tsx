import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium font-body',
        variant === 'default' && 'bg-bg-tertiary text-text-secondary',
        variant === 'success' && 'bg-success-bg text-success',
        variant === 'warning' && 'bg-warning-bg text-warning',
        variant === 'error' && 'bg-error-bg text-error',
        variant === 'accent' && 'bg-accent-muted text-accent',
        className,
      )}
    >
      {children}
    </span>
  );
}
