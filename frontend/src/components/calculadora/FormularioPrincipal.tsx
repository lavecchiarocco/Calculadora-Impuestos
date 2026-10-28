import { Controller } from 'react-hook-form';
import { Shield, AlertCircle, CheckCircle, ExternalLink, HelpCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { Input, Button } from '@/components/ui';
import { parsearNumeroAR } from '@/utils/calculos';

interface FormularioPrincipalProps {
  form: ReturnType<typeof import('react-hook-form').useForm<import('@/schemas/formSchema').FormInput>>;
  disabled: boolean;
  onBuscarDolar: () => Promise<void>;
  buscandoDolar: boolean;
  onCalcular: () => Promise<void>;
  calculando: boolean;
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
    label: 'Requiere organismo externo (ANMAT, INTI, etc.)',
    descripcion: 'El producto necesita certificación de un organismo oficial antes de importar.',
    icon: AlertCircle,
    advertencia: 'Agrega tiempo y costo. Consultá los requisitos específicos para tu NCM.',
  },
] as const;

export function FormularioPrincipal({
  form,
  disabled,
  onBuscarDolar,
  buscandoDolar,
  onCalcular,
  calculando,
}: FormularioPrincipalProps) {
  const { control, watch, setValue, formState: { errors } } = form;
  const tipoCambio = watch('tipo_cambio_ars_usd');

  const activeAlerts = OPCIONES_TOGGLE.filter(opt => watch(opt.key)).map(opt => opt.advertencia);

  return (
    <div className="formulario-principal">
      <div className="formulario-header">
        <h2 className="formulario-title">Datos de tu compra</h2>
        <p className="formulario-subtitle">Completá los datos para estimar el costo de importar.</p>
      </div>

      <div className="formulario-body">
        <fieldset className="field-group">
          <legend className="fieldset-legend">Compra y envío</legend>
          <div className="grid grid-4">
            <Controller
              control={control}
              name="precio_producto_usd"
              rules={{ required: 'Ingresá el precio del producto', min: { value: 0.01, message: 'Debe ser mayor a 0' } }}
              render={({ field }) => (
                <Input
                  label="Precio del producto"
                  hint="Valor de la mercadería, sin envío ni seguro."
                  unit="USD"
                  type="number"
                  step="0.01"
                  placeholder="Ej.: 250"
                  inputMode="decimal"
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
                  hint="Si no tiene costo, dejalo en 0."
                  unit="USD"
                  type="number"
                  step="0.01"
                  placeholder="Ej.: 35"
                  inputMode="decimal"
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
                  hint="Opcional. Si no lo conocés, dejalo en 0."
                  unit="USD"
                  type="number"
                  step="0.01"
                  placeholder="Ej.: 5"
                  inputMode="decimal"
                  disabled={disabled}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(parsearNumeroAR(e.target.value))}
                  onBlur={field.onBlur}
                />
              )}
            />
            <Controller
              control={control}
              name="cantidad_productos"
              rules={{ required: 'La cantidad es obligatoria', min: { value: 1, message: 'Mínimo 1' } }}
              render={({ field }) => (
                <Input
                  label="Cantidad de unidades"
                  type="number"
                  step="1"
                  min="1"
                  inputMode="numeric"
                  error={errors.cantidad_productos?.message}
                  disabled={disabled}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  onBlur={field.onBlur}
                />
              )}
            />
            <Controller
              control={control}
              name="max_unidades_misma_especie"
              rules={{ min: { value: 1, message: 'Mínimo 1' } }}
              render={({ field }) => {
                const cantidadTotal = watch('cantidad_productos') ?? 99;
                return (
                  <Input
                    label="Máx. productos idénticos"
                    type="number"
                    step="1"
                    min="1"
                    max={cantidadTotal}
                    inputMode="numeric"
                    error={errors.max_unidades_misma_especie?.message}
                    disabled={disabled}
                    value={field.value ?? ''}
                    placeholder="Igual a cantidad"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    onBlur={field.onBlur}
                    autoComplete="off"
                  />
                );
              }}
            />
          </div>
        </fieldset>

        <fieldset className="field-group">
          <legend className="fieldset-legend">Tipo de cambio</legend>
          <div className="grid grid-2">
            <div className="field">
              <label htmlFor="tipo-cambio" className="field-label flex items-center justify-between">
                Pesos por dólar (ARS/USD)
                {tipoCambio && !buscandoDolar && (
                  <span className="badge-info text-xs">Actual</span>
                )}
              </label>
              <div className="tipo-cambio-control">
                <Controller
                  control={control}
                  name="tipo_cambio_ars_usd"
                  rules={{ required: 'El tipo de cambio es obligatorio', min: { value: 0.01, message: '>' } }}
                  render={({ field }) => (
                    <Input
                      type="number"
                      id="tipo-cambio"
                      step="0.01"
                      min="0.01"
                      placeholder="Ej.: 1000"
                      inputMode="decimal"
                      unit="ARS/USD"
                      error={errors.tipo_cambio_ars_usd?.message}
                      disabled={disabled || buscandoDolar}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(parsearNumeroAR(e.target.value))}
                      onBlur={field.onBlur}
                      autoComplete="off"
                    />
                  )}
                />
                <button
                  type="button"
                  className="btn-dolar"
                  onClick={onBuscarDolar}
                  disabled={disabled || buscandoDolar}
                  aria-label="Actualizar valor del dólar oficial"
                >
                  {buscandoDolar ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <ExternalLink size={16} aria-hidden="true" />
                  )}
                  <span>{buscandoDolar ? 'Actualizando…' : 'Actualizar dólar'}</span>
                </button>
              </div>
            </div>
          </div>
          {errors.tipo_cambio_ars_usd && (
            <p className="field-error" role="alert">{errors.tipo_cambio_ars_usd.message}</p>
          )}
        </fieldset>

        <fieldset className="field-group">
          <legend className="fieldset-legend">Opciones avanzadas</legend>
          <div className="acordion-avanzado">
            <button
              type="button"
              className="acordion-trigger"
              onClick={() => setValue('acordion_abierto', !watch('acordion_abierto'), { shouldValidate: false })}
              aria-expanded={watch('acordion_abierto')}
            >
              <span>Opciones avanzadas</span>
              <ChevronDown size={18} className={`acordeon-icon ${watch('acordion_abierto') ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            <div className="acordion-content" hidden={!watch('acordion_abierto')}>
              <div className="grid grid-2">
                <Controller
                  control={control}
                  name="algun_bulto_supera_50kg"
                  render={({ field }) => (
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={field.value ?? false}
                        onChange={(e) => field.onChange(e.target.checked)}
                        disabled={disabled}
                        className="checkbox-input"
                        autoComplete="off"
                      />
                      <span className="checkbox-text">Algún bulto supera 50 kg</span>
                    </label>
                  )}
                />
                <div className="help-tooltip">
                  <HelpCircle size={14} aria-hidden="true" />
                  <span>El límite de los regímenes simplificados es por bulto, no por el total del pedido.</span>
                </div>
              </div>

              <Controller
                control={control}
                name="ncm"
                render={({ field }) => (
                  <Input
                    label="NCM"
                    placeholder="Ej: 8471.30.00"
                    disabled={disabled}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    autoComplete="off"
                  />
                )}
              />

              <div className="grid grid-3">
                <Controller
                  control={control}
                  name="derecho_importacion_pct"
                  rules={{ min: 0, max: 100 }}
                  render={({ field }) => (
                    <Input
                      label="Derecho importación %"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      unit="%"
                      disabled={disabled}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(parsearNumeroAR(e.target.value))}
                      onBlur={field.onBlur}
                      autoComplete="off"
                    />
                  )}
                />
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
                      autoComplete="off"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="envios_usados_este_anio"
                  rules={{ min: 0, max: 10 }}
                  render={({ field }) => (
                    <Input
                      label="Envíos usados este año"
                      type="number"
                      step="1"
                      min="0"
                      max="10"
                      disabled={disabled}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      onBlur={field.onBlur}
                      autoComplete="off"
                    />
                  )}
                />
              </div>

              <div className="opciones-toggle">
                {OPCIONES_TOGGLE.map(({ key, label, descripcion, icon: Icon }) => {
                  const activo = watch(key);
                  return (
                    <label key={key} className={`opcion-toggle ${activo ? 'activa' : ''}`}>
                      <input
                        type="checkbox"
                        checked={activo}
                        onChange={(e) => setValue(key, e.target.checked, { shouldValidate: true })}
                        disabled={disabled}
                        className="opcion-checkbox"
                        autoComplete="off"
                      />
                      <div className="opcion-content">
                        <div className="opcion-header">
                          <Icon size={20} aria-hidden="true" />
                          <strong>{label}</strong>
                        </div>
                        <p className="opcion-descripcion">{descripcion}</p>
                      </div>
                      {activo && <CheckCircle size={20} className="opcion-check" />}
                    </label>
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
            </div>
          </div>
        </fieldset>

        <div className="formulario-actions">
          <Button
            type="button"
            variant="secondary"
            className="calculator-reset-button"
            onClick={() => form.reset(VALORES_DEFECTO)}
            disabled={disabled}
          >
            Reiniciar campos
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="calculator-example-button"
            onClick={() => form.reset(EJEMPLO)}
            disabled={disabled}
          >
            Cargar ejemplo
          </Button>
          <Button
            type="button"
            variant="primary"
            className="calculator-calculate-button"
            onClick={onCalcular}
            loading={calculando}
            disabled={disabled}
            aria-live="polite"
          >
            {calculando ? 'Calculando…' : 'Calcular'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const VALORES_DEFECTO = {
  precio_producto_usd: 0,
  costo_envio_usd: 0,
  seguro_usd: 0,
  cantidad_productos: 0,
  max_unidades_misma_especie: 1,
  impuestos_internos_pct: 0,
  tipo_cambio_ars_usd: 0,
  envio_incluye_impuestos_ddp: false,
  requiere_organismo_externo: false,
  algun_bulto_supera_50kg: false,
  envios_usados_este_anio: 0,
  ncm: '',
  derecho_importacion_pct: undefined,
  acordion_abierto: false,
};

const EJEMPLO = {
  precio_producto_usd: 2500,
  costo_envio_usd: 350,
  seguro_usd: 50,
  cantidad_productos: 10,
  max_unidades_misma_especie: 3,
  ncm: '8471.30.00',
  impuestos_internos_pct: 0,
  tipo_cambio_ars_usd: 1000,
  envio_incluye_impuestos_ddp: false,
  requiere_organismo_externo: false,
  algun_bulto_supera_50kg: false,
  envios_usados_este_anio: 2,
  acordion_abierto: true,
};
