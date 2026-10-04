import { forwardRef, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', children, ...props }, ref) => {
    const variantStyles = {
      info: 'badge-info',
      success: 'badge-success',
      warning: 'badge-warning',
      danger: 'badge-danger',
      neutral: 'badge-neutral',
    };

    return (
      <span
        ref={ref}
        className={clsx('badge', variantStyles[variant], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';