export function formatearUSD(valor: number, decimales = 2): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);
}

export function formatearARS(valor: number, decimales = 2): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);
}

export function formatearNumero(valor: number, decimales = 2): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valor);
}

export function formatearPorcentaje(valor: number, decimales = 2): string {
  return `${formatearNumero(valor, decimales)}%`;
}

export function redondear(valor: number, decimales = 2): number {
  const factor = Math.pow(10, decimales);
  return Math.round(valor * factor) / factor;
}

export function calcularSensibilidadDolar(
  costoBaseARS: number,
  tipoCambioBase: number,
  variacionPct: number
): number {
  const nuevoTipoCambio = tipoCambioBase * (1 + variacionPct / 100);
  const costoUSD = costoBaseARS / tipoCambioBase;
  return costoUSD * nuevoTipoCambio;
}