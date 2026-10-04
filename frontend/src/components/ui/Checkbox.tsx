import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  hint?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, hint, id, ...props }, ref) => {
    const inputId = id || props.name;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const describedBy = hintId || undefined;

    return (
      <div className={clsx('checkbox', className)}>
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="checkbox-input"
          aria-describedby={describedBy}
          {...props}
        />
        <label htmlFor={inputId} className="checkbox-label">
          {label}
          {hint && <span id={hintId} className="field-hint">{hint}</span>}
        </label>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';