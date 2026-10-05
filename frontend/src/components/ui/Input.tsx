import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Controller, type Control, type RegisterOptions } from 'react-hook-form';
import { clsx } from 'clsx';
import { parsearNumeroAR } from '@/utils/calculos';

/* ---------- Piezas compartidas ---------- */

interface CommonFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  helpText?: string;
  control?: Control<any>;
  rules?: RegisterOptions<any, any>;
}

function fieldIds(inputId: string, hint?: string, error?: string) {
  const hintId = hint && !error ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return { hintId, errorId, describedBy };
}

function HelpTooltip({ inputId, helpText }: { inputId: string; helpText: string }) {
  return (
    <button
      type="button"
      className="tooltip-trigger ml-auto"
      aria-label={helpText}
      aria-describedby={`${inputId}-tooltip`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
      <span id={`${inputId}-tooltip`} className="tooltip-content">{helpText}</span>
    </button>
  );
}

function FieldShell({
  inputId,
  label,
  helpText,
  hint,
  error,
  children,
}: {
  inputId: string;
  label?: string;
  helpText?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  const { hintId, errorId } = fieldIds(inputId, hint, error);
  return (
    <div className="field">
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
          {helpText && <HelpTooltip inputId={inputId} helpText={helpText} />}
        </label>
      )}
      {children}
      {hintId && <p id={hintId} className="field-hint">{hint}</p>}
      {error && (
        <p id={errorId} className="field-error" role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------- Input ---------- */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, CommonFieldProps {
  unit?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    label,
    hint,
    error,
    unit,
    helpText,
    id,
    control,
    rules,
    type = 'text',
    name,
    value,
    onChange: onChangeProp,
    onBlur: onBlurProp,
    ...props
  },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? name ?? autoId;

  const renderInput = (
    extra: InputHTMLAttributes<HTMLInputElement>,
    inputRef: Ref<HTMLInputElement> | undefined,
    errorMessage?: string,
  ) => {
    const { describedBy } = fieldIds(inputId, hint, errorMessage);
    const showUnit = unit && type !== 'checkbox' && type !== 'radio';
    return (
      <FieldShell inputId={inputId} label={label} helpText={helpText} hint={hint} error={errorMessage}>
        <div className="relative">
          <input
            ref={inputRef}
            id={inputId}
            name={name}
            type={type}
            className={clsx(
              'field-input focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow',
              showUnit && 'pr-12',
              errorMessage && 'field-input-error',
              className,
            )}
            aria-describedby={describedBy}
            aria-invalid={!!errorMessage}
            {...props}
            value={extra.value ?? value}
            onChange={(event) => {
              extra.onChange?.(event);
              onChangeProp?.(event);
            }}
            onBlur={(event) => {
              extra.onBlur?.(event);
              onBlurProp?.(event);
            }}
          />
          {showUnit && (
            <span
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-caption text-surface-400"
              aria-hidden="true"
            >
              {unit}
            </span>
          )}
        </div>
      </FieldShell>
    );
  };

  if (control && name) {
    return (
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field, fieldState }) =>
          renderInput(
            {
              value: field.value ?? '',
              onChange: (event) => field.onChange(
                type === 'number' ? parsearNumeroAR(event.currentTarget.value) : event,
              ),
              onBlur: field.onBlur,
            },
            field.ref,
            fieldState.error?.message ?? error,
          )
        }
      />
    );
  }
  return renderInput({}, ref, error);
});

/* ---------- Textarea ---------- */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, CommonFieldProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, hint, error, helpText, id, control, rules, name, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? name ?? autoId;

  const renderTextarea = (
    extra: TextareaHTMLAttributes<HTMLTextAreaElement>,
    inputRef: Ref<HTMLTextAreaElement> | undefined,
    errorMessage?: string,
  ) => {
    const { describedBy } = fieldIds(inputId, hint, errorMessage);
    return (
      <FieldShell inputId={inputId} label={label} helpText={helpText} hint={hint} error={errorMessage}>
        <textarea
          ref={inputRef}
          id={inputId}
          name={name}
          className={clsx('field-input min-h-[100px] resize-y', errorMessage && 'field-input-error', className)}
          aria-describedby={describedBy}
          aria-invalid={!!errorMessage}
          {...props}
          {...extra}
        />
      </FieldShell>
    );
  };

  if (control && name) {
    return (
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field, fieldState }) =>
          renderTextarea(
            { value: field.value ?? '', onChange: field.onChange, onBlur: field.onBlur },
            field.ref,
            fieldState.error?.message ?? error,
          )
        }
      />
    );
  }
  return renderTextarea({}, ref, error);
});

/* ---------- Select ---------- */

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, CommonFieldProps {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, label, hint, error, helpText, id, options, placeholder, control, rules, name, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? name ?? autoId;

  const renderSelect = (
    extra: SelectHTMLAttributes<HTMLSelectElement>,
    inputRef: Ref<HTMLSelectElement> | undefined,
    errorMessage?: string,
  ) => {
    const { describedBy } = fieldIds(inputId, hint, errorMessage);
    return (
      <FieldShell inputId={inputId} label={label} helpText={helpText} hint={hint} error={errorMessage}>
        <select
          ref={inputRef}
          id={inputId}
          name={name}
          className={clsx('field-select', errorMessage && 'field-select-error', className)}
          aria-describedby={describedBy}
          aria-invalid={!!errorMessage}
          {...props}
          {...extra}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </FieldShell>
    );
  };

  if (control && name) {
    return (
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field, fieldState }) =>
          renderSelect(
            { value: field.value ?? '', onChange: field.onChange, onBlur: field.onBlur },
            field.ref,
            fieldState.error?.message ?? error,
          )
        }
      />
    );
  }
  return renderSelect({}, ref, error);
});
