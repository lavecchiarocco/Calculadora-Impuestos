import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, type UseFormReturn, type UseFormWatch, type UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchema, type FormData, type FormInput } from '@/schemas/formSchema';
import { guardarFormularioEnStorage, cargarFormularioDeStorage, limpiarStorage } from '@/utils/calculos';
import type { CalculoResponse } from '@/types/api';
import { useCalcular } from './useCalcular';
import { obtenerTipoCambio } from '@/api/client';

const STORAGE_KEY = 'calculadora-state';
const DERECHO_MANUAL_MIGRATION_KEY = 'calculadora-derecho-manual-v1';

interface CalculadoraState {
  moneda: 'USD' | 'ARS';
  escenario: 'conservador' | 'minimo';
  sensibilidadDolar: number;
  resultado: CalculoResponse | null;
  cargando: boolean;
  error: string | null;
}

interface UseCalculadoraReturn extends CalculadoraState {
  form: UseFormReturn<FormInput, unknown, FormData>;
  watch: UseFormWatch<FormInput>;
  setValue: UseFormSetValue<FormInput>;
  setMoneda: (m: 'USD' | 'ARS') => void;
  setEscenario: (e: 'conservador' | 'minimo') => void;
  setSensibilidadDolar: (v: number) => void;
  ejecutarCalculo: () => Promise<void>;
  limpiarFormulario: () => void;
  cargarEjemplo: () => void;
  reset: () => void;
  cargandoDolarInicial: boolean;
}

const VALORES_DEFECTO = {
  precio_producto_usd: 0,
  costo_envio_usd: 0,
  seguro_usd: 0,
  cantidad_productos: 0,
  impuestos_internos_pct: 0,
  tipo_cambio_ars_usd: 0,
  envio_incluye_impuestos_ddp: false,
  requiere_organismo_externo: false,
  incluir_percepciones: false,
  algun_bulto_supera_50kg: false,
  envios_usados_este_anio: 0,
  ncm: '',
  derecho_importacion_pct: undefined,
  acordion_abierto: false,
};

const EJEMPLO = {
  ...VALORES_DEFECTO,
  precio_producto_usd: 2500,
  costo_envio_usd: 350,
  seguro_usd: 50,
  cantidad_productos: 10,
  ncm: '8471.30.00',
  impuestos_internos_pct: 0,
  tipo_cambio_ars_usd: 1000,
  envio_incluye_impuestos_ddp: false,
  requiere_organismo_externo: false,
  incluir_percepciones: true,
  algun_bulto_supera_50kg: false,
  envios_usados_este_anio: 2,
  acordion_abierto: true,
};

function obtenerValoresIniciales(): FormInput {
  const guardados = cargarFormularioDeStorage();
  if (!guardados) return { ...VALORES_DEFECTO };

  if (typeof window !== 'undefined' && !window.localStorage.getItem(DERECHO_MANUAL_MIGRATION_KEY)) {
    if (guardados.derecho_importacion_pct === 0) {
      guardados.derecho_importacion_pct = undefined;
      guardarFormularioEnStorage(guardados);
    }
    window.localStorage.setItem(DERECHO_MANUAL_MIGRATION_KEY, 'done');
  }

  return { ...VALORES_DEFECTO, ...guardados };
}

export function useCalculadora(): UseCalculadoraReturn {
  const [moneda, setMoneda] = useState<'USD' | 'ARS'>('ARS');
  const [escenario, setEscenario] = useState<'conservador' | 'minimo'>('conservador');
  const [sensibilidadDolar, setSensibilidadDolar] = useState(0);
  const [resultado, setResultado] = useState<CalculoResponse | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [cargandoDolarInicial, setCargandoDolarInicial] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const calcularRef = useRef<(() => Promise<void>) | null>(null);

  const form = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: obtenerValoresIniciales(),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const { calcular } = useCalcular();

  const watch = form.watch;
  const setValue = form.setValue;

  // Persistencia de estado UI (no formulario)
  useEffect(() => {
    const saved = localStorage.getItem('calculadora-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.moneda) setMoneda(parsed.moneda);
        if (parsed.escenario) setEscenario(parsed.escenario);
        if (typeof parsed.sensibilidadDolar === 'number') setSensibilidadDolar(parsed.sensibilidadDolar);
      } catch {
        // ignore corrupted storage
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('calculadora-state', JSON.stringify({
      moneda,
      escenario,
      sensibilidadDolar,
    }));
  }, [moneda, escenario, sensibilidadDolar, hydrated]);

  // Cargar tipo de cambio al montar el componente
  useEffect(() => {
    const cargarTipoCambio = async () => {
      try {
        const response = await obtenerTipoCambio();
        form.setValue('tipo_cambio_ars_usd', response.valor, { shouldValidate: true });
      } catch (err) {
        console.error('Error al obtener tipo de cambio inicial:', err);
      } finally {
        setCargandoDolarInicial(false);
      }
    };
    cargarTipoCambio();
  }, [form]);

  // Cálculo con debounce
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
      setResultado(resultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular');
    } finally {
      setCargando(false);
    }
  }, [form, calcular]);

  calcularRef.current = ejecutarCalculo;

  // Guardar en localStorage y calcular con debounce
  useEffect(() => {
    const programarCalculo = (datos: FormInput) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!formSchema.safeParse(datos).success) {
        setResultado(null);
        setError(null);
        return;
      }
      debounceRef.current = setTimeout(() => {
        calcularRef.current?.();
      }, 400);
    };

    const subscription = form.watch((data) => {
      guardarFormularioEnStorage(data);
      programarCalculo(data);
    });

    programarCalculo(form.getValues());

    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form]);

  const limpiarFormulario = useCallback(() => {
    form.reset({
      ...VALORES_DEFECTO,
    });
    limpiarStorage();
  }, [form]);

  const cargarEjemplo = useCallback(() => {
    form.reset(EJEMPLO);
  }, [form]);

  const reset = useCallback(() => {
    setMoneda('ARS');
    setEscenario('conservador');
    setSensibilidadDolar(0);
    setResultado(null);
    setError(null);
    limpiarFormulario();
    localStorage.removeItem('calculadora-state');
  }, [limpiarFormulario]);

  return {
    form,
    watch,
    setValue,
    moneda,
    escenario,
    sensibilidadDolar,
    resultado,
    cargando,
    error,
    setMoneda,
    setEscenario,
    setSensibilidadDolar,
    ejecutarCalculo,
    limpiarFormulario,
    cargarEjemplo,
    reset,
    cargandoDolarInicial,
  };
}