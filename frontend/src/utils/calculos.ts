export function formatearNumeroAR(numero: number, decimales = 2): string {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
    useGrouping: true,
  }).format(numero);
}

export function formatearUSD(numero: number, decimales = 2): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(numero);
}

export function formatearARS(numero: number, decimales = 2): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(numero);
}

export function formatearPorcentaje(numero: number, decimales = 2): string {
  return `${formatearNumeroAR(numero, decimales)}%`;
}

export function parsearNumeroAR(valor: string): number | undefined {
  const normalizado = valor.trim();
  if (!normalizado) return undefined;

  const limpio = normalizado.includes(',')
    ? normalizado.replace(/\./g, '').replace(',', '.')
    : normalizado;
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : undefined;
}

export function formatearInputNumero(numero: number | null | undefined, decimales = 2): string {
  if (numero === null || numero === undefined) return '';
  return formatearNumeroAR(numero, decimales);
}

export function redondear(valor: number, decimales = 2): number {
  const factor = Math.pow(10, decimales);
  return Math.round(valor * factor) / factor;
}

export function calcularSensibilidadDolar(
  costoARS: number,
  tipoCambioBase: number,
  variacionPct: number
): number {
  const nuevoTipoCambio = tipoCambioBase * (1 + variacionPct / 100);
  const costoUSD = costoARS / tipoCambioBase;
  return costoUSD * nuevoTipoCambio;
}

export const STORAGE_KEY = 'calculadora-impuestos-form';

export function guardarFormularioEnStorage(datos: any): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
  } catch {
    // Silenciar error si no hay localStorage
  }
}

export function cargarFormularioDeStorage(): any | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function limpiarStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silenciar
  }
}
