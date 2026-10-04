import { useWatch, Controller } from 'react-hook-form';
import { Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import type { FormData } from '@/schemas/formSchema';
import { Input, Button } from '@/components/ui';
import { parsearNumeroAR } from '@/utils/calculos';

interface Step2EnvioBultosProps {
  form: ReturnType<typeof import('react-hook-form').useForm<import('@/schemas/formSchema').FormInput>>;
  disabled: boolean;
  pesoRealTotal: number;
  pesoVolumetrico: number;
  pesoFacturable: number;
  volumenM3: number;
  usdPorKg: number;
}

export function Step2EnvioBultos({
  form,
  disabled,
  pesoRealTotal,
  pesoVolumetrico,
  pesoFacturable,
  volumenM3,
  usdPorKg,
}: Step2EnvioBultosProps) {
  const { control, watch, setValue, formState: { errors } } = form;
  const bultos = watch('bultos') || [];
  const modoTransporte = watch('modo_transporte');

  const agregarBulto = () => {
    setValue('bultos', [...bultos, { largo_cm: 40, ancho_cm: 30, alto_cm: 20, peso_kg: 5 }], { shouldValidate: true });
  };

  const quitarBulto = (index: number) => {
    if (bultos.length <= 1) return;
    const nuevos = bultos.filter((_, i) => i !== index);
    setValue('bultos', nuevos, { shouldValidate: true });
  };

  const esPesoVolumetrico = modoTransporte === 'aereo' && pesoVolumetrico > pesoRealTotal;
  const pesoQueSeCobra = esPesoVolumetrico ? pesoVolumetrico : pesoRealTotal;

  return (
    <div className="step animate-step-in">
      <div className="step-header">
        <h2 className="step-title">Paso 2 de 4: Envío y bultos</h2>
        <p className="step-subtitle">Medidas y peso de cada bulto</p>
      </div>

      <div className="step-body">
        <fieldset className="field-group">
          <legend className="fieldset-legend">Bultos</legend>

          <div className="bultos-table-wrapper">
            <table className="bultos-table" role="grid">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Largo (cm)</th>
                  <th scope="col">Ancho (cm)</th>
                  <th scope="col">Alto (cm)</th>
                  <th scope="col">Peso (kg)</th>
                  <th scope="col"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {bultos.map((bulto, index) => (
                  <tr key={index}>
                    <td className="bulto-index">{index + 1}</td>
                    <td>
                      <Controller
                        control={control}
                        name={`bultos.${index}.largo_cm`}
                        rules={{ required: true, min: { value: 0.1, message: '>' } }}
                        render={({ field }) => (
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="0"
                            className="compact"
                            disabled={disabled}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(parsearNumeroAR(e.target.value))}
                            onBlur={field.onBlur}
                            aria-label={`Largo bulto ${index + 1}`}
                          />
                        )}
                      />
                    </td>
                    <td>
                      <Controller
                        control={control}
                        name={`bultos.${index}.ancho_cm`}
                        rules={{ required: true, min: { value: 0.1, message: '>' } }}
                        render={({ field }) => (
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="0"
                            className="compact"
                            disabled={disabled}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(parsearNumeroAR(e.target.value))}
                            onBlur={field.onBlur}
                            aria-label={`Ancho bulto ${index + 1}`}
                          />
                        )}
                      />
                    </td>
                    <td>
                      <Controller
                        control={control}
                        name={`bultos.${index}.alto_cm`}
                        rules={{ required: true, min: { value: 0.1, message: '>' } }}
                        render={({ field }) => (
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="0"
                            className="compact"
                            disabled={disabled}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(parsearNumeroAR(e.target.value))}
                            onBlur={field.onBlur}
                            aria-label={`Alto bulto ${index + 1}`}
                          />
                        )}
                      />
                    </td>
                    <td>
                      <Controller
                        control={control}
                        name={`bultos.${index}.peso_kg`}
                        rules={{ required: true, min: { value: 0.01, message: '>' } }}
                        render={({ field }) => (
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            className="compact"
                            disabled={disabled}
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(parsearNumeroAR(e.target.value))}
                            onBlur={field.onBlur}
                            aria-label={`Peso bulto ${index + 1}`}
                          />
                        )}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-icon-danger"
                        onClick={() => quitarBulto(index)}
                        disabled={disabled || bultos.length <= 1}
                        aria-label={`Eliminar bulto ${index + 1}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            className="btn-add-bulto"
            onClick={agregarBulto}
            disabled={disabled}
          >
            <Plus size={18} /> Agregar bulto
          </button>

          {errors.bultos && (
            <p className="field-error" role="alert">{errors.bultos.message}</p>
          )}
        </fieldset>

        <fieldset className="field-group">
          <legend className="fieldset-legend">Cantidad de unidades</legend>
          <Controller
            control={control}
            name="cantidad_unidades"
            rules={{ required: 'La cantidad es obligatoria', min: { value: 1, message: 'Mínimo 1' } }}
            render={({ field }) => (
              <Input
                label="Unidades totales"
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
        </fieldset>

        <div className="resumen-pesos">
          <h3 className="resumen-title">Resumen de pesos</h3>
          <div className="pesos-grid">
            <div className={`peso-card ${!esPesoVolumetrico && modoTransporte === 'aereo' ? 'activo' : ''}`}>
              <dt>Peso real</dt>
              <dd className="tabular">{pesoRealTotal.toFixed(2)} kg</dd>
            </div>
            {modoTransporte === 'aereo' && (
              <div className={`peso-card ${esPesoVolumetrico ? 'activo' : ''}`}>
                <dt>Peso volumétrico</dt>
                <dd className="tabular">{pesoVolumetrico.toFixed(2)} kg</dd>
              </div>
            )}
            <div className={`peso-card ${modoTransporte !== 'aereo' || esPesoVolumetrico ? 'activo' : ''} principal`}>
              <dt className="flex items-center gap-1">
                Peso facturable
                {pesoQueSeCobra === pesoVolumetrico && (
                  <span className="badge-cobrado">· se cobra</span>
                )}
              </dt>
              <dd className="tabular text-lg">{pesoQueSeCobra.toFixed(2)} kg</dd>
            </div>
            <div className="peso-card">
              <dt>Volumen</dt>
              <dd className="tabular">{volumenM3.toFixed(4)} m³</dd>
            </div>
            {modoTransporte === 'aereo' && usdPorKg > 0 && (
              <div className="peso-card">
                <dt>USD/kg flete</dt>
                <dd className="tabular">{usdPorKg.toFixed(4)}</dd>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}