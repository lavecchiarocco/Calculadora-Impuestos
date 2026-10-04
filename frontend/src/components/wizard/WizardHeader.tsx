import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { UseWizardReturn } from '@/hooks/useWizard';

type WizardState = Pick<UseWizardReturn, 'currentStep' | 'completedSteps'>;

interface WizardHeaderProps {
  currentStep: WizardState['currentStep'];
  completedSteps: WizardState['completedSteps'];
  onStepClick: (step: number) => void;
  canGoToStep: (step: number) => boolean;
  stepNames: readonly string[];
}

export function WizardHeader({
  currentStep,
  completedSteps,
  onStepClick,
  canGoToStep,
  stepNames,
}: WizardHeaderProps) {
  const steps = [
    { num: 1, name: stepNames[0] },
    { num: 2, name: stepNames[1] },
    { num: 3, name: stepNames[2] },
    { num: 4, name: stepNames[3] },
  ];

  return (
    <header className="wizard-header">
      <div className="header-content">
        <div className="header-left">
          <p className="header-label">ARGENTINA · IMPORTACIONES</p>
          <h1 className="header-title">Calculadora de Impuestos</h1>
        </div>
        <div className="header-right">
          <span className="step-indicator">
            PASO 0{currentStep} / 04 · {stepNames[currentStep - 1]}
          </span>
        </div>
      </div>

      <div className="progress-bar" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={4}>
        {steps.map((step, idx) => {
          const isCompleted = completedSteps.has(step.num);
          const isCurrent = step.num === currentStep;
          const isFuture = step.num > currentStep;
          const clickable = canGoToStep(step.num);

          return (
            <button
              key={step.num}
              type="button"
              className={`progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isFuture ? 'future' : ''} ${clickable ? 'clickable' : ''}`}
              onClick={() => clickable && onStepClick(step.num)}
              disabled={!clickable}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Paso ${step.num}: ${step.name}${isCompleted ? ' (completado)' : isCurrent ? ' (actual)' : ''}`}
            >
              <span className="step-circle">
                {isCompleted && <Check size={14} />}
                {!isCompleted && step.num}
              </span>
              <span className="step-label">{step.name}</span>
              {idx < steps.length - 1 && (
                <span className={`step-connector ${isCompleted ? 'completed' : ''}`} />
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}