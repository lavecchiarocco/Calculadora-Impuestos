import type { CalculoResponse, RegimenResultado } from '@/types/api';
import { formatearUSD, formatearARS, formatearUSDEntero, formatearARSEntero } from '@/utils/format';

export interface ResumenCalculado {
  regimenMasBarato: RegimenResultado | undefined;
  costoTotal: number;
  costoPorUnidad: number;
  totalImpuestos: number;
  fob: number;
  envio: number;
  seguro: number;
  cif: number;
  moneda: 'USD' | 'ARS';
  costoTotalFormateado: string;
  costoPorUnidadFormateado: string;
  totalImpuestosFormateado: string;
  fobFormateado: string;
  envioFormateado: string;
  seguroFormateado: string;
  cifFormateado: string;
  regimenNombre: string | null;
}

function getRegimenMasBarato(resultado: CalculoResponse): RegimenResultado | undefined {
  const id = resultado.regimen_mas_barato_elegible;
  return resultado.regímenes.find((r) => r.regimen_id === id);
}

function formatoMoneda(valor: number, moneda: 'USD' | 'ARS'): string {
  return moneda === 'USD' ? formatearUSD(valor) : formatearARS(valor);
}

function formatoMonedaUnidad(valor: number, moneda: 'USD' | 'ARS'): string {
  return moneda === 'USD' ? formatearUSDEntero(valor) : formatearARSEntero(valor);
}

export function calcularResumen(resultado: CalculoResponse, moneda: 'USD' | 'ARS'): ResumenCalculado {
  const masBarato = getRegimenMasBarato(resultado);

  const costoTotalMoneda = masBarato?.escenario_conservador
    ? moneda === 'USD'
      ? masBarato.escenario_conservador.costo_total_puesto_pais_usd
      : masBarato.escenario_conservador.costo_total_puesto_pais_ars
    : 0;

  const costoPorUnidadMoneda = masBarato?.escenario_conservador
    ? moneda === 'USD'
      ? masBarato.escenario_conservador.costo_por_unidad_usd ?? 0
      : masBarato.escenario_conservador.costo_por_unidad_ars ?? 0
    : 0;

  const totalImpuestosMoneda = masBarato?.escenario_conservador
    ? moneda === 'USD'
      ? masBarato.escenario_conservador.total_impuestos_usd
      : masBarato.escenario_conservador.total_impuestos_ars
    : 0;

  const fobMoneda = moneda === 'USD'
    ? resultado.datos_entrada.precio_producto_usd
    : resultado.datos_entrada.precio_producto_usd * resultado.datos_entrada.tipo_cambio_ars_usd;

  const envioMoneda = moneda === 'USD'
    ? resultado.datos_entrada.costo_envio_usd
    : resultado.datos_entrada.costo_envio_usd * resultado.datos_entrada.tipo_cambio_ars_usd;

  const seguroMoneda = moneda === 'USD'
    ? resultado.datos_entrada.seguro_usd
    : resultado.datos_entrada.seguro_usd * resultado.datos_entrada.tipo_cambio_ars_usd;

  const cifMoneda = moneda === 'USD' ? resultado.cif_usd : resultado.cif_ars;

  return {
    regimenMasBarato: masBarato,
    costoTotal: costoTotalMoneda,
    costoPorUnidad: costoPorUnidadMoneda,
    totalImpuestos: totalImpuestosMoneda,
    fob: fobMoneda,
    envio: envioMoneda,
    seguro: seguroMoneda,
    cif: cifMoneda,
    moneda,
    costoTotalFormateado: formatoMoneda(costoTotalMoneda, moneda),
    costoPorUnidadFormateado: formatoMonedaUnidad(costoPorUnidadMoneda, moneda),
    totalImpuestosFormateado: formatoMoneda(totalImpuestosMoneda, moneda),
    fobFormateado: formatoMoneda(fobMoneda, moneda),
    envioFormateado: formatoMoneda(envioMoneda, moneda),
    seguroFormateado: formatoMoneda(seguroMoneda, moneda),
    cifFormateado: formatoMoneda(cifMoneda, moneda),
    regimenNombre: masBarato?.regimen_nombre ?? null,
  };
}