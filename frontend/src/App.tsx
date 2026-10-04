import { useState, useCallback } from 'react';
import { useWizard } from '@/hooks/useWizard';
import type { UseFormReturn } from 'react-hook-form';
import type { FormInput, FormData } from '@/schemas/formSchema';
import { useCalculadoraForm } from '@/hooks/useCalculadoraForm';
import { obtenerTipoCambio } from '@/api/client';
import type { CalculoResponse } from '@/types/api';
import {
  WizardHeader,
  WizardFooter,
  LiveSummaryPanel,
  Step1Cotizacion,
  Step2EnvioBultos,
  Step3ProductoImpuestos,
  Step4ComparativaFinal,
} from '@/components/wizard';
import './App.css';

function AppContent() {
  const wizard = useWizard();

  const {
    form,
    watch,
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
  } = useCalculadoraForm((resultado) => {
    wizard.setResultado(resultado);
    if (wizard.currentStep === 4) {
      // Ya estamos en el paso 4, solo actualizamos el resultado
    }
  });

  const [buscandoDolar, setBuscandoDolar] = useState(false);

  const handleBuscarDolar = useCallback(async () => {
    setBuscandoDolar(true);
    try {
      const response = await obtenerTipoCambio();
      form.setValue('tipo_cambio_ars_usd', response.valor, { shouldValidate: true });
    } catch (err) {
      console.error('Error al obtener tipo de cambio:', err);
    } finally {
      setBuscandoDolar(false);
    }
  }, [form]);

  const handleNext = useCallback(async () => {
    await wizard.nextStep(form as UseFormReturn<FormInput, unknown, FormData>);
    // Si llegamos al paso 4, ejecutar cálculo
    if (wizard.currentStep === 4) {
      await ejecutarCalculo();
    }
  }, [wizard, form, ejecutarCalculo]);

  const currentStep = wizard.currentStep;

  return (
    <div className="app">
      <WizardHeader
        currentStep={wizard.currentStep}
        completedSteps={wizard.completedSteps}
        onStepClick={wizard.goToStep}
        canGoToStep={wizard.canGoToStep}
        stepNames={wizard.stepNames}
      />

      <div className="app-grid">
        <main className="app-main">
          {currentStep === 1 && (
            <Step1Cotizacion key="step-1" form={form} disabled={cargando} />
          )}
          {currentStep === 2 && (
            <Step2EnvioBultos
              key="step-2"
              form={form}
              disabled={cargando}
              pesoRealTotal={pesoRealTotal}
              pesoVolumetrico={pesoVolumetrico}
              pesoFacturable={pesoFacturable}
              volumenM3={volumenM3}
              usdPorKg={usdPorKg}
            />
          )}
          {currentStep === 3 && (
            <Step3ProductoImpuestos
              key="step-3"
              form={form}
              disabled={cargando}
              onBuscarDolar={handleBuscarDolar}
              buscandoDolar={buscandoDolar}
            />
          )}
          {currentStep === 4 && (
            <Step4ComparativaFinal
              key="step-4"
              resultado={wizard.resultado}
              moneda={wizard.moneda}
              onMonedaChange={wizard.setMoneda}
              sensibilidadDolar={wizard.sensibilidadDolar}
            />
          )}

          <WizardFooter
            currentStep={currentStep}
            onNext={handleNext}
            onPrev={wizard.prevStep}
            onReset={wizard.resetWizard}
            disabled={cargando}
          />

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
        </main>

        <aside className="app-sidebar">
          <LiveSummaryPanel
            resultado={wizard.resultado}
            moneda={wizard.moneda}
            onMonedaChange={wizard.setMoneda}
          />
        </aside>
      </div>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}