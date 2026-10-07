import { Shield, Package, Truck, Plane, HelpCircle } from 'lucide-react';
import type { CalculoResponse, RegimenResultado } from '@/types/api';
import { formatearUSD, formatearARS, formatearNumero, formatearPorcentaje, formatearUSDEntero, formatearARSEntero } from '@/utils/format';

interface ResumenEnVivoProps {
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
          <p className="disclaimer bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3">
            Estimación orientativa. Las alícuotas marcadas <span className="badge-warning">A CONFIRMAR</span> dependen de la clasificación aduanera final.
          </p>
        </div>
      </aside>
    );
  }

  const masBarato = getRegimenMasBarato(resultado);

  const costoTotalMoneda = masBarato?.escenario_conservador
    ? (moneda === 'USD'
      ? masBarato.escenario_conservador.costo_total_puesto_pais_usd
      : masBarato.escenario_conservador.costo_total_puesto_pais_ars)
    : 0;

  const costoPorUnidadMoneda = masBarato?.escenario_conservador
    ? (moneda === 'USD'
      ? (masBarato.escenario_conservador.costo_por_unidad_usd ?? 0)
      : (masBarato.escenario_conservador.costo_por_unidad_ars ?? 0))
    : 0;

  const totalImpuestosMoneda = masBarato?.escenario_conservador
    ? (moneda === 'USD'
      ? masBarato.escenario_conservador.total_impuestos_usd
      : masBarato.escenario_conservador.total_impuestos_ars)
    : 0;

  // Formateo para costo por unidad sin decimales innecesarios
  const formatoMonedaUnidad = (valor: number, moneda: 'USD' | 'ARS'): string => {
    return moneda === 'USD' ? formatearUSDEntero(valor) : formatearARSEntero(valor);
  };

  // Valores de entrada en la moneda seleccionada
  const fobMoneda = moneda === 'USD' ? resultado.datos_entrada.precio_producto_usd : resultado.datos_entrada.precio_producto_usd * resultado.datos_entrada.tipo_cambio_ars_usd;
  const envioMoneda = moneda === 'USD' ? resultado.datos_entrada.costo_envio_usd : resultado.datos_entrada.costo_envio_usd * resultado.datos_entrada.tipo_cambio_ars_usd;
  const seguroMoneda = moneda === 'USD' ? resultado.datos_entrada.seguro_usd : resultado.datos_entrada.seguro_usd * resultado.datos_entrada.tipo_cambio_ars_usd;
  const cifMoneda = moneda === 'USD' ? resultado.cif_usd : resultado.cif_ars;

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

        {masBarato && (
          <div className="panel-section highlight">
            <div className="highlight-row">
              <span className="highlight-label">Más barato</span>
              <Shield size={16} className="highlight-icon" aria-hidden="true" />
            </div>
            <div className="highlight-value">{formatoMoneda(costoTotalMoneda, moneda)}</div>
            <div className="highlight-sub">{masBarato.regimen_nombre}</div>
            <div className="highlight-sub">Costo por unidad: {formatoMonedaUnidad(costoPorUnidadMoneda, moneda)}</div>
          </div>
        )}

        <div className="panel-section">
          <h3 className="section-title">Bases del cálculo</h3>
          <dl className="bases-grid">
            <div className="base-item">
              <dt>Valor FOB</dt>
              <dd>{moneda === 'USD' ? formatearUSD(fobMoneda) : formatearARS(fobMoneda)}</dd>
            </div>
            <div className="base-item">
              <dt>Envío</dt>
              <dd>{moneda === 'USD' ? formatearUSD(envioMoneda) : formatearARS(envioMoneda)}</dd>
            </div>
            <div className="base-item">
              <dt>Seguro</dt>
              <dd>{moneda === 'USD' ? formatearUSD(seguroMoneda) : formatearARS(seguroMoneda)}</dd>
            </div>
            <div className="base-item">
              <dt>Base CIF</dt>
              <dd>{moneda === 'USD' ? formatearUSD(cifMoneda) : formatearARS(cifMoneda)}</dd>
            </div>
            <div className="base-item total-impuestos">
              <dt>Total impuestos</dt>
              <dd className="text-success">{formatoMoneda(totalImpuestosMoneda, moneda)}</dd>
            </div>
          </dl>
        </div>

        <div className="panel-section">
          <h3 className="section-title">Detalles</h3>
          <dl className="details-grid">
            <div className="detail-item">
              <dt>NCM</dt>
              <dd>{resultado.datos_entrada.ncm || 'Máximo general (35%)'}</dd>
            </div>
            <div className="detail-item">
              <dt>DDP</dt>
              <dd>{resultado.datos_entrada.envio_incluye_impuestos_ddp ? 'Sí' : 'No'}</dd>
            </div>
            <div className="detail-item">
              <dt>Organismo externo</dt>
              <dd>{resultado.datos_entrada.requiere_organismo_externo ? 'Sí' : 'No'}</dd>
            </div>
            <div className="detail-item">
              <dt>Algún bulto {'>'} 50 kg</dt>
              <dd>{resultado.datos_entrada.algun_bulto_supera_50kg ? 'Sí' : 'No'}</dd>
            </div>
          </dl>
        </div>

        <p className="disclaimer bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3">
          Estimación orientativa. Las alícuotas marcadas <span className="badge-warning">A CONFIRMAR</span> dependen de la clasificación aduanera final.
        </p>
      </div>
    </aside>
  );
}