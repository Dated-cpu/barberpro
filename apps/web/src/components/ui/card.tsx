'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outlined' | 'ghost';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'elevated', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-300 will-change-transform',
          variant === 'elevated' && 'bg-bg-card border border-border/80 shadow-lg hover:-translate-y-0.5 hover:border-accent/20 hover:shadow-[0_0_30px_var(--color-gold-glow)]',
          variant === 'outlined' && 'bg-transparent border border-border hover:border-accent/30',
          variant === 'ghost' && 'bg-bg-secondary hover:bg-espresso',
          className,
        )}
        {...props}
      />
    );
  },
);
Card.displayName = 'Card';

export { Card };
