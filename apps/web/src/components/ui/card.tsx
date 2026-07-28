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
          variant === 'elevated' && 'bg-bg-elevated border border-border shadow-lg hover:-translate-y-0.5 hover:shadow-xl',
          variant === 'outlined' && 'bg-transparent border border-border hover:border-gold/30',
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
