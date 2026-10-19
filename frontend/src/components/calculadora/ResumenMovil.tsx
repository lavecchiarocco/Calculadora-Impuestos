import { useId, useRef, useEffect, useState, useCallback } from 'react';
import { ChevronUp } from 'lucide-react';
import type { CalculoResponse } from '@/types/api';
import { calcularResumen } from '@/utils/resumen';
import { ResumenContenido } from './ResumenContenido';

interface ResumenMovilProps {
  resultado: CalculoResponse | null;
  moneda: 'USD' | 'ARS';
  onMonedaChange: (m: 'USD' | 'ARS') => void;
}

export function ResumenMovil({ resultado, moneda, onMonedaChange }: ResumenMovilProps) {
  const [abierto, setAbierto] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const barraRef = useRef<HTMLButtonElement>(null);
  const tituloId = useId();
  const panelId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (abierto && !dialog.open) {
      dialog.showModal();
    }
    if (!abierto && dialog.open) {
      dialog.close();
    }
  }, [abierto]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && abierto) {
        event.preventDefault();
        setAbierto(false);
        dialogRef.current?.close();
        barraRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [abierto]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      setAbierto(false);
      dialogRef.current?.close();
      barraRef.current?.focus();
    }
  };

  const handleClose = useCallback(() => {
    setAbierto(false);
    dialogRef.current?.close();
    barraRef.current?.focus();
  }, []);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    setDragging(false);
    setStartY(event.clientY);
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (!startY) return;
    const delta = Math.max(0, event.clientY - startY);
    if (delta > 6) setDragging(true);
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.style.transition = 'none';
      dialog.style.transform = `translateY(${delta}px)`;
    }
  }, [startY]);

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
    if (!startY) return;
    const delta = Math.max(0, event.clientY - startY);
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.style.transition = '';
      dialog.style.transform = '';
    }
    const wasDragging = dragging;
    setDragging(false);
    setStartY(0);
    if (!wasDragging) return;
    if (delta > 80) handleClose();
  }, [startY, dragging, handleClose]);

  const handleManijaClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (dragging) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    handleClose();
  }, [dragging, handleClose]);

  if (!resultado) {
    return null;
  }

  const resumen = calcularResumen(resultado, moneda);
  const { costoTotalFormateado, regimenNombre } = resumen;

  return (
    <>
      <button
        ref={barraRef}
        type="button"
        className="resumen-movil-barra"
        aria-expanded={abierto}
        aria-controls={panelId}
        onClick={() => setAbierto(true)}
      >
        <div className="resumen-movil-barra-izq">
          <span className="resumen-movil-barra-label">Más barato</span>
          <span className="resumen-movil-barra-total">{costoTotalFormateado}</span>
        </div>
        <div className="resumen-movil-barra-der">
          <span className="resumen-movil-barra-regimen">{regimenNombre}</span>
          <ChevronUp size={20} aria-hidden="true" />
        </div>
      </button>

      <dialog
        ref={dialogRef}
        id={panelId}
        className="resumen-movil-hoja"
        aria-labelledby={tituloId}
        onClose={handleClose}
        onCancel={(event) => {
          event.preventDefault();
          handleClose();
        }}
        onClick={handleBackdropClick}
      >
        <div className="resumen-movil-hoja-contenido">
          <header className="resumen-movil-hoja-header">
            <button
              type="button"
              className="resumen-movil-hoja-manija-btn"
              aria-label="Cerrar resumen"
              onClick={handleManijaClick}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{ touchAction: 'none' }}
            >
              <span className="resumen-movil-hoja-manija-bar" aria-hidden="true" />
            </button>
            <div className="resumen-movil-hoja-header-row">
              <h2 id={tituloId} className="resumen-movil-hoja-titulo">
                Resumen en vivo
              </h2>
              <div className="moneda-toggle" role="group" aria-label="Moneda">
                <button
                  type="button"
                  className={`moneda-btn ${moneda === 'USD' ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onMonedaChange('USD'); }}
                >
                  USD
                </button>
                <button
                  type="button"
                  className={`moneda-btn ${moneda === 'ARS' ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onMonedaChange('ARS'); }}
                >
                  ARS
                </button>
              </div>
            </div>
          </header>
          <div className="resumen-movil-hoja-cuerpo">
            <ResumenContenido resumen={resumen} datosEntrada={resultado.datos_entrada} />
          </div>
        </div>
      </dialog>
    </>
  );
}