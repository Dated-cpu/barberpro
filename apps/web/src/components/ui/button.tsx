import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-body text-sm font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-gold text-obsidian hover:bg-gold-light active:scale-[0.97] shadow-[0_0_20px_transparent] hover:shadow-[0_0_30px_var(--color-gold-glow)]',
        secondary:
          'border border-gold text-gold hover:bg-gold-muted active:scale-[0.97] liquid-glow',
        ghost: 'text-stone hover:bg-espresso hover:text-ivory active:scale-[0.97]',
        glass:
          'liquid-glass text-gold active:scale-[0.97]',
        danger: 'border border-error bg-error-bg text-error hover:bg-error/20 active:scale-[0.97]',
      },
      size: {
        xs: 'min-h-11 rounded-lg px-3 text-xs',
        sm: 'min-h-11 rounded-lg px-4 text-xs',
        md: 'min-h-11 rounded-xl px-6 text-sm',
        lg: 'min-h-13 rounded-xl px-8 text-base tracking-wider',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  status?: 'idle' | 'loading' | 'success';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, status: propStatus, disabled, children, ...props }, ref) => {
    const status = propStatus ?? (loading ? 'loading' : 'idle');
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          status === 'loading' && 'btn-loading',
          status === 'success' && 'btn-success',
        )}
        ref={ref}
        disabled={disabled || status === 'loading'}
        {...props}
      >
        <span className={cn('btn-text', status === 'loading' && 'opacity-0 translate-y-1')}>
          {children}
        </span>
        {status === 'loading' && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
        )}
        {status === 'success' && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"
                className="animate-[checkmark_0.3s_ease-out_forwards]"
                strokeDasharray="30" strokeDashoffset="30" />
            </svg>
          </span>
        )}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
export type { ButtonProps };
