import { useMutation } from '@tanstack/react-query';
import { calcularImpuestos } from '@/api/client';
import type { FormData } from '@/schemas/formSchema';
import type { CalculoResponse } from '@/types/api';

interface UseCalcularReturn {
  calcular: (datos: FormData) => Promise<CalculoResponse>;
  resultado: CalculoResponse | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  reset: () => void;
}

export function useCalcular(): UseCalcularReturn {
  const mutation = useMutation({
    mutationFn: (datos: FormData) => calcularImpuestos(datos),
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