import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
interface Paso {
  clave: string;
  etiqueta: string;
  valor: number;
  aConfirmar: boolean;
  detalle?: string;
}

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

  const { filas, total } = (() => {
    if (!esc || !regimen) return { filas: [] as Paso[], total: 0 };

    const datos = resultado.datos_entrada;
    const pasos: Paso[] = [
      { clave: 'fob', etiqueta: 'Producto (FOB)', valor: desdeUsd(aNumero(datos.precio_producto_usd)), aConfirmar: false },
      { clave: 'envio', etiqueta: 'Envío', valor: desdeUsd(aNumero(datos.costo_envio_usd)), aConfirmar: false },
      { clave: 'seguro', etiqueta: 'Seguro', valor: desdeUsd(aNumero(datos.seguro_usd)), aConfirmar: false },
    ];

    esc.tributos.forEach((tributo, index) => {
      if (tributo.tipo === 'informativo') return;
      const valor = moneda === 'USD' ? aNumero(tributo.monto_usd) : aNumero(tributo.monto_ars) * factor;
      pasos.push({
        clave: `tributo-${index}`,
        etiqueta: tributo.nombre,
        valor,
        aConfirmar: tributo.a_confirmar,
        detalle: tributo.tipo === 'cargo' ? undefined : formatearPorcentaje(aNumero(tributo.alicuota_pct)),
      });
    });

    const visibles = pasos.filter((paso) => paso.valor > 0);
    const totalBackend = costoTotalEscenario(esc, moneda, factor);
    return { filas: visibles, total: totalBackend };
  })();

  if (!regimen) return null;

  const ddp = resultado.datos_entrada.envio_incluye_impuestos_ddp;
  const elegible = esElegible(regimen);

  return (
    <section className="cascada-costos bg-white border border-surface-200 rounded-xl shadow-sm p-5" aria-labelledby="cascada-titulo">
      <details open={window.innerWidth >= 768} className="cascada-desplegable">
        <summary className="cascada-resumen" aria-controls="cascada-contenido" onClick={(event) => { if (window.innerWidth >= 768) event.preventDefault(); }}>
          <span>
            <span id="cascada-titulo" className="cascada-titulo" role="heading" aria-level={3}>Cómo se arma el costo</span>
            <span className="cascada-resumen-ayuda">Escenario {escenario === 'conservador' ? 'conservador' : 'mínimo'}, de lo que pagás por el producto al total puesto en el país.</span>
          </span>
          <ChevronDown className="cascada-chevron" size={20} aria-hidden="true" />
        </summary>
        <div id="cascada-contenido" className="cascada-contenido">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
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
              return (
                <li
                  key={fila.clave}
                  className="flex flex-col gap-1 rounded-lg border border-surface-100 bg-surface-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
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
                  <span className="cascada-importe font-mono text-body-sm tabular-nums text-surface-900">
                    {fmt(fila.valor)}
                  </span>
                </li>
              );
            })}

            <li className="mt-2 flex flex-col gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <span className="text-body-sm font-semibold text-surface-900">Costo total puesto en el país</span>
              <span className="cascada-importe cascada-importe-total font-mono text-body-sm font-semibold tabular-nums text-surface-900">
                {fmt(total)}
              </span>
            </li>
          </ol>

        </>
      )}
        </div>
      </details>
    </section>
  );
}
