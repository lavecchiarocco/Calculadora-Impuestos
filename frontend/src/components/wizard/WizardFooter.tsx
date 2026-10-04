import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface WizardFooterProps {
  currentStep: 1 | 2 | 3 | 4;
  onNext: () => Promise<void>;
  onPrev: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export function WizardFooter({ currentStep, onNext, onPrev, onReset, disabled }: WizardFooterProps) {
  return (
    <footer className="wizard-footer">
      <div className="footer-inner">
        {currentStep > 1 && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onPrev}
            disabled={disabled}
          >
            <ChevronLeft size={18} /> ATRÁS
          </button>
        )}

        {currentStep < 4 ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onNext}
            disabled={disabled}
          >
            SIGUIENTE <ChevronRight size={18} />
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary w-full"
            onClick={onReset}
            disabled={disabled}
          >
            <RotateCcw size={18} /> NUEVA ESTIMACIÓN
          </button>
        )}
      </div>
    </footer>
  );
}