import { useState } from 'react';
import { Award, AlertCircle, CheckCircle, XCircle, ChevronDown, Calculator, HelpCircle, TrendingUp } from 'lucide-react';
import type { CalculoResponse, RegimenResultado, TributoDetalle } from '@/types/api';
import { formatearUSD, formatearARS, formatearPorcentaje } from '@/utils/format';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';

interface Step4ComparativaFinalProps {
  resultado: CalculoResponse | null;
  moneda: 'USD' | 'ARS';
  onMonedaChange: (m: 'USD' | 'ARS') => void;
  sensibilidadDolar?: number;
}

type Elegible = boolean | null | undefined;
type Escenario = 'conservador' | 'minimo';

function claseElegibilidad(elegible: Elegible): string {
  if (elegible === true) return 'bg-success-50 text-success-700';
  if (elegible === false) return 'bg-danger-50 text-danger-700';
  return 'bg-warning-50 text-warning-700';
}

function textoElegibilidad(elegible: Elegible): string {
  if (elegible === true) return 'ELEGIBLE';
  if (elegible === false) return 'NO ELEGIBLE';
  return 'ELEGIBLE CON ADVERTENCIAS';
}

function IconoElegibilidad({ elegible }: { elegible: Elegible }) {
  if (elegible === true) return <CheckCircle size={14} aria-hidden="true" />;
  if (elegible === false) return <XCircle size={14} aria-hidden="true" />;
  return <AlertCircle size={14} aria-hidden="true" />;
}

function TributoRow({
  tributo,
  moneda,
  sensibilidadDolar,
}: {
  tributo: TributoDetalle;
  moneda: 'USD' | 'ARS';
  sensibilidadDolar?: number;
}) {
  const esMaximo = tributo.es_estimado_maximo;
  const { rango_min_pct: min, rango_max_pct: max } = tributo;
  const tieneRango = min != null && max != null && min !== max;

  const factor = 1 + (sensibilidadDolar ?? 0) / 100;
  const montoARS = formatearARS(tributo.monto_ars * factor);
  const montoUSD = formatearUSD(tributo.monto_usd);
  const monto = moneda === 'USD' ? montoUSD : montoARS;

  return (
    <TableRow className={esMaximo ? 'bg-warning-50' : ''}>
      <TableCell>
        <div className="tributo-nombre flex items-center gap-2 flex-wrap">
          {tributo.nombre}
          {tributo.a_confirmar && (
            <span className="badge-warning" title="Parámetro a confirmar con fuente oficial" aria-label="A confirmar">
              A CONFIRMAR
            </span>
          )}
          {esMaximo && (
            <span className="badge-warning" title="Estimado con el valor máximo del rango" aria-label="Valor máximo">
              MÁX
            </span>
          )}
        </div>
        {tieneRango && (
          <div className="tributo-rango text-caption text-surface-500 mt-1">
            Rango: {formatearPorcentaje(min * 100)} – {formatearPorcentaje(max * 100)}
          </div>
        )}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums">{formatearUSD(tributo.base_usd)}</TableCell>
      <TableCell className="text-right font-mono tabular-nums">{formatearPorcentaje(tributo.alicuota_pct)}</TableCell>
      <TableCell className="text-right font-mono tabular-nums">{monto}</TableCell>
    </TableRow>
  );
}

export function Step4ComparativaFinal({
  resultado,
  moneda,
  onMonedaChange,
  sensibilidadDolar = 0,
}: Step4ComparativaFinalProps) {
  const [escenarioActivo, setEscenarioActivo] = useState<Escenario>('conservador');

  if (!resultado) {
    return (
      <div className="step animate-step-in">
        <div className="step-header">
          <h2 className="step-title">Paso 4 de 4: Comparativa final</h2>
        </div>
        <div className="estado-vacio">
          <Calculator size={48} aria-hidden="true" />
          <p>Los resultados aparecerán aquí al completar los pasos anteriores</p>
        </div>
      </div>
    );
  }

  const masBaratoId = resultado.regimen_mas_barato_elegible;
  const mejorRegimen = resultado.regímenes.find(r => r.regimen_id === masBaratoId);
  const factor = 1 + sensibilidadDolar / 100;

  // Helpers de formato con sensibilidad
  const fmt = (usd: number, ars: number) => (moneda === 'USD' ? formatearUSD(usd) : formatearARS(ars * factor));
  const fmtUSDOnly = (usd: number) => formatearUSD(usd);
  const fmtARSOnly = (ars: number) => formatearARS(ars * factor);

  // Datos del mejor régimen
  const escPrincipal = mejorRegimen ? (escenarioActivo === 'conservador' ? mejorRegimen.escenario_conservador : mejorRegimen.escenario_minimo) : null;
  const escConservador = mejorRegimen?.escenario_conservador;
  const escMinimo = mejorRegimen?.escenario_minimo;

  const costoTotalPrincipal = escPrincipal ? fmt(escPrincipal.costo_total_puesto_pais_usd, escPrincipal.costo_total_puesto_pais_ars) : '—';
  const costoTotalSecundario = moneda === 'USD' ? (escPrincipal ? fmtARSOnly(escPrincipal.costo_total_puesto_pais_ars) : '—') : (escPrincipal ? fmtUSDOnly(escPrincipal.costo_total_puesto_pais_usd) : '—');
  const impuestosTotales = escPrincipal ? fmt(escPrincipal.total_impuestos_usd, escPrincipal.total_impuestos_ars) : '—';
  const pctCif = escPrincipal ? formatearPorcentaje(escPrincipal.pct_sobre_cif) : '—';
  const costoPorUnidad = escPrincipal && escPrincipal.costo_por_unidad_usd != null ? fmt(escPrincipal.costo_por_unidad_usd, escPrincipal.costo_por_unidad_ars ?? 0) : null;

  const costoTotalConservador = escConservador ? fmt(escConservador.costo_total_puesto_pais_usd, escConservador.costo_total_puesto_pais_ars) : '—';
  const costoTotalMinimo = escMinimo ? fmt(escMinimo.costo_total_puesto_pais_usd, escMinimo.costo_total_puesto_pais_ars) : '—';

  return (
    <div className="step animate-step-in">
      <div className="step-header">
        <h2 className="step-title">Paso 4 de 4: Comparativa final</h2>
        <div className="step-actions">
          <div className="moneda-toggle" role="group" aria-label="Moneda">
            <button
              type="button"
              className={`moneda-btn ${moneda === 'USD' ? 'active' : ''}`}
              onClick={() => onMonedaChange('USD')}
            >
              USD
            </button>
            <button
              type="button"
              className={`moneda-btn ${moneda === 'ARS' ? 'active' : ''}`}
              onClick={() => onMonedaChange('ARS')}
            >
              ARS
            </button>
          </div>
          <div className="escenario-toggle" role="group" aria-label="Escenario">
            <button
              type="button"
              className={`escenario-btn ${escenarioActivo === 'conservador' ? 'active' : ''}`}
              onClick={() => setEscenarioActivo('conservador')}
            >
              Conservador
            </button>
            <button
              type="button"
              className={`escenario-btn ${escenarioActivo === 'minimo' ? 'active' : ''}`}
              onClick={() => setEscenarioActivo('minimo')}
            >
              Mínimo
            </button>
          </div>
          <span className="escenario-ayuda text-caption text-surface-500">
            Conservador: todas las alícuotas en su valor máximo.
          </span>
        </div>
      </div>

      <div className="step-body">
        {resultado.advertencias_globales && resultado.advertencias_globales.length > 0 && (
          <div className="alert alert-warning mb-4" role="alert" aria-live="polite">
            <HelpCircle size={18} aria-hidden="true" />
            <ul className="space-y-1">
              {resultado.advertencias_globales.map((a, i) => (
                <li key={i} className="text-body-sm">{a}</li>
              ))}
            </ul>
          </div>
        )}

        {masBaratoId && (
          <div className="tarjeta-principal mb-6" role="region" aria-live="polite" aria-label="Mejor régimen">
            <div className={`tarjeta-principal-inner ${resultado.regímenes.find(r => r.regimen_id === masBaratoId)?.elegibilidad?.elegible === false ? 'no-elegible' : ''}`}>
              <div className="tarjeta-principal-header">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-surface-900">
                      {resultado.regímenes.find(r => r.regimen_id === masBaratoId)?.regimen_nombre}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-caption font-medium bg-primary-50 text-primary-700">
                      <Award size={12} aria-hidden="true" /> Más conveniente
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-surface-600">
                    <span>Conservador – Mínimo: {costoTotalConservador} – {costoTotalMinimo}</span>
                    {sensibilidadDolar !== 0 && (
                      <span className="sensibilidad-badge">
                        <TrendingUp size={10} aria-hidden="true" /> Estimado con dólar {sensibilidadDolar > 0 ? '+' : ''}{sensibilidadDolar}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="tarjeta-principal-valores">
                <div className="tarjeta-principal-total">
                  <span className="tarjeta-principal-label">Costo total puesto en Argentina</span>
                  <span className="tarjeta-principal-monto whitespace-nowrap font-mono tabular-nums text-2xl font-bold text-surface-900">
                    {costoTotalPrincipal}
                  </span>
                  <span className="tarjeta-principal-secundaria whitespace-nowrap font-mono tabular-nums text-surface-600">
                    ({costoTotalSecundario})
                  </span>
                </div>
                <div className="tarjeta-principal-detalles">
                  <div>
                    <span className="text-surface-600">Impuestos totales</span>
                    <span className="font-mono tabular-nums ml-2">{impuestosTotales}</span>
                    <span className="text-surface-500 ml-1">({pctCif} sobre CIF)</span>
                  </div>
                  {costoPorUnidad && (
                    <div>
                      <span className="text-surface-600">Costo por unidad</span>
                      <span className="font-mono tabular-nums ml-2">{costoPorUnidad}</span>
                    </div>
                  )}
                  {sensibilidadDolar !== 0 && (
                    <div className="sensibilidad-badge">
                      <TrendingUp size={10} aria-hidden="true" /> Montos en ARS ajustados por variación del dólar (+{sensibilidadDolar}%)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="acordeones-regimenes space-y-4" role="region" aria-label="Detalle por régimen">
          {resultado.regímenes.map((regimen) => (
            <RegimenAccordion
              key={regimen.regimen_id}
              regimen={regimen}
              esMasBarato={regimen.regimen_id === masBaratoId}
              moneda={moneda}
              escenarioActivo={escenarioActivo}
              sensibilidadDolar={sensibilidadDolar}
              defaultExpanded={regimen.regimen_id === masBaratoId}
            />
          ))}
        </div>

        <details className="leyenda mt-6" role="group">
          <summary className="cursor-pointer font-medium text-surface-700">Leyenda</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-body-sm text-surface-600">
            <div className="flex items-center gap-2"><span className="badge-warning flex-shrink-0">MÁX</span><span>= Valor máximo del rango (estimación conservadora)</span></div>
            <div className="flex items-center gap-2"><span className="badge-warning flex-shrink-0">A CONFIRMAR</span><span>= Parámetro a confirmar con fuente oficial</span></div>
            <div className="flex items-center gap-2"><span className="badge-danger flex-shrink-0">Conservador</span><span>= Todas las alícuotas en su valor máximo</span></div>
            <div className="flex items-center gap-2"><span className="badge-success flex-shrink-0">Mínimo</span><span>= Todas las alícuotas en su valor mínimo</span></div>
            <div className="flex items-center gap-2"><span className="flex-shrink-0 w-5 text-center">•</span><span>El costo final destacado es el <strong>escenario conservador</strong> (más seguro para presupuestar)</span></div>
          </div>
        </details>

        <p className="disclaimer mt-4">
          <strong>⚠ Estimación aproximada.</strong> No sustituye asesoramiento aduanero profesional.
          Verifique vigencia de regímenes con su courier/despachante.
        </p>
      </div>
    </div>
  );
}

function RegimenAccordion({
  regimen,
  esMasBarato,
  moneda,
  escenarioActivo,
  sensibilidadDolar = 0,
  defaultExpanded,
}: {
  regimen: RegimenResultado;
  esMasBarato: boolean;
  moneda: 'USD' | 'ARS';
  escenarioActivo: Escenario;
  sensibilidadDolar?: number;
  defaultExpanded: boolean;
}) {
  const { elegibilidad, escenario_conservador: conservador, escenario_minimo: minimo, advertencias_generales } = regimen;
  const elegible: Elegible = elegibilidad?.elegible;
  const noElegible = elegible === false;

  const esc = escenarioActivo === 'conservador' ? conservador : minimo;
  const factor = 1 + (sensibilidadDolar ?? 0) / 100;

  const monto = (usd: number, ars: number) => (moneda === 'USD' ? formatearUSD(usd) : formatearARS(ars * factor));

  const costoTotal = esc ? monto(esc.costo_total_puesto_pais_usd, esc.costo_total_puesto_pais_ars) : '—';
  const impuestosTotal = esc ? monto(esc.total_impuestos_usd, esc.total_impuestos_ars) : '—';
  const pctCif = esc ? formatearPorcentaje(esc.pct_sobre_cif) : '—';
  const tieneMotivos = (elegibilidad?.motivos?.length ?? 0) > 0;
  const totalAdvertencias = (advertencias_generales?.length ?? 0) + (noElegible && tieneMotivos ? elegibilidad?.motivos?.length ?? 0 : 0);

  return (
    <details className={`acordeon-regimen ${noElegible ? 'no-elegible' : ''} ${esMasBarato ? 'mas-barato' : ''}`} open={defaultExpanded}>
      <summary className="acordeon-trigger">
        {/* Línea 1: Nombre completo + chevron */}
        <div className="acordeon-header-line-1 flex items-center justify-between gap-4">
          <h3 className="font-semibold text-surface-900 min-w-0">{regimen.regimen_nombre}</h3>
          <ChevronDown size={18} className="acordeon-icon flex-shrink-0" aria-hidden="true" />
        </div>

        {/* Línea 2: Badges + contador advertencias */}
        <div className="acordeon-header-line-2 flex flex-wrap items-center gap-2 mt-1">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-medium ${claseElegibilidad(elegible)}`}>
            <IconoElegibilidad elegible={elegible} />
            {textoElegibilidad(elegible)}
          </span>
          {regimen.a_confirmar && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-warning-50 text-warning-700" title="Parámetros a confirmar">
              A CONFIRMAR
            </span>
          )}
          {esMasBarato && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-caption font-medium bg-primary-50 text-primary-700">
              <Award size={10} aria-hidden="true" /> Más conveniente
            </span>
          )}
          {totalAdvertencias > 0 && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-surface-100 text-surface-600">
              {totalAdvertencias} advertencia{totalAdvertencias > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Línea 3: Tres datos clave */}
        <div className="acordeon-header-line-3 grid grid-cols-3 gap-3 mt-2 pt-2 border-t border-surface-200">
          <div className="acordeon-header-stat flex flex-col items-start min-w-0">
            <span className="text-caption text-surface-500">Costo total</span>
            <span className="font-mono tabular-nums text-surface-900 whitespace-nowrap">{costoTotal}</span>
          </div>
          <div className="acordeon-header-stat flex flex-col items-start min-w-0">
            <span className="text-caption text-surface-500">Impuestos</span>
            <span className="font-mono tabular-nums text-surface-900 whitespace-nowrap">{impuestosTotal}</span>
          </div>
          <div className="acordeon-header-stat flex flex-col items-start min-w-0">
            <span className="text-caption text-surface-500">% sobre CIF</span>
            <span className="font-mono tabular-nums text-surface-900 whitespace-nowrap">{pctCif}</span>
          </div>
        </div>

        <ChevronDown size={18} className="acordeon-icon flex-shrink-0" aria-hidden="true" />
      </summary>

      {esc && (
        <div className="acordeon-content p-4 overflow-x-auto">
          {/* Advertencias y motivos completos como primer bloque del contenido expandido */}
          {((noElegible && tieneMotivos) || (advertencias_generales?.length ?? 0) > 0) && (
            <div className="acordeon-advertencias mb-4 p-3 border border-surface-200 rounded-radius-md bg-surface-50">
              {noElegible && tieneMotivos && (
                <div className="mb-2">
                  <span className="font-medium text-danger-600">No elegible:</span>
                  <ul className="mt-1 space-y-1">
                    {elegibilidad?.motivos?.map((m, i) => (
                      <li key={i} className="flex items-center gap-1 text-danger-600 text-body-sm">
                        <XCircle size={12} aria-hidden="true" /> {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {advertencias_generales && advertencias_generales.length > 0 && (
                <div>
                  <span className="font-medium text-surface-700">Advertencias:</span>
                  <ul className="mt-1 space-y-1">
                    {advertencias_generales.map((a, i) => (
                      <li key={i} className="flex items-center gap-1 text-surface-600 text-body-sm">
                        <HelpCircle size={12} aria-hidden="true" /> {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="tributos-container">
            <Table className="tributos-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Tributo</TableHead>
                  <TableHead className="text-right">Base (USD)</TableHead>
                  <TableHead className="text-right">Alícuota</TableHead>
                  <TableHead className="text-right">Monto ({moneda === 'USD' ? 'USD' : 'ARS'})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {esc.tributos.map((t: TributoDetalle, i: number) => (
                  <TributoRow key={`${regimen.regimen_id}-${escenarioActivo === 'conservador' ? 'c' : 'm'}-${i}`} tributo={t} moneda={moneda} sensibilidadDolar={sensibilidadDolar} />
                ))}

                <TableRow className="bg-surface-50 border-t-2 border-surface-200">
                  <TableCell><strong>Total impuestos</strong></TableCell>
                  <TableCell />
                  <TableCell className="text-right">
                    <strong>{formatearPorcentaje(esc.pct_sobre_cif)} sobre CIF</strong>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    <strong>{moneda === 'USD' ? formatearUSD(esc.total_impuestos_usd) : formatearARS(esc.total_impuestos_ars * (1 + (sensibilidadDolar ?? 0) / 100))}</strong>
                  </TableCell>
                </TableRow>

                <TableRow className="bg-surface-50">
                  <TableCell><strong>Costo total puesto en Argentina</strong></TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right font-mono tabular-nums">
                    <strong>{moneda === 'USD' ? formatearUSD(esc.costo_total_puesto_pais_usd) : formatearARS(esc.costo_total_puesto_pais_ars * (1 + (sensibilidadDolar ?? 0) / 100))}</strong>
                  </TableCell>
                </TableRow>

                {esc.costo_por_unidad_usd != null && (
                  <TableRow className="text-surface-500">
                    <TableCell>Costo por unidad</TableCell>
                    <TableCell />
                    <TableCell />
                    <TableCell className="text-right font-mono tabular-nums">
                      {moneda === 'USD' ? formatearUSD(esc.costo_por_unidad_usd) : formatearARS((esc.costo_por_unidad_ars ?? 0) * (1 + (sensibilidadDolar ?? 0) / 100))}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="tributos-cards mt-4 space-y-3" role="list">
              {esc.tributos.map((t: TributoDetalle, i: number) => (
                <div key={`${regimen.regimen_id}-${escenarioActivo === 'conservador' ? 'c' : 'm'}-${i}`} className="tributo-card p-3 border border-surface-200 rounded-radius-md" role="listitem">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-surface-900">{t.nombre}</span>
                      {t.a_confirmar && (
                        <span className="badge-warning" title="Parámetro a confirmar" aria-label="A confirmar">A CONFIRMAR</span>
                      )}
                      {t.es_estimado_maximo && (
                        <span className="badge-warning" title="Valor máximo" aria-label="Máximo">MÁX</span>
                      )}
                    </div>
                    <span className="font-mono tabular-nums text-surface-900 whitespace-nowrap">{moneda === 'USD' ? formatearUSD(t.monto_usd) : formatearARS(t.monto_ars * (1 + (sensibilidadDolar ?? 0) / 100))}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1 text-caption text-surface-500">
                    <span>Base: {formatearUSD(t.base_usd)} · Alícuota: {formatearPorcentaje(t.alicuota_pct)}</span>
                    {t.rango_min_pct != null && t.rango_max_pct != null && t.rango_min_pct !== t.rango_max_pct && (
                      <span>Rango: {formatearPorcentaje(t.rango_min_pct * 100)} – {formatearPorcentaje(t.rango_max_pct * 100)}</span>
                    )}
                  </div>
                </div>
              ))}
              <div className="p-3 border-t-2 border-surface-200 bg-surface-50 rounded-radius-md">
                <div className="flex items-center justify-between gap-2">
                  <strong>Total impuestos</strong>
                  <strong className="font-mono tabular-nums">{moneda === 'USD' ? formatearUSD(esc.total_impuestos_usd) : formatearARS(esc.total_impuestos_ars * (1 + (sensibilidadDolar ?? 0) / 100))}</strong>
                </div>
                <div className="text-caption text-surface-500 mt-1 text-right">
                  {formatearPorcentaje(esc.pct_sobre_cif)} sobre CIF
                </div>
              </div>
              <div className="p-3 border-t-2 border-surface-200 bg-surface-50 rounded-radius-md">
                <div className="flex items-center justify-between gap-2">
                  <strong>Costo total puesto en Argentina</strong>
                  <strong className="font-mono tabular-nums">{moneda === 'USD' ? formatearUSD(esc.costo_total_puesto_pais_usd) : formatearARS(esc.costo_total_puesto_pais_ars * (1 + (sensibilidadDolar ?? 0) / 100))}</strong>
                </div>
              </div>
              {esc.costo_por_unidad_usd != null && (
                <div className="p-3 text-surface-500">
                  <div className="flex items-center justify-between gap-2">
                    <span>Costo por unidad</span>
                    <span className="font-mono tabular-nums">{moneda === 'USD' ? formatearUSD(esc.costo_por_unidad_usd) : formatearARS((esc.costo_por_unidad_ars ?? 0) * (1 + (sensibilidadDolar ?? 0) / 100))}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </details>
  );
}