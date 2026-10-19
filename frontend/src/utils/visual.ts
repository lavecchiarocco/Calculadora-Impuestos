import type { EscenarioResultado, RegimenResultado } from '@/types/api';
import { formatearARS, formatearUSD } from '@/utils/format';

export type Moneda = 'USD' | 'ARS';

/**
 * La API puede devolver los Decimal como string; esto garantiza un número
 * antes de sumar, comparar o calcular porcentajes.
 */
export function aNumero(valor: unknown): number {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

/** "Simplificado - Pequeños envíos (Courier personal / ...)" → "Pequeños envíos". */
export function nombreCorto(nombre: string): string {
  return nombre.replace(/^Simplificado\s*-\s*/i, '').replace(/\s*\(.*\)\s*$/, '').trim() || nombre;
}

/** Un régimen es elegible salvo que el motor lo marque expresamente como no elegible. */
export function esElegible(regimen: RegimenResultado): boolean {
  return regimen.elegibilidad.elegible !== false;
}

/** Costo total puesto en el país de un escenario, en la moneda elegida y con la sensibilidad del dólar aplicada. */
export function costoTotalEscenario(
  escenario: EscenarioResultado,
  moneda: Moneda,
  factorDolar: number,
): number {
  return moneda === 'USD'
    ? aNumero(escenario.costo_total_puesto_pais_usd)
    : aNumero(escenario.costo_total_puesto_pais_ars) * factorDolar;
}

/** Monto sin decimales para etiquetas de gráficos. */
export function formatearMontoCorto(valor: number, moneda: Moneda): string {
  return moneda === 'USD' ? formatearUSD(valor, 0) : formatearARS(valor, 0);
}

/** Regimen preseleccionado: el más barato elegible; si no hay, el primero elegible; si no, el primero. */
export function regimenInicial(
  regimenes: RegimenResultado[],
  masBaratoId?: string | null,
): string | undefined {
  if (masBaratoId && regimenes.some((r) => r.regimen_id === masBaratoId)) return masBaratoId;
  return (regimenes.find(esElegible) ?? regimenes[0])?.regimen_id;
}