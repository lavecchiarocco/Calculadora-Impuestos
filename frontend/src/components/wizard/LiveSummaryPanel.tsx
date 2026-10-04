import { Shield, Package, Truck, Plane, HelpCircle } from 'lucide-react';
import type { CalculoResponse, RegimenResultado } from '@/types/api';
import { formatearUSD, formatearARS, formatearNumero, formatearPorcentaje } from '@/utils/format';

interface LiveSummaryPanelProps {
  resultado: CalculoResponse | null;
  moneda: 'USD' | 'ARS';
  onMonedaChange: (m: 'USD' | 'ARS') => void;
}

function formatoMoneda(valor: number, moneda: 'USD' | 'ARS'): string {
  return moneda === 'USD' ? formatearUSD(valor) : formatearARS(valor);
}

function getRegimenMasBarato(resultado: CalculoResponse): RegimenResultado | undefined {
  const id = resultado.regimen_mas_barato_elegible;
  return resultado.regímenes.find(r => r.regimen_id === id);
}

export function LiveSummaryPanel({
  resultado,
  moneda,
  onMonedaChange,
}: LiveSummaryPanelProps) {
  if (!resultado) {
    return (
      <aside className="live-summary-panel">
        <div className="panel-card">
          <div className="panel-header">
            <h2 className="panel-title">Resumen en vivo</h2>
          </div>
          <div className="panel-empty">
            <Package size={48} className="empty-icon" aria-hidden="true" />
            <p>Completa los pasos para ver el resumen</p>
          </div>
          <p className="disclaimer">
            Estimación orientativa. Las alícuotas marcadas <span className="badge-warning">A CONFIRMAR</span> dependen de la clasificación aduanera final.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="live-summary-panel">
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

        <div className="panel-section">
          <h3 className="section-title">Bases del cálculo</h3>
          <dl className="bases-grid">
            <div className="base-item">
              <dt>Valor FOB</dt>
              <dd>{formatoMoneda(resultado.datos_entrada.precio_producto_usd, 'USD')}</dd>
            </div>
            <div className="base-item">
              <dt>Envío</dt>
              <dd>{formatoMoneda(resultado.datos_entrada.costo_envio_usd, 'USD')}</dd>
            </div>
            <div className="base-item">
              <dt>Seguro</dt>
              <dd>{formatoMoneda(resultado.datos_entrada.seguro_usd, 'USD')}</dd>
            </div>
            <div className="base-item">
              <dt>Base CIF</dt>
              <dd>{formatoMoneda(resultado.cif_usd, 'USD')} / {formatoMoneda(resultado.cif_ars, 'ARS')}</dd>
            </div>
          </dl>
        </div>

        <div className="panel-section">
          <h3 className="section-title">Detalles</h3>
          <dl className="details-grid">
            <div className="detail-item">
              <dt>Transporte</dt>
              <dd className="flex items-center gap-1">
                {resultado.datos_entrada.modo_transporte === 'aereo' ? <Plane size={14} aria-hidden="true" /> : <Truck size={14} aria-hidden="true" />}
                {resultado.datos_entrada.modo_transporte === 'aereo' ? 'Aéreo' : 'Marítimo'}
              </dd>
            </div>
            <div className="detail-item">
              <dt>Kg facturables</dt>
              <dd>{formatearNumero(resultado.peso_facturable_kg, 2)} kg</dd>
            </div>
            <div className="detail-item">
              <dt>NCM</dt>
              <dd>Máximo general (35%)</dd>
            </div>
            <div className="detail-item">
              <dt>DDP</dt>
              <dd>{resultado.datos_entrada.envio_incluye_impuestos_ddp ? 'Sí' : 'No'}</dd>
            </div>
          </dl>
        </div>

        <p className="disclaimer">
          Estimación orientativa. Las alícuotas marcadas <span className="badge-warning">A CONFIRMAR</span> dependen de la clasificación aduanera final.
        </p>
      </div>
    </aside>
  );
}