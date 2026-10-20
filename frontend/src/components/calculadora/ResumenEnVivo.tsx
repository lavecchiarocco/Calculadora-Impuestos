import { Package } from 'lucide-react';
import type { CalculoResponse } from '@/types/api';
import { calcularResumen } from '@/utils/resumen';
import { ResumenContenido } from './ResumenContenido';

interface ResumenEnVivoProps {
  resultado: CalculoResponse | null;
  moneda: 'USD' | 'ARS';
  onMonedaChange: (m: 'USD' | 'ARS') => void;
}

export function ResumenEnVivo({
  resultado,
  moneda,
  onMonedaChange,
}: ResumenEnVivoProps) {
  if (!resultado) {
    return (
      <aside className="resumen-en-vivo">
        <div className="panel-card">
          <div className="panel-header">
            <h2 className="panel-title">Resumen en vivo</h2>
          </div>
          <div className="panel-empty">
            <div className="mb-3 rounded-full bg-blue-50 p-4">
              <Package size={48} className="empty-icon text-blue-500" aria-hidden="true" />
            </div>
            <p>Completa el formulario para ver el resumen</p>
          </div>
        </div>
      </aside>
    );
  }

  const resumen = calcularResumen(resultado, moneda);

  return (
    <aside className="resumen-en-vivo">
      <div className="panel-card">
        <div className="panel-header">
          <h2 className="panel-title">Resumen en vivo</h2>
          <div className="moneda-toggle" role="group" aria-label="Moneda">
            <button
              type="button"
              className={`moneda-btn ${moneda === 'USD' ? 'active' : ''}`}
              onClick={() => onMonedaChange('USD')}
            >
              USD
            </button>
            <button
              type="button"
              className={`moneda-btn ${moneda === 'ARS' ? 'active' : ''}`}
              onClick={() => onMonedaChange('ARS')}
            >
              ARS
            </button>
          </div>
        </div>

        <ResumenContenido resumen={resumen} datosEntrada={resultado.datos_entrada} />
      </div>
    </aside>
  );
}
