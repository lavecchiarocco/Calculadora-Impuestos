import { useMutation } from '@tanstack/react-query';
import { calcularImpuestos } from '@/api/client';
import type { FormData } from '@/schemas/formSchema';
import type { CalculoResponse, DatosEntrada } from '@/types/api';

interface UseCalcularReturn {
  calcular: (datos: FormData) => Promise<CalculoResponse>;
  resultado: CalculoResponse | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
}

function prepararDatosParaAPI(datos: FormData): DatosEntrada {
  return {
    precio_producto_usd: datos.precio_producto_usd ?? 0,
    costo_envio_usd: datos.costo_envio_usd ?? 0,
    seguro_usd: datos.seguro_usd ?? 0,
    cantidad_productos: datos.cantidad_productos ?? 0,
    max_unidades_misma_especie: datos.max_unidades_misma_especie ?? 1,
    impuestos_internos_pct: datos.impuestos_internos_pct ?? 0,
    tipo_cambio_ars_usd: datos.tipo_cambio_ars_usd ?? 0,
    envio_incluye_impuestos_ddp: datos.envio_incluye_impuestos_ddp ?? false,
    requiere_organismo_externo: datos.requiere_organismo_externo ?? false,
    algun_bulto_supera_50kg: datos.algun_bulto_supera_50kg ?? false,
    envios_usados_este_anio: datos.envios_usados_este_anio ?? 0,
    ncm: datos.ncm ?? null,
    derecho_importacion_pct: datos.derecho_importacion_pct ?? null,
  };
}

export function useCalcular(): UseCalcularReturn {
  const mutation = useMutation({
    mutationFn: (datos: FormData) => calcularImpuestos(prepararDatosParaAPI(datos)),
  });

  return {
    calcular: mutation.mutateAsync,
    resultado: mutation.data ?? null,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}