import { useEffect, useId, useRef, useState } from 'react';
import { Calculator, X, Download } from 'lucide-react';
import type { CalculoResponse, RegimenResultado } from '@/types/api';
import { formatearUSD, formatearARS, formatearPorcentaje, formatearUSDEntero, formatearARSEntero } from '@/utils/format';
import { Button } from '@/components/ui';
import { descargarPDF } from '@/utils/pdf';

interface ResultadosProps {
  resultado: CalculoResponse | null;
  moneda: 'USD' | 'ARS';
  escenario: 'conservador' | 'minimo';
  onEscenarioChange: (e: 'conservador' | 'minimo') => void;
  sensibilidadDolar: number;
  onSensibilidadChange: (v: number) => void;
  onCargarEjemplo?: () => void;
}

type Escenario = 'conservador' | 'minimo';

function RegimenCard({
  regimen,
  esMasBarato,
  moneda,
  escenarioActivo,
  sensibilidadDolar = 0,
}: {
  regimen: RegimenResultado;
  esMasBarato: boolean;
  moneda: 'USD' | 'ARS';
  escenarioActivo: Escenario;
  sensibilidadDolar?: number;
}) {
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const { escenario_conservador: conservador, escenario_minimo: minimo } = regimen;
  const esc = escenarioActivo === 'conservador' ? conservador : minimo;
  const factor = 1 + sensibilidadDolar / 100;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (detalleAbierto && !dialog.open) dialog.showModal();
    if (!detalleAbierto && dialog.open) dialog.close();
  }, [detalleAbierto]);

  const monto = (usd: number, ars: number) => (moneda === 'USD' ? formatearUSD(usd) : formatearARS(ars * factor));
  const montoUnidad = (usd: number, ars: number) => (moneda === 'USD' ? formatearUSDEntero(usd) : formatearARSEntero(ars * factor));

  const costoTotal = esc ? monto(esc.costo_total_puesto_pais_usd, esc.costo_total_puesto_pais_ars) : '—';
  const impuestosTotal = esc ? monto(esc.total_impuestos_usd, esc.total_impuestos_ars) : '—';
  const pctCif = esc ? formatearPorcentaje(esc.pct_sobre_cif) : '—';
  const costoPorUnidad = esc?.costo_por_unidad_usd != null
    ? montoUnidad(esc.costo_por_unidad_usd, esc.costo_por_unidad_ars ?? 0)
    : '—';

  return (
    <article className={`regimen-card bg-white border border-surface-200 rounded-xl shadow-sm ${esMasBarato ? 'ring-2 ring-primary-500' : ''}`}>
      <header className="regimen-card-header p-5 border-b border-surface-100">
        <h3 className="font-semibold text-surface-900">{regimen.regimen_nombre}</h3>
      </header>

      <div className="regimen-card-body p-5">
        <dl className="grid grid-cols-1 gap-3">
          <div className="regimen-card-metric flex min-w-0 flex-col">
            <dt className="w-full text-right text-caption text-surface-500">Costo total</dt>
            <dd className="w-full max-w-full break-words text-right font-mono tabular-nums text-surface-900 text-base font-semibold">{costoTotal}</dd>
          </div>
          <div className="regimen-card-metric flex min-w-0 flex-col">
            <dt className="w-full text-right text-caption text-surface-500">Impuestos</dt>
            <dd className="w-full max-w-full break-words text-right font-mono tabular-nums text-surface-900 text-base font-semibold">{impuestosTotal}</dd>
          </div>
          <div className="regimen-card-metric flex min-w-0 flex-col">
            <dt className="w-full text-right text-caption text-surface-500">% sobre CIF</dt>
            <dd className="w-full max-w-full break-words text-right font-mono tabular-nums text-surface-900 text-base font-semibold">{pctCif}</dd>
          </div>
          <div className="regimen-card-metric flex min-w-0 flex-col">
            <dt className="w-full text-right text-caption text-surface-500">Costo por unidad</dt>
            <dd className="w-full max-w-full break-words text-right font-mono tabular-nums text-surface-900 text-base font-semibold">{costoPorUnidad}</dd>
          </div>
        </dl>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="regimen-card-details-button"
          onClick={() => setDetalleAbierto(true)}
          disabled={!esc}
        >
          Ver impuestos
        </Button>
      </div>

      <dialog
        ref={dialogRef}
        className="tax-detail-dialog"
        aria-labelledby={tituloId}
        onClose={() => setDetalleAbierto(false)}
        onCancel={(event) => {
          event.preventDefault();
          dialogRef.current?.close();
          setDetalleAbierto(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setDetalleAbierto(false);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            dialogRef.current?.close();
            setDetalleAbierto(false);
          }
        }}
      >
        <div className="tax-detail-modal">
          <header className="tax-detail-header">
            <div>
              <p className="tax-detail-eyebrow">
                Escenario {escenarioActivo === 'conservador' ? 'conservador' : 'mínimo'}
              </p>
              <h2 id={tituloId}>{regimen.regimen_nombre}</h2>
              <p>Detalle de impuestos</p>
            </div>
            <button
              type="button"
              className="tax-detail-close"
              onClick={() => setDetalleAbierto(false)}
              aria-label="Cerrar detalle de impuestos"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>

          <div className="tax-detail-content">
            {esc && esc.tributos.length > 0 ? (
              <div className="tax-detail-table-wrap">
                <table className="tax-detail-table">
                  <thead>
                    <tr>
                      <th scope="col">Impuesto</th>
                      <th scope="col">Base imponible</th>
                      <th scope="col">Alícuota</th>
                      <th scope="col" className="text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {esc.tributos.map((tributo, index) => {
                      const tieneRango = tributo.rango_min_pct != null
                        && tributo.rango_max_pct != null
                        && tributo.rango_min_pct !== tributo.rango_max_pct;

                      return (
                        <tr key={`${regimen.regimen_id}-${escenarioActivo}-${index}`}>
                          <th scope="row">
                            <span>{tributo.nombre}</span>
                            {(tributo.a_confirmar || tributo.es_estimado_maximo || tieneRango) && (
                              <span className="tax-detail-note">
                                {tributo.a_confirmar && 'A confirmar'}
                                {tributo.a_confirmar && tributo.es_estimado_maximo && ' · '}
                                {tributo.es_estimado_maximo && 'Valor máximo estimado'}
                                {tieneRango && (
                                  <span>
                                    {tributo.a_confirmar || tributo.es_estimado_maximo ? ' · ' : ''}
                                    Rango: {formatearPorcentaje(tributo.rango_min_pct!)} – {formatearPorcentaje(tributo.rango_max_pct!)}
                                  </span>
                                )}
                              </span>
                            )}
                            {tributo.tipo === 'cargo' && (
                              <span className="tax-detail-note">Cargo operativo; no incluido en total de impuestos.</span>
                            )}
                            {tributo.tipo === 'informativo' && (
                              <span className="tax-detail-note">Informativo; no incluido en los totales.</span>
                            )}
                            {tributo.descripcion && (
                              <span className="tax-detail-note">{tributo.descripcion}</span>
                            )}
                          </th>
                          <td>{formatearUSD(tributo.base_usd)}</td>
                          <td>{formatearPorcentaje(tributo.alicuota_pct)}</td>
                          <td className="text-right font-mono tabular-nums">
                            {moneda === 'USD'
                              ? formatearUSD(tributo.monto_usd)
                              : formatearARS(tributo.monto_ars * factor)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="tax-detail-empty">Este escenario no tiene tributos detallados.</p>
            )}

            {esc && (
              <dl className="tax-detail-total">
                <div>
                  <dt>Total de impuestos</dt>
                  <dd>{monto(esc.total_impuestos_usd, esc.total_impuestos_ars)}</dd>
                </div>
                {(esc.total_cargos_usd ?? 0) > 0 && (
                  <div>
                    <dt>Total de gastos operativos</dt>
                    <dd>{monto(esc.total_cargos_usd ?? 0, esc.total_cargos_ars ?? 0)}</dd>
                  </div>
                )}
                <div>
                  <dt>Porcentaje sobre CIF</dt>
                  <dd>{formatearPorcentaje(esc.pct_sobre_cif)}</dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      </dialog>
    </article>
  );
}

export function Resultados({
  resultado,
  moneda,
  escenario,
  onEscenarioChange,
  sensibilidadDolar,
  onCargarEjemplo,
}: ResultadosProps) {
  const handleDescargarPDF = () => {
    if (!resultado) return;
    descargarPDF({ resultado, moneda, escenario, sensibilidadDolar });
  };

  if (!resultado) {
    return (
      <div className="resultados">
        <div className="estado-vacio">
          <div className="mb-3 rounded-full bg-blue-50 p-4">
            <Calculator size={48} className="text-blue-500" aria-hidden="true" />
          </div>
          <p>Los resultados aparecerán aquí al completar el formulario</p>
          {onCargarEjemplo && (
            <Button
              variant="primary"
              onClick={onCargarEjemplo}
              className="mt-4 !bg-blue-600 !text-white hover:!bg-blue-700 transition-colors font-medium"
            >
              Cargar ejemplo
            </Button>
          )}
        </div>
      </div>
    );
  }

  const masBaratoId = resultado.regimen_mas_barato_elegible;
  return (
    <div className="resultados animate-step-in w-full">
      <div className="resultados-header mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="resultados-title">Comparativa Detallada de Regímenes</h2>
        <div className="resultados-controls flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="escenario-toggle" role="group" aria-label="Escenario">
            <button
              type="button"
              className={`escenario-btn ${escenario === 'conservador' ? 'active' : ''}`}
              onClick={() => onEscenarioChange('conservador')}
            >
              Conservador
            </button>
            <button
              type="button"
              className={`escenario-btn ${escenario === 'minimo' ? 'active' : ''}`}
              onClick={() => onEscenarioChange('minimo')}
            >
              Mínimo
            </button>
          </div>
          <span className="escenario-ayuda text-caption text-surface-500">
            Conservador: todas las alícuotas en su valor máximo.
          </span>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleDescargarPDF}
            className="ml-auto !bg-blue-600 !text-white hover:!bg-blue-700 transition-colors font-medium flex items-center gap-1.5"
            aria-label="Descargar cotización en PDF"
          >
            <Download size={16} aria-hidden="true" />
            Descargar PDF
          </Button>
        </div>
      </div>

      <div className="resultados-body">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="region" aria-label="Detalle por régimen">
          {resultado.regímenes.map((regimen) => (
            <RegimenCard
              key={regimen.regimen_id}
              regimen={regimen}
              esMasBarato={regimen.regimen_id === masBaratoId}
              moneda={moneda}
              escenarioActivo={escenario}
              sensibilidadDolar={sensibilidadDolar}
            />
          ))}
        </div>

        <p className="disclaimer mt-4">
          <strong>⚠ Estimación aproximada.</strong> No sustituye asesoramiento aduanero profesional.
          Verifique vigencia de regímenes con su courier/despachante.
        </p>
      </div>
    </div>
  );
}