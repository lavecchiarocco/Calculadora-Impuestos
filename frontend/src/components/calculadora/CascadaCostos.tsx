import { useState } from 'react';
import type { CalculoResponse, EscenarioResultado, RegimenResultado } from '@/types/api';
import { formatearARS, formatearPorcentaje, formatearUSD } from '@/utils/format';
import {
  aNumero,
  costoTotalEscenario,
  esElegible,
  nombreCorto,
  regimenInicial,
  type Moneda,
} from '@/utils/visual';

interface CascadaCostosProps {
  resultado: CalculoResponse;
  moneda: Moneda;
  escenario: 'conservador' | 'minimo';
  sensibilidadDolar: number;
}

type Categoria = 'base' | 'impuesto' | 'cargo';

interface Paso {
  clave: string;
  etiqueta: string;
  valor: number;
  categoria: Categoria;
  /** Valor estimado o a confirmar: se dibuja rayado. */
  estimado: boolean;
  aConfirmar: boolean;
  detalle?: string;
}

const COLORES: Record<Categoria, { solido: string; rayado: string; fondo: string }> = {
  base: {
    solido: 'var(--color-primary-500)',
    rayado: 'var(--color-primary-500)',
    fondo: 'var(--color-primary-100)',
  },
  impuesto: {
    solido: 'var(--color-warning-500)',
    rayado: 'var(--color-warning-500)',
    fondo: 'var(--color-warning-100)',
  },
  cargo: {
    solido: 'var(--color-surface-400)',
    rayado: 'var(--color-surface-400)',
    fondo: 'var(--color-surface-100)',
  },
};

const rayado = (color: string) =>
  `repeating-linear-gradient(135deg, ${color} 0 4px, transparent 4px 8px)`;

function escenarioActivo(
  regimen: RegimenResultado,
  escenario: 'conservador' | 'minimo',
): EscenarioResultado | null {
  const preferido = escenario === 'conservador' ? regimen.escenario_conservador : regimen.escenario_minimo;
  const alternativo = escenario === 'conservador' ? regimen.escenario_minimo : regimen.escenario_conservador;
  return preferido ?? alternativo ?? null;
}

export function CascadaCostos({ resultado, moneda, escenario, sensibilidadDolar }: CascadaCostosProps) {
  const factor = 1 + sensibilidadDolar / 100;
  const tipoCambio = aNumero(resultado.datos_entrada.tipo_cambio_ars_usd);
  const regimenes = resultado.regímenes;

  const [seleccion, setSeleccion] = useState<string | null>(null);
  const idInicial = regimenInicial(regimenes, resultado.regimen_mas_barato_elegible);
  const seleccionada = regimenes.find((r) => r.regimen_id === seleccion && esElegible(r));
  const regimen = seleccionada ?? regimenes.find((r) => r.regimen_id === idInicial) ?? regimenes[0];

  const esc = regimen ? escenarioActivo(regimen, escenario) : null;

  const fmt = (valor: number) => (moneda === 'USD' ? formatearUSD(valor) : formatearARS(valor, 0));
  const desdeUsd = (usd: number) => (moneda === 'USD' ? usd : usd * tipoCambio * factor);

  const { filas, total, escala } = (() => {
    if (!esc || !regimen) return { filas: [] as (Paso & { inicio: number })[], total: 0, escala: 0 };

    const datos = resultado.datos_entrada;
    const pasos: Paso[] = [
      { clave: 'fob', etiqueta: 'Producto (FOB)', valor: desdeUsd(aNumero(datos.precio_producto_usd)), categoria: 'base', estimado: false, aConfirmar: false },
      { clave: 'envio', etiqueta: 'Envío', valor: desdeUsd(aNumero(datos.costo_envio_usd)), categoria: 'base', estimado: false, aConfirmar: false },
      { clave: 'seguro', etiqueta: 'Seguro', valor: desdeUsd(aNumero(datos.seguro_usd)), categoria: 'base', estimado: false, aConfirmar: false },
    ];

    esc.tributos.forEach((tributo, index) => {
      if (tributo.tipo === 'informativo') return;
      const valor = moneda === 'USD' ? aNumero(tributo.monto_usd) : aNumero(tributo.monto_ars) * factor;
      pasos.push({
        clave: `tributo-${index}`,
        etiqueta: tributo.nombre,
        valor,
        categoria: tributo.tipo === 'cargo' ? 'cargo' : 'impuesto',
        estimado: tributo.a_confirmar || tributo.es_estimado_maximo,
        aConfirmar: tributo.a_confirmar,
        detalle: tributo.tipo === 'cargo' ? undefined : formatearPorcentaje(aNumero(tributo.alicuota_pct)),
      });
    });

    const visibles = pasos.filter((paso) => paso.valor > 0);
    let acumulado = 0;
    const conInicio = visibles.map((paso) => {
      const inicio = acumulado;
      acumulado += paso.valor;
      return { ...paso, inicio };
    });

    const totalBackend = costoTotalEscenario(esc, moneda, factor);
    return { filas: conInicio, total: totalBackend, escala: Math.max(totalBackend, acumulado) };
  })();

  if (!regimen) return null;

  const ddp = resultado.datos_entrada.envio_incluye_impuestos_ddp;
  const elegible = esElegible(regimen);

  return (
    <section
      className="cascada-costos bg-white border border-surface-200 rounded-xl shadow-sm p-5"
      aria-labelledby="cascada-titulo"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 id="cascada-titulo" className="font-semibold text-surface-900">
            Cómo se arma el costo
          </h3>
          <p className="mt-1 text-body-sm text-surface-600">
            Escenario {escenario === 'conservador' ? 'conservador' : 'mínimo'}, de lo que pagás por el producto al total
            puesto en el país.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Régimen a detallar">
          {regimenes.map((r) => {
            const activo = r.regimen_id === regimen.regimen_id;
            const habilitado = esElegible(r);
            return (
              <button
                key={r.regimen_id}
                type="button"
                aria-pressed={activo}
                disabled={!habilitado}
                title={habilitado ? r.regimen_nombre : 'Este régimen no es elegible con los datos cargados'}
                onClick={() => setSeleccion(r.regimen_id)}
                className={`rounded-lg border px-3 py-1.5 text-body-sm font-medium transition-colors ${
                  activo
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-surface-200 bg-white text-surface-700 hover:bg-surface-50'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {nombreCorto(r.regimen_nombre)}
              </button>
            );
          })}
        </div>
      </div>

      {ddp && (
        <p
          className="mt-3 rounded-lg border border-warning-200 bg-warning-50 p-3 text-body-sm text-warning-900"
          role="status"
        >
          Indicaste que el envío ya incluye impuestos (DDP): los tributos de abajo ya estarían pagados y no deberían
          sumarse al costo.
        </p>
      )}

      {!elegible || !esc ? (
        <div className="mt-4 text-body-sm text-danger-700">
          <p className="font-medium">Este régimen no es elegible con los datos cargados:</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {regimen.elegibilidad.motivos.map((motivo) => (
              <li key={motivo}>{motivo}</li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <ol className="mt-4 space-y-2">
            {filas.map((fila) => {
              const izquierda = escala > 0 ? (fila.inicio / escala) * 100 : 0;
              const ancho = escala > 0 ? Math.min(Math.max((fila.valor / escala) * 100, 1), 100 - izquierda) : 0;
              const color = COLORES[fila.categoria];

              return (
                <li
                  key={fila.clave}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[12rem_1fr_7.5rem]"
                >
                  <span className="min-w-0 text-body-sm text-surface-700">
                    {fila.etiqueta}
                    {fila.detalle && <span className="ml-1.5 text-caption text-surface-500">{fila.detalle}</span>}
                    {fila.aConfirmar && (
                      <span className="ml-1.5 rounded-full bg-warning-50 px-1.5 py-0.5 text-caption font-medium text-warning-700">
                        A confirmar
                      </span>
                    )}
                  </span>
                  <span className="text-right font-mono text-body-sm tabular-nums text-surface-900 sm:order-3">
                    {fmt(fila.valor)}
                  </span>
                  <div
                    className="relative col-span-2 h-3 overflow-hidden rounded-full bg-surface-100 sm:order-2 sm:col-span-1"
                    aria-hidden="true"
                  >
                    <div
                      className="absolute inset-y-0 rounded-sm"
                      style={{
                        left: `${izquierda}%`,
                        width: `${ancho}%`,
                        ...(fila.estimado
                          ? { backgroundColor: color.fondo, backgroundImage: rayado(color.rayado) }
                          : { backgroundColor: color.solido }),
                      }}
                    />
                  </div>
                </li>
              );
            })}

            <li className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 border-t border-surface-200 pt-3 sm:grid-cols-[12rem_1fr_7.5rem]">
              <span className="text-body-sm font-semibold text-surface-900">Costo total puesto en el país</span>
              <span className="text-right font-mono text-body-sm font-semibold tabular-nums text-surface-900 sm:order-3">
                {fmt(total)}
              </span>
              <div
                className="col-span-2 h-3 rounded-full bg-surface-900 sm:order-2 sm:col-span-1"
                aria-hidden="true"
              />
            </li>
          </ol>

          <div
            className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-surface-500"
            aria-hidden="true"
          >
            <Leyenda color="var(--color-primary-500)" texto="Producto y envío" />
            <Leyenda color="var(--color-warning-500)" texto="Impuestos" />
            <Leyenda color="var(--color-surface-400)" texto="Gastos operativos" />
            <Leyenda color="var(--color-warning-500)" texto="Rayado: estimado o a confirmar" rayada />
          </div>
        </>
      )}
    </section>
  );
}

function Leyenda({ color, texto, rayada = false }: { color: string; texto: string; rayada?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-4 rounded-sm"
        style={
          rayada
            ? { backgroundColor: 'var(--color-warning-100)', backgroundImage: rayado(color) }
            : { backgroundColor: color }
        }
      />
      {texto}
    </span>
  );
}