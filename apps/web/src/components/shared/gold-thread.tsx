import { cn } from '@/lib/utils';

interface GoldThreadProps {
  className?: string;
  vertical?: boolean;
}

export function GoldThread({ className, vertical }: GoldThreadProps) {
  return (
    <div
      className={cn(
        vertical ? 'gold-thread-vertical' : 'gold-thread',
        'animate-gold-draw',
        className,
      )}
      aria-hidden="true"
    />
  );
}
