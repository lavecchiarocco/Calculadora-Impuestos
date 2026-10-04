import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Award,
  TrendingDown,
  Shield,
} from 'lucide-react';
import type { CalculoResponse, RegimenResultado, EscenarioResultado, TributoDetalle } from '@/types/api';
import { formatearUSD, formatearARS, formatearNumero, formatearPorcentaje } from '@/utils/format';
import { Alert, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';

type Elegible = boolean | null | undefined;

/* ---------- Elegibilidad ---------- */

function claseElegibilidad(elegible: Elegible): string {
  if (elegible === true) return 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300';
  if (elegible === false) return 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300';
  return 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300';
}

function textoElegibilidad(elegible: Elegible): string {
  if (elegible === true) return 'Elegible';
  if (elegible === false) return 'No elegible';
  return 'Elegible con advertencias';
}

function IconoElegibilidad({ elegible }: { elegible: Elegible }) {
  if (elegible === true) return <CheckCircle size={16} aria-hidden="true" />;
  if (elegible === false) return <XCircle size={16} aria-hidden="true" />;
  return <AlertTriangle size={16} aria-hidden="true" />;
}

function InsigniaElegibilidad({ elegible }: { elegible: Elegible }) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-caption font-medium ${claseElegibilidad(elegible)}`}
    >
      <IconoElegibilidad elegible={elegible} />
      {textoElegibilidad(elegible)}
    </span>
  );
}

/* ---------- Tributos y escenarios ---------- */

function TributoRow({ tributo }: { tributo: TributoDetalle }) {
  const esMaximo = tributo.es_estimado_maximo;
  const { rango_min_pct: min, rango_max_pct: max } = tributo;
  const tieneRango = min != null && max != null && min !== max;

  return (
    <TableRow className={esMaximo ? 'bg-warning-50 dark:bg-warning-900/20' : ''}>
      <TableCell>
        <div className="tributo-nombre flex items-center gap-2 flex-wrap">
          {tributo.nombre}
          {tributo.a_confirmar && (
            <span className="badge-warning ml-1" title="Parámetro a confirmar">[!]</span>
          )}
          {esMaximo && (
            <span className="badge-warning ml-1" title="Estimado con el valor máximo del rango">MAX</span>
          )}
        </div>
        {tieneRango && (
          <div className="tributo-rango text-caption text-surface-500 dark:text-surface-400 mt-1">
            {/* Verificar unidades: acá el rango se multiplica por 100 y la alícuota no */}
            Rango: {formatearPorcentaje(min * 100)} - {formatearPorcentaje(max * 100)}
          </div>
        )}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums">{formatearUSD(tributo.base_usd)}</TableCell>
      <TableCell className="text-right font-mono tabular-nums">{formatearPorcentaje(tributo.alicuota_pct)}</TableCell>
      <TableCell className="text-right font-mono tabular-nums">{formatearUSD(tributo.monto_usd)}</TableCell>
      <TableCell className="text-right font-mono tabular-nums">{formatearARS(tributo.monto_ars)}</TableCell>
    </TableRow>
  );
}

interface EscenarioPanelProps {
  titulo: string;
  escenario: EscenarioResultado | null | undefined;
  regimenId: string;
  esConservador: boolean;
}

function EscenarioPanel({ titulo, escenario, regimenId, esConservador }: EscenarioPanelProps) {
  const [expandido, setExpandido] = useState(true);

  if (!escenario) return null;

  return (
    <div className="border border-surface-200 dark:border-surface-700 rounded-radius-md overflow-hidden">
      <button
        type="button"
        className="escenario-header w-full flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800/50 border-none text-left"
        onClick={() => setExpandido(!expandido)}
        aria-expanded={expandido}
      >
        <div className="escenario-titulo flex items-center gap-3 flex-wrap">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-caption font-medium ${
              esConservador
                ? 'bg-danger-50 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300'
                : 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300'
            }`}
          >
            {titulo}
          </span>
          <span className="font-mono tabular-nums font-medium">
            {formatearUSD(escenario.costo_total_puesto_pais_usd)} / {formatearARS(escenario.costo_total_puesto_pais_ars)}
          </span>
        </div>
        <span className="expand-icon">{expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </button>

      {expandido && (
        <div className="escenario-content p-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tributo</TableHead>
                <TableHead className="text-right">Base USD</TableHead>
                <TableHead className="text-right">Alícuota</TableHead>
                <TableHead className="text-right">Monto USD</TableHead>
                <TableHead className="text-right">Monto ARS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {escenario.tributos.map((t: TributoDetalle, i: number) => (
                <TributoRow key={`${regimenId}-${esConservador ? 'c' : 'm'}-${i}`} tributo={t} />
              ))}

              <TableRow className="bg-surface-50 dark:bg-surface-800/50">
                <TableCell><strong>Total impuestos</strong></TableCell>
                <TableCell />
                <TableCell className="text-right">
                  <strong>{formatearPorcentaje(escenario.pct_sobre_cif)} sobre CIF</strong>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  <strong>{formatearUSD(escenario.total_impuestos_usd)}</strong>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  <strong>{formatearARS(escenario.total_impuestos_ars)}</strong>
                </TableCell>
              </TableRow>

              <TableRow className="bg-surface-50 dark:bg-surface-800/50">
                <TableCell><strong>Costo total puesto en Argentina</strong></TableCell>
                <TableCell />
                <TableCell />
                <TableCell className="text-right font-mono tabular-nums">
                  <strong>{formatearUSD(escenario.costo_total_puesto_pais_usd)}</strong>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  <strong>{formatearARS(escenario.costo_total_puesto_pais_ars)}</strong>
                </TableCell>
              </TableRow>

              {escenario.costo_por_unidad_usd != null && (
                <TableRow className="text-surface-500 dark:text-surface-400">
                  <TableCell>Costo por unidad</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatearUSD(escenario.costo_por_unidad_usd)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatearARS(escenario.costo_por_unidad_ars ?? 0)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

/* ---------- Tarjeta de régimen ---------- */

interface RegimenCardProps {
  regimen: RegimenResultado;
  esMasBarato: boolean;
  sensibilidadDolar: number;
}

function RegimenCard({ regimen, esMasBarato, sensibilidadDolar }: RegimenCardProps) {
  const { elegibilidad, escenario_conservador: conservador, escenario_minimo: minimo } = regimen;
  const elegible: Elegible = elegibilidad?.elegible;
  const noElegible = elegible === false;

  const factorDolar = 1 + sensibilidadDolar / 100;
  const arsConservadorSensible = conservador ? conservador.costo_total_puesto_pais_ars * factorDolar : 0;
  const arsMinimoSensible = minimo ? minimo.costo_total_puesto_pais_ars * factorDolar : 0;

  return (
    <div
      className={`card ${esMasBarato ? 'ring-2 ring-success-500' : ''} ${
        noElegible ? 'opacity-70 ring-2 ring-danger-500' : ''
      }`}
    >
      <div className="card-header flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-surface-900 dark:text-surface-100">{regimen.regimen_nombre}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            <InsigniaElegibilidad elegible={elegible} />
            {esMasBarato && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-caption font-medium bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300">
                <Award size={14} aria-hidden="true" /> Más barato
              </span>
            )}
            {regimen.a_confirmar && (
              <span
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300"
                title="Parámetros a confirmar"
              >
                [!] A confirmar
              </span>
            )}
          </div>
        </div>

        {conservador && (
          <div className="flex flex-wrap gap-6 ml-4">
            <div className="flex flex-col">
              <span className="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide">Conservador</span>
              <span className="font-semibold font-mono tabular-nums text-surface-900 dark:text-surface-100">
                {formatearUSD(conservador.costo_total_puesto_pais_usd)}
              </span>
            </div>
            {minimo && (
              <div className="flex flex-col">
                <span className="text-xs text-surface-500 dark:text-surface-400 uppercase tracking-wide">Mínimo</span>
                <span className="font-semibold font-mono tabular-nums text-surface-900 dark:text-surface-100">
                  {formatearUSD(minimo.costo_total_puesto_pais_usd)}
                </span>
              </div>
            )}
            {sensibilidadDolar !== 0 && (
              <div className="flex flex-col">
                <span className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                  Si el dólar {sensibilidadDolar > 0 ? 'sube' : 'baja'} {Math.abs(sensibilidadDolar)}%
                </span>
                <span className="font-semibold font-mono tabular-nums text-purple-600 dark:text-purple-400">
                  {formatearARS(arsConservadorSensible)} / {formatearARS(arsMinimoSensible)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 mt-4">
        <EscenarioPanel
          titulo="Escenario conservador (máximos)"
          escenario={conservador}
          regimenId={regimen.regimen_id}
          esConservador={true}
        />
        <EscenarioPanel
          titulo="Escenario mínimo (mínimos)"
          escenario={minimo}
          regimenId={regimen.regimen_id}
          esConservador={false}
        />
      </div>

      {regimen.advertencias_generales && regimen.advertencias_generales.length > 0 && (
        <div className="mt-4">
          <details className="border border-surface-200 dark:border-surface-700 rounded-radius-md overflow-hidden">
            <summary className="px-4 py-3 font-medium text-surface-600 dark:text-surface-400 cursor-pointer">
              Advertencias generales ({regimen.advertencias_generales.length})
            </summary>
            <ul className="px-4 py-3 space-y-1 text-body-sm text-surface-600 dark:text-surface-400">
              {regimen.advertencias_generales.map((a: string, i: number) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}

/* ---------- Resumen comparativo ---------- */

function ResumenComparativo({ resultado }: { resultado: CalculoResponse }) {
  const elegibles = resultado.regímenes.filter((r: RegimenResultado) => r.elegibilidad?.elegible !== false);
  const masBarato = resultado.regimen_mas_barato_elegible;

  if (elegibles.length === 0) return null;

  const nombreMasBarato = resultado.regímenes.find(
    (r: RegimenResultado) => r.regimen_id === masBarato,
  )?.regimen_nombre;

  return (
    <div className="card animate-in">
      <div className="card-header">
        <h3 className="flex items-center gap-2">
          <TrendingDown size={20} aria-hidden="true" /> Comparativa rápida
        </h3>
      </div>
      <div className="card-body p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Régimen</TableHead>
              <TableHead className="text-right">Conservador (USD)</TableHead>
              <TableHead className="text-right">Mínimo (USD)</TableHead>
              <TableHead className="text-right">% sobre CIF</TableHead>
              <TableHead>Elegibilidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultado.regímenes.map((r: RegimenResultado) => {
              const cons = r.escenario_conservador;
              const min = r.escenario_minimo;
              const esMasBarato = r.regimen_id === masBarato;
              return (
                <TableRow key={r.regimen_id} className={esMasBarato ? 'bg-success-50 dark:bg-success-900/20' : ''}>
                  <TableCell>
                    <strong>{r.regimen_nombre}</strong>
                    {esMasBarato && <Award className="award-icon h-4 w-4 ml-2 text-warning-500 inline" aria-label="Más barato" />}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {cons ? formatearUSD(cons.costo_total_puesto_pais_usd) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {min ? formatearUSD(min.costo_total_puesto_pais_usd) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {cons ? formatearPorcentaje(cons.pct_sobre_cif) : '—'}
                    {min && (
                      <span className="block text-caption text-surface-500 dark:text-surface-400">
                        mín. {formatearPorcentaje(min.pct_sobre_cif)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <InsigniaElegibilidad elegible={r.elegibilidad?.elegible} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {masBarato && nombreMasBarato && (
          <div className="card-footer p-4 bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-800">
            <div className="flex items-center gap-2 text-success-700 dark:text-success-300">
              <Shield size={20} aria-hidden="true" />
              <span>
                Recomendación: <strong>{nombreMasBarato}</strong> es el más económico entre los elegibles.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Bloques auxiliares ---------- */

function AdvertenciasGlobales({ advertencias }: { advertencias: string[] }) {
  if (advertencias.length === 0) return null;

  return (
    <div className="space-y-2">
      {advertencias.map((a, i) => (
        <Alert key={i} variant="warning" className="animate-in">
          {a}
        </Alert>
      ))}
    </div>
  );
}

function DatoGeneral({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="p-4 bg-surface-50 border border-surface-200 rounded-radius-md dark:bg-surface-800/50 dark:border-surface-700">
      <div className="flex items-center gap-2 text-caption text-surface-500 dark:text-surface-400 mb-1">{etiqueta}</div>
      <div className="text-h4 font-semibold tabular text-surface-900 dark:text-surface-100">{valor}</div>
    </div>
  );
}

function InfoGeneral({ resultado }: { resultado: CalculoResponse }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 animate-in">
      <DatoGeneral etiqueta="CIF" valor={`${formatearUSD(resultado.cif_usd)} / ${formatearARS(resultado.cif_ars)}`} />
      <DatoGeneral etiqueta="Peso facturable" valor={`${formatearNumero(resultado.peso_facturable_kg, 2)} kg`} />
      {resultado.peso_volumetrico_kg != null && (
        <DatoGeneral etiqueta="Peso volumétrico" valor={`${formatearNumero(resultado.peso_volumetrico_kg, 2)} kg`} />
      )}
      {resultado.volumen_m3 != null && (
        <DatoGeneral etiqueta="Volumen" valor={`${formatearNumero(resultado.volumen_m3, 4)} m³`} />
      )}
      {resultado.usd_por_kg_flete != null && (
        <DatoGeneral etiqueta="USD/kg flete" valor={`${formatearNumero(resultado.usd_por_kg_flete, 4)} USD/kg`} />
      )}
    </div>
  );
}

function Leyenda() {
  const texto = 'text-body-sm text-surface-600 dark:text-surface-400';
  return (
    <div className="card animate-in bg-surface-50 border-surface-200 dark:bg-surface-800/50 dark:border-surface-700">
      <div className="card-header">
        <h4 className="font-semibold text-surface-900 dark:text-surface-100">Leyenda</h4>
      </div>
      <div className="card-body">
        <ul className="space-y-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <li className="flex items-start gap-2">
            <span className="badge-warning flex-shrink-0">MAX</span>
            <span className={texto}>= Estimado con el valor máximo del rango (estimación conservadora)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="badge-warning flex-shrink-0">[!]</span>
            <span className={texto}>= Parámetro a confirmar con fuente oficial</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="badge-danger flex-shrink-0">Conservador</span>
            <span className={texto}>= Todas las alícuotas en su valor máximo</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="badge-success flex-shrink-0">Mínimo</span>
            <span className={texto}>= Todas las alícuotas en su valor mínimo</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 text-center">•</span>
            <span className={texto}>
              El costo final destacado es el <strong>escenario conservador</strong> (más seguro para presupuestar)
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

/* ---------- Componente principal ---------- */

interface ResultadosProps {
  resultado: CalculoResponse | null;
  sensibilidadDolar: number;
}

export function Resultados({ resultado, sensibilidadDolar }: ResultadosProps) {
  if (!resultado) return null;

  return (
    <div className="resultados space-y-6 animate-in">
      <AdvertenciasGlobales advertencias={resultado.advertencias_globales ?? []} />

      <InfoGeneral resultado={resultado} />

      <ResumenComparativo resultado={resultado} />

      <div className="space-y-4">
        {resultado.regímenes.map((regimen: RegimenResultado) => (
          <RegimenCard
            key={regimen.regimen_id}
            regimen={regimen}
            esMasBarato={regimen.regimen_id === resultado.regimen_mas_barato_elegible}
            sensibilidadDolar={sensibilidadDolar}
          />
        ))}
      </div>

      <Leyenda />
    </div>
  );
}