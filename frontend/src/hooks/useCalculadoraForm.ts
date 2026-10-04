import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, type UseFormReturn, type UseFormWatch, type UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema, type FormData, type FormInput } from '@/schemas/formSchema';
import { calcularPesoVolumetrico, calcularPesoFacturable, calcularVolumenM3, guardarFormularioEnStorage, cargarFormularioDeStorage, limpiarStorage } from '@/utils/calculos';
import type { CalculoResponse } from '@/types/api';
import { useCalcular } from './useCalcular';

interface UseCalculadoraFormReturn {
  form: UseFormReturn<FormInput, unknown, FormData>;
  watch: UseFormWatch<FormInput>;
  setValue: UseFormSetValue<FormInput>;
  pesoVolumetrico: number;
  pesoRealTotal: number;
  pesoFacturable: number;
  volumenM3: number;
  usdPorKg: number;
  cargando: boolean;
  error: string | null;
  ejecutarCalculo: () => Promise<void>;
  limpiarFormulario: () => void;
  cargarEjemplo: () => void;
}

const BULTOS_INICIALES = [
  { largo_cm: 50, ancho_cm: 40, alto_cm: 30, peso_kg: 10 },
];

const VALORES_DEFECTO = {
  precio_producto_usd: 1000,
  costo_envio_usd: 200,
  seguro_usd: 0,
  modo_transporte: 'aereo' as const,
  cantidad_unidades: 1,
  impuestos_internos_pct: 0,
  tipo_cambio_ars_usd: 1000,
  envio_incluye_impuestos_ddp: false,
  requiere_organismo_externo: false,
  incluir_percepciones: false,
  envios_usados_este_anio: 0,
};

const EJEMPLO = {
  ...VALORES_DEFECTO,
  bultos: [
    { largo_cm: 50, ancho_cm: 40, alto_cm: 30, peso_kg: 10 },
    { largo_cm: 40, ancho_cm: 30, alto_cm: 20, peso_kg: 5 },
  ],
  precio_producto_usd: 2500,
  costo_envio_usd: 350,
  seguro_usd: 50,
  cantidad_unidades: 10,
  incluir_percepciones: true,
  envios_usados_este_anio: 2,
};

export function useCalculadoraForm(onCalcular: (resultado: CalculoResponse) => void): UseCalculadoraFormReturn {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const calcularRef = useRef<(() => Promise<void>) | null>(null);

  const form = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: cargarFormularioDeStorage() || {
      ...VALORES_DEFECTO,
      bultos: [...BULTOS_INICIALES],
    },
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const { calcular } = useCalcular();

  const watch = form.watch;
  const setValue = form.setValue;

  const bultos = watch('bultos') || [];
  const modoTransporte = watch('modo_transporte');
  const costoEnvio = watch('costo_envio_usd') || 0;

  const pesoRealTotal = bultos.reduce((sum, b) => sum + (b?.peso_kg || 0), 0);
  const pesoVolumetrico = modoTransporte === 'aereo' ? calcularPesoVolumetrico(bultos) : 0;
  const pesoFacturable = calcularPesoFacturable(pesoRealTotal, pesoVolumetrico);
  const volumenM3 = calcularVolumenM3(bultos);
  const usdPorKg = modoTransporte === 'aereo' && pesoFacturable > 0 ? costoEnvio / pesoFacturable : 0;

  const ejecutarCalculo = useCallback(async () => {
    const validacion = formSchema.safeParse(form.getValues());
    if (!validacion.success) {
      await form.trigger();
      setError('Revisá los campos marcados antes de calcular.');
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const resultado = await calcular(validacion.data);
      onCalcular(resultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular');
    } finally {
      setCargando(false);
    }
  }, [form, calcular, onCalcular]);

  calcularRef.current = ejecutarCalculo;

  useEffect(() => {
    const programarCalculo = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        calcularRef.current?.();
      }, 400);
    };

    const subscription = form.watch((data) => {
      guardarFormularioEnStorage(data);
      programarCalculo();
    });

    programarCalculo();

    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form]);

  const limpiarFormulario = useCallback(() => {
    form.reset({
      ...VALORES_DEFECTO,
      bultos: [...BULTOS_INICIALES],
    });
    limpiarStorage();
  }, [form]);

  const cargarEjemplo = useCallback(() => {
    form.reset(EJEMPLO);
  }, [form]);

  return {
    form,
    watch,
    setValue,
    pesoVolumetrico,
    pesoRealTotal,
    pesoFacturable,
    volumenM3,
    usdPorKg,
    cargando,
    error,
    ejecutarCalculo,
    limpiarFormulario,
    cargarEjemplo,
  };
}