import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-radius-md transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation select-none';

    const variantStyles = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700',
      secondary: 'bg-surface-100 text-surface-900 border border-surface-300 hover:bg-surface-200 active:bg-surface-300',
      ghost: 'bg-transparent text-surface-600 hover:bg-surface-100 active:bg-surface-200',
      danger: 'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-body-sm gap-1.5',
      md: 'px-4 py-2.5 text-body gap-2',
      lg: 'px-6 py-3 text-body-lg gap-2',
    };

    return (
      <button
        ref={ref}
        className={clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';