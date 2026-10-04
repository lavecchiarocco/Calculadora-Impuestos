import { useWatch, Controller } from 'react-hook-form';
import { Shield, AlertCircle, CheckCircle, ExternalLink, HelpCircle, RefreshCw } from 'lucide-react';
import type { FormData } from '@/schemas/formSchema';
import { Input, Button, Badge } from '@/components/ui';
import { parsearNumeroAR } from '@/utils/calculos';
import { obtenerTipoCambio } from '@/api/client';

interface Step3ProductoImpuestosProps {
  form: ReturnType<typeof import('react-hook-form').useForm<import('@/schemas/formSchema').FormInput>>;
  disabled: boolean;
  onBuscarDolar: () => Promise<void>;
  buscandoDolar: boolean;
}

const OPCIONES_TOGGLE = [
  {
    key: 'envio_incluye_impuestos_ddp' as const,
    label: 'Envío incluye impuestos (DDP)',
    descripcion: 'El courier cobra los impuestos en destino. No pagás aparte en aduana.',
    icon: Shield,
    advertencia: 'Verificá con tu courier que realmente sea DDP puerta a puerta.',
  },
  {
    key: 'requiere_organismo_externo' as const,
    label: 'Requiere organismo externo (ANMAT, SENASA, etc.)',
    descripcion: 'El producto necesita certificación de un organismo oficial antes de importar.',
    icon: AlertCircle,
    advertencia: 'Agrega tiempo y costo. Consultá los requisitos específicos para tu NCM.',
  },
  {
    key: 'incluir_percepciones' as const,
    label: 'Incluir percepciones (RG 4815/5272)',
    descripcion: 'Percepción de IVA y Ganancias sobre la importación. Aplica según tu situación fiscal.',
    icon: CheckCircle,
    advertencia: 'Solo si estás inscripto en los regímenes correspondientes.',
  },
] as const;

export function Step3ProductoImpuestos({
  form,
  disabled,
  onBuscarDolar,
  buscandoDolar,
}: Step3ProductoImpuestosProps) {
  const { control, watch, setValue, formState: { errors } } = form;
  const tipoCambio = watch('tipo_cambio_ars_usd');

  const activeAlerts = OPCIONES_TOGGLE.filter(opt => watch(opt.key)).map(opt => opt.advertencia);

  return (
    <div className="step animate-step-in">
      <div className="step-header">
        <h2 className="step-title">Paso 3 de 4: Producto e impuestos</h2>
        <p className="step-subtitle">Unidades, alícuotas y opciones avanzadas</p>
      </div>

      <div className="step-body">
        <fieldset className="field-group">
          <legend className="fieldset-legend">Producto</legend>
          <div className="grid grid-2">
            <Controller
              control={control}
              name="cantidad_unidades"
              rules={{ required: 'La cantidad es obligatoria', min: { value: 1, message: 'Mínimo 1' } }}
              render={({ field }) => (
                <Input
                  label="Unidades"
                  type="number"
                  step="1"
                  min="1"
                  error={errors.cantidad_unidades?.message}
                  disabled={disabled}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  onBlur={field.onBlur}
                />
              )}
            />
            <div className="field">
              <label className="field-label">
                Derecho de importación
                <Badge variant="warning" className="ml-2">35% (máx.)</Badge>
              </label>
              <div className="field-input-readonly">
                <span>Máximo general</span>
                <span className="text-caption text-surface-500">No editable · Se aplica el tope</span>
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="field-group">
          <legend className="fieldset-legend">Impuestos y tipo de cambio</legend>
          <div className="grid grid-3">
            <Controller
              control={control}
              name="impuestos_internos_pct"
              rules={{ min: 0, max: 100 }}
              render={({ field }) => (
                <Input
                  label="Impuestos internos %"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  unit="%"
                  disabled={disabled}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(parsearNumeroAR(e.target.value))}
                  onBlur={field.onBlur}
                />
              )}
            />
            <div className="field">
              <label className="field-label flex items-center justify-between">
                Tipo de cambio (ARS/USD)
                {tipoCambio && !buscandoDolar && (
                  <Badge variant="info" className="text-xs">Actual</Badge>
                )}
              </label>
              <div className="relative">
                <Controller
                  control={control}
                  name="tipo_cambio_ars_usd"
                  rules={{ required: 'El tipo de cambio es obligatorio', min: { value: 0.01, message: '>' } }}
                  render={({ field }) => (
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="1000"
                      error={errors.tipo_cambio_ars_usd?.message}
                      disabled={disabled || buscandoDolar}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(parsearNumeroAR(e.target.value))}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                <button
                  type="button"
                  className="btn-dolar"
                  onClick={onBuscarDolar}
                  disabled={disabled || buscandoDolar}
                  aria-label="Buscar dólar oficial"
                >
                  {buscandoDolar ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <ExternalLink size={16} />
                  )}
                </button>
              </div>
            </div>
            <div className="field"></div>
          </div>
          {errors.tipo_cambio_ars_usd && (
            <p className="field-error" role="alert">{errors.tipo_cambio_ars_usd.message}</p>
          )}
        </fieldset>

        <fieldset className="field-group">
          <legend className="fieldset-legend">Opciones avanzadas</legend>
          <div className="opciones-grid">
            {OPCIONES_TOGGLE.map(({ key, label, descripcion, icon: Icon, advertencia }) => {
              const activo = watch(key);
              return (
                <button
                  key={key}
                  type="button"
                  className={`opcion-card ${activo ? 'active' : ''}`}
                  onClick={() => !disabled && setValue(key, !activo, { shouldValidate: true })}
                  disabled={disabled}
                  aria-pressed={activo}
                >
                  <div className="opcion-icon">
                    <Icon size={22} />
                  </div>
                  <div className="opcion-content">
                    <strong>{label}</strong>
                    <p className="opcion-desc">{descripcion}</p>
                  </div>
                  {activo && <CheckCircle size={20} className="opcion-check" />}
                </button>
              );
            })}
          </div>

          {activeAlerts.length > 0 && (
            <div className="alert-warning" role="alert">
              <AlertCircle size={18} />
              <div>
                {activeAlerts.map((a, i) => (
                  <p key={i} className="text-body-sm">{a}</p>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        <div className="derecho-info">
          <HelpCircle size={16} />
          <span>
            El derecho de importación se fija en <strong>35%</strong> (máximo general según régimen general).
            Para NCM específicos con alícuotas menores, el cálculo final puede ser inferior.
          </span>
        </div>
      </div>
    </div>
  );
}