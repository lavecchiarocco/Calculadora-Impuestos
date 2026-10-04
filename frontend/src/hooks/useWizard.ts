import { useCallback, useEffect, useState } from 'react';
import type { CalculoResponse } from '@/types/api';
import type { UseFormReturn } from 'react-hook-form';
import type { FormInput, FormData } from '@/schemas/formSchema';

const STORAGE_KEY = 'wizard-state';

interface WizardState {
  currentStep: 1 | 2 | 3 | 4;
  completedSteps: Set<number>;
  moneda: 'USD' | 'ARS';
  sensibilidadDolar: number;
  resultado: CalculoResponse | null;
}

const STEP_NAMES = [
  'Cotización',
  'Envío y bultos',
  'Producto e impuestos',
  'Comparativa final',
] as const;

const STEP_FIELDS: Record<number, (keyof FormInput)[]> = {
  1: ['precio_producto_usd', 'costo_envio_usd', 'seguro_usd', 'modo_transporte'],
  2: ['bultos', 'cantidad_unidades'],
  3: ['cantidad_unidades', 'impuestos_internos_pct', 'tipo_cambio_ars_usd'],
  4: [],
};

export interface UseWizardReturn extends WizardState {
  goToStep: (step: number) => void;
  nextStep: (form: UseFormReturn<FormInput, unknown, FormData>) => Promise<void>;
  prevStep: () => void;
  resetWizard: () => void;
  setMoneda: (m: 'USD' | 'ARS') => void;
  setSensibilidadDolar: (v: number) => void;
  setResultado: (r: CalculoResponse | null) => void;
  stepNames: readonly string[];
  stepFields: Record<number, (keyof FormInput)[]>;
  canGoToStep: (step: number) => boolean;
}

export function useWizard(): UseWizardReturn {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set([1]));
  const [moneda, setMoneda] = useState<'USD' | 'ARS'>('ARS');
  const [sensibilidadDolar, setSensibilidadDolar] = useState(0);
  const [resultado, setResultado] = useState<CalculoResponse | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        if (parsed.completedSteps) setCompletedSteps(new Set(parsed.completedSteps));
        if (parsed.moneda) setMoneda(parsed.moneda);
        if (typeof parsed.sensibilidadDolar === 'number') setSensibilidadDolar(parsed.sensibilidadDolar);
      } catch {
        // ignore corrupted storage
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentStep,
      completedSteps: Array.from(completedSteps),
      moneda,
      sensibilidadDolar,
    }));
  }, [currentStep, completedSteps, moneda, sensibilidadDolar, hydrated]);

  const goToStep = useCallback((step: number) => {
    if (step < 1 || step > 4) return;
    if (step > currentStep && !completedSteps.has(step - 1)) return;
    setCurrentStep(step as 1 | 2 | 3 | 4);
  }, [currentStep, completedSteps]);

  const nextStep = useCallback(async (form: UseFormReturn<FormInput, unknown, FormData>) => {
    const fields = STEP_FIELDS[currentStep];
    if (fields.length > 0) {
      const isValid = await form.trigger(fields as any);
      if (!isValid) return;
    }
    if (currentStep < 4) {
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      setCurrentStep((currentStep + 1) as 1 | 2 | 3 | 4);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4);
    }
  }, [currentStep]);

  const resetWizard = useCallback(() => {
    setCurrentStep(1);
    setCompletedSteps(new Set([1]));
    setMoneda('ARS');
    setResultado(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const canGoToStep = useCallback((step: number) => {
    if (step < 1 || step > 4) return false;
    if (step <= currentStep) return true;
    return completedSteps.has(step - 1);
  }, [currentStep, completedSteps]);

  return {
    currentStep,
    completedSteps,
    moneda,
    sensibilidadDolar,
    resultado,
    goToStep,
    nextStep,
    prevStep,
    resetWizard,
    setMoneda,
    setSensibilidadDolar,
    setResultado,
    stepNames: STEP_NAMES,
    stepFields: STEP_FIELDS,
    canGoToStep,
  };
}