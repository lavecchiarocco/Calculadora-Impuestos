import { useWatch, Controller } from 'react-hook-form';
import { Plane, Truck, Info } from 'lucide-react';
import type { FormData } from '@/schemas/formSchema';
import { Input, Button } from '@/components/ui';
import { parsearNumeroAR } from '@/utils/calculos';

interface Step1CotizacionProps {
  form: ReturnType<typeof import('react-hook-form').useForm<import('@/schemas/formSchema').FormInput>>;
  disabled: boolean;
}

const MODO_OPCIONES = [
  { value: 'aereo', label: 'Aéreo', icon: Plane, help: 'Se usa peso volumétrico (L×A×H×bultos/5000). El mayor entre peso real y volumétrico se factura.' },
  { value: 'maritimo', label: 'Marítimo', icon: Truck, help: 'Solo se factura el peso real. No hay peso volumétrico.' },
] as const;

export function Step1Cotizacion({ form, disabled }: Step1CotizacionProps) {
  const { control, watch, setValue, formState: { errors } } = form;
  const modoTransporte = watch('modo_transporte');
  const ayudaActual = MODO_OPCIONES.find(m => m.value === modoTransporte)?.help || MODO_OPCIONES[0].help;

  return (
    <div className="step animate-step-in">
      <div className="step-header">
        <h2 className="step-title">Paso 1 de 4: Cotización</h2>
        <p className="step-subtitle">Datos del proveedor y modo de transporte</p>
      </div>

      <div className="step-body">
        <fieldset className="field-group">
          <legend className="fieldset-legend">Valores en USD</legend>
          <div className="grid grid-3">
            <Controller
              control={control}
              name="precio_producto_usd"
              rules={{ required: 'Ingresá el precio del producto', min: { value: 0.01, message: 'Debe ser mayor a 0' } }}
              render={({ field }) => (
                <Input
                  label="Precio FOB"
                  unit="USD"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  error={errors.precio_producto_usd?.message}
                  disabled={disabled}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(parsearNumeroAR(e.target.value))}
                  onBlur={field.onBlur}
                />
              )}
            />
            <Controller
              control={control}
              name="costo_envio_usd"
              rules={{ min: { value: 0, message: 'No puede ser negativo' } }}
              render={({ field }) => (
                <Input
                  label="Costo de envío"
                  unit="USD"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  error={errors.costo_envio_usd?.message}
                  disabled={disabled}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(parsearNumeroAR(e.target.value))}
                  onBlur={field.onBlur}
                />
              )}
            />
            <Controller
              control={control}
              name="seguro_usd"
              render={({ field }) => (
                <Input
                  label="Seguro"
                  unit="USD"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  disabled={disabled}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(parsearNumeroAR(e.target.value))}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>
        </fieldset>

        <fieldset className="field-group">
          <legend className="fieldset-legend">Modo de transporte</legend>
          <div className="transporte-toggle" role="radiogroup" aria-label="Modo de transporte">
            {MODO_OPCIONES.map(({ value, label, icon: Icon, help }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={modoTransporte === value}
                className={`transporte-btn ${modoTransporte === value ? 'active' : ''}`}
                onClick={() => !disabled && setValue('modo_transporte', value, { shouldValidate: true })}
                disabled={disabled}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <p className="transporte-help" aria-live="polite">
            <Info size={14} aria-hidden="true" /> {ayudaActual}
          </p>
          {errors.modo_transporte && (
            <p className="field-error" role="alert">{errors.modo_transporte.message}</p>
          )}
        </fieldset>
      </div>
    </div>
  );
}