import { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import type { CalculoResponse } from '@/types/api';
import {
  costoTotalEscenario,
  esElegible,
  formatearMontoCorto,
  nombreCorto,
  type Moneda,
} from '@/utils/visual';

interface ComparadorRegimenesProps {
  resultado: CalculoResponse;
  moneda: Moneda;
  sensibilidadDolar: number;
}

interface Fila {
  id: string;
  nombre: string;
  elegible: boolean;
  motivos: string[];
  /** Costo con el escenario mínimo (alícuotas más bajas). */
  minimo: number;
  /** Costo con el escenario conservador (alícuotas más altas). */
  maximo: number;
  esMasBarato: boolean;
}

export function ComparadorRegimenes({ resultado, moneda, sensibilidadDolar }: ComparadorRegimenesProps) {
  const factor = 1 + sensibilidadDolar / 100;
  const masBaratoId = resultado.regimen_mas_barato_elegible;

  const filas = useMemo<Fila[]>(
    () =>
      resultado.regímenes.map((regimen) => {
        const conservador = regimen.escenario_conservador ?? regimen.escenario_minimo;
        const minimo = regimen.escenario_minimo ?? conservador;
        const costoMax = conservador ? costoTotalEscenario(conservador, moneda, factor) : 0;
        const costoMin = minimo ? costoTotalEscenario(minimo, moneda, factor) : 0;

        return {
          id: regimen.regimen_id,
          nombre: regimen.regimen_nombre,
          elegible: esElegible(regimen),
          motivos: regimen.elegibilidad.motivos,
          minimo: Math.min(costoMin, costoMax),
          maximo: Math.max(costoMin, costoMax),
          esMasBarato: regimen.regimen_id === masBaratoId,
        };
      }),
    [resultado.regímenes, moneda, factor, masBaratoId],
  );

  const elegibles = filas.filter((f) => f.elegible);

  // Ahorro del más barato frente a la siguiente mejor opción elegible (escenario conservador).
  const ganador = filas.find((f) => f.esMasBarato);
  const siguiente = elegibles
    .filter((f) => !f.esMasBarato)
    .sort((a, b) => a.maximo - b.maximo)[0];
  const ahorro = ganador && siguiente ? siguiente.maximo - ganador.maximo : 0;

  const avisos = resultado.advertencias_globales ?? [];

  return (
    <section className="comparador-regimenes bg-white border border-surface-200 rounded-xl shadow-sm p-5" aria-labelledby="comparador-titulo">
      <details open={window.innerWidth >= 768} className="comparador-desplegable">
        <summary className="comparador-resumen" onClick={(event) => { if (window.innerWidth >= 768) event.preventDefault(); }}>
          <span className="comparador-resumen-texto">
            <span id="comparador-titulo" className="comparador-titulo" role="heading" aria-level={3}>
              Costo total por régimen
            </span>
            <span className="comparador-resumen-ayuda">
              {ganador && ahorro > 0.5 && siguiente ? (
                <>
                  <strong className="text-surface-900">{nombreCorto(ganador.nombre)}</strong> es la opción más barata:
                  ahorrás hasta <strong className="text-surface-900">{formatearMontoCorto(ahorro, moneda)}</strong>.
                </>
              ) : 'Compará el costo estimado de cada régimen.'}
            </span>
          </span>
          <ChevronDown className="comparador-chevron" size={20} aria-hidden="true" />
        </summary>
        <div className="comparador-contenido">

      {avisos.length > 0 && (
        <ul
          className="mt-3 space-y-1 rounded-lg border border-warning-200 bg-warning-50 p-3 text-body-sm text-warning-900"
          role="status"
        >
          {avisos.map((aviso) => (
            <li key={aviso}>{aviso}</li>
          ))}
        </ul>
      )}

      <ul className="mt-3 space-y-2">
        {filas.map((fila) => {
          const hayRango = fila.maximo - fila.minimo >= 0.5;

          return (
            <li key={fila.id} className={`comparador-regimen-fila ${fila.elegible ? '' : 'no-elegible'} ${fila.esMasBarato ? 'mas-barato' : ''}`}>
              {!fila.elegible && <span className="comparador-regimen-cinta">No elegible</span>}
              <div className="comparador-regimen-encabezado">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="font-medium text-surface-900">{fila.nombre}</span>
                  {fila.esMasBarato && (
                    <span className="rounded-full bg-success-50 px-2 py-0.5 text-caption font-medium text-success-700">
                      Más barato
                    </span>
                  )}
                </div>
                {fila.elegible && (
                  <span className="comparador-regimen-costo font-mono text-body-sm tabular-nums text-surface-900">
                    {hayRango
                      ? `${formatearMontoCorto(fila.minimo, moneda)} – ${formatearMontoCorto(fila.maximo, moneda)}`
                      : formatearMontoCorto(fila.maximo, moneda)}
                  </span>
                )}
              </div>

              {!fila.elegible && (
                <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-body-sm text-danger-700">
                  {fila.motivos.map((motivo) => (
                    <li key={motivo}>{motivo}</li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

        </div>
      </details>
    </section>
  );
}
