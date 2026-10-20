import { Shield } from 'lucide-react';
import type { ResumenCalculado } from '@/utils/resumen';
import type { CalculoResponse } from '@/types/api';

interface ResumenContenidoProps {
  resumen: ResumenCalculado;
  datosEntrada: CalculoResponse['datos_entrada'];
}

export function ResumenContenido({ resumen, datosEntrada }: ResumenContenidoProps) {
  const { regimenMasBarato, regimenNombre, costoTotalFormateado, costoPorUnidadFormateado, totalImpuestosFormateado, fobFormateado, envioFormateado, seguroFormateado, cifFormateado } = resumen;

  return (
    <>
      {regimenMasBarato && (
        <div className="panel-section highlight">
          <div className="highlight-row">
            <span className="highlight-label">Más barato</span>
            <Shield size={16} className="highlight-icon" aria-hidden="true" />
          </div>
          <div className="highlight-value">{costoTotalFormateado}</div>
          <div className="highlight-sub">{regimenNombre}</div>
          <div className="highlight-sub">Costo por unidad: {costoPorUnidadFormateado}</div>
        </div>
      )}

      <div className="panel-section">
        <h3 className="section-title">Bases del cálculo</h3>
        <dl className="bases-grid">
          <div className="base-item">
            <dt>Valor FOB</dt>
            <dd>{fobFormateado}</dd>
          </div>
          <div className="base-item">
            <dt>Envío</dt>
            <dd>{envioFormateado}</dd>
          </div>
          <div className="base-item">
            <dt>Seguro</dt>
            <dd>{seguroFormateado}</dd>
          </div>
          <div className="base-item">
            <dt>Base CIF</dt>
            <dd>{cifFormateado}</dd>
          </div>
          <div className="base-item total-impuestos">
            <dt>Total impuestos</dt>
            <dd className="text-success">{totalImpuestosFormateado}</dd>
          </div>
        </dl>
      </div>

      <div className="panel-section">
        <h3 className="section-title">Detalles</h3>
        <dl className="details-grid">
          <div className="detail-item">
            <dt>NCM</dt>
            <dd>{datosEntrada.ncm || 'Máximo general (35%)'}</dd>
          </div>
          <div className="detail-item">
            <dt>DDP</dt>
            <dd>{datosEntrada.envio_incluye_impuestos_ddp ? 'Sí' : 'No'}</dd>
          </div>
          <div className="detail-item">
            <dt>Organismo externo</dt>
            <dd>{datosEntrada.requiere_organismo_externo ? 'Sí' : 'No'}</dd>
          </div>
          <div className="detail-item">
            <dt>Algún bulto {'>'} 50 kg</dt>
            <dd>{datosEntrada.algun_bulto_supera_50kg ? 'Sí' : 'No'}</dd>
          </div>
        </dl>
      </div>

    </>
  );
}
