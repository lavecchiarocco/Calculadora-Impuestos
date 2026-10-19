import { useMemo } from 'react';
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

const rayado = (color: string) =>
  `repeating-linear-gradient(135deg, ${color} 0 4px, transparent 4px 8px)`;

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
  const escala = Math.max(...elegibles.map((f) => f.maximo), 0);

  // Ahorro del más barato frente a la siguiente mejor opción elegible (escenario conservador).
  const ganador = filas.find((f) => f.esMasBarato);
  const siguiente = elegibles
    .filter((f) => !f.esMasBarato)
    .sort((a, b) => a.maximo - b.maximo)[0];
  const ahorro = ganador && siguiente ? siguiente.maximo - ganador.maximo : 0;

  const avisos = resultado.advertencias_globales ?? [];

  return (
    <section
      className="comparador-regimenes bg-white border border-surface-200 rounded-xl shadow-sm p-5"
      aria-labelledby="comparador-titulo"
    >
      <h3 id="comparador-titulo" className="font-semibold text-surface-900">
        Costo total por régimen
      </h3>
      <p className="mt-1 text-body-sm text-surface-600">
        {ganador && ahorro > 0.5 && siguiente ? (
          <>
            <strong className="text-surface-900">{nombreCorto(ganador.nombre)}</strong> es la opción más barata:
            ahorrás hasta{' '}
            <strong className="text-surface-900">{formatearMontoCorto(ahorro, moneda)}</strong> frente a{' '}
            {nombreCorto(siguiente.nombre)} (escenario conservador).
          </>
        ) : (
          'Cada barra va desde el escenario mínimo hasta el conservador.'
        )}
      </p>

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

      <ul className="mt-3">
        {filas.map((fila, index) => {
          const pctMin = escala > 0 ? (fila.minimo / escala) * 100 : 0;
          const pctRango = escala > 0 ? ((fila.maximo - fila.minimo) / escala) * 100 : 0;
          const hayRango = fila.maximo - fila.minimo >= 0.5;
          const colorSolido = fila.esMasBarato ? 'bg-success-500' : 'bg-primary-500';
          const colorRayado = fila.esMasBarato ? 'var(--color-success-400)' : 'var(--color-primary-300)';

          return (
            <li key={fila.id} className={`py-3 ${index > 0 ? 'border-t border-surface-100' : ''}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="font-medium text-surface-900">{fila.nombre}</span>
                  {fila.esMasBarato && (
                    <span className="rounded-full bg-success-50 px-2 py-0.5 text-caption font-medium text-success-700">
                      Más barato
                    </span>
                  )}
                  {!fila.elegible && (
                    <span className="rounded-full bg-danger-50 px-2 py-0.5 text-caption font-medium text-danger-700">
                      No elegible
                    </span>
                  )}
                </div>
                {fila.elegible && (
                  <span className="font-mono text-body-sm tabular-nums text-surface-900">
                    {hayRango
                      ? `${formatearMontoCorto(fila.minimo, moneda)} – ${formatearMontoCorto(fila.maximo, moneda)}`
                      : formatearMontoCorto(fila.maximo, moneda)}
                  </span>
                )}
              </div>

              {fila.elegible ? (
                <div
                  className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-surface-100"
                  aria-hidden="true"
                >
                  <div
                    className={`absolute inset-y-0 left-0 ${colorSolido}`}
                    style={{ width: `${pctMin}%` }}
                  />
                  <div
                    className="absolute inset-y-0"
                    style={{
                      left: `${pctMin}%`,
                      width: `${pctRango}%`,
                      backgroundImage: rayado(colorRayado),
                    }}
                  />
                </div>
              ) : (
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

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-surface-500" aria-hidden="true">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-4 rounded-sm bg-primary-500" />
          Escenario mínimo
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-4 rounded-sm"
            style={{ backgroundImage: rayado('var(--color-primary-300)'), backgroundColor: 'var(--color-surface-100)' }}
          />
          Hasta el escenario conservador
        </span>
      </div>
    </section>
  );
}