import { forwardRef, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, children, ...props }, ref) => {
    const variantStyles = {
      info: 'alert-info',
      warning: 'alert-warning',
      danger: 'alert-danger',
      success: 'alert-success',
    };

    const icons = {
      info: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      ),
      warning: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      ),
      danger: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M15 9l-6 6M9 9l6 6" />
        </svg>
      ),
      success: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={clsx(variantStyles[variant], className)}
        {...props}
      >
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 mt-0.5">{icons[variant]}</span>
          <div className="flex-1">
            {title && <p className="font-medium text-body">{title}</p>}
            <div className="mt-1 text-body-sm">{children}</div>
          </div>
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';
