import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label ? (
          <label htmlFor={id} className="text-sm text-text-secondary font-body">
            {label}
          </label>
        ) : null}
        <input
          id={id}
          ref={ref}
          className={cn(
            'h-11 w-full rounded-xl border bg-bg-secondary px-4 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200',
            'focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-muted)] focus:outline-none',
            error
              ? 'border-error shadow-[0_0_0_3px_var(--color-error-bg)]'
              : 'border-border',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            className,
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {error ? (
          <p id={`${id}-error`} role="alert" className="text-xs text-error">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
