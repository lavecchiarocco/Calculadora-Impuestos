import { useCallback, useState, useEffect } from 'react';
import { useCalculadora } from '@/hooks/useCalculadora';
import { obtenerTipoCambio } from '@/api/client';
import { FormularioPrincipal } from './FormularioPrincipal';
import { ResumenEnVivo } from './ResumenEnVivo';
import { ResumenMovil } from './ResumenMovil';
import { Resultados } from './Resultados';
import { Footer } from './Footer';
import './CalculadoraView.css';

const BREAKPOINT_DESKTOP = 1200;

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= BREAKPOINT_DESKTOP);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isDesktop;
}

export function CalculadoraView() {
  const calculadora = useCalculadora();
  const isDesktop = useIsDesktop();

  const [buscandoDolar, setBuscandoDolar] = useState(false);

  const handleBuscarDolar = useCallback(async () => {
    setBuscandoDolar(true);
    try {
      const response = await obtenerTipoCambio();
      calculadora.form.setValue('tipo_cambio_ars_usd', response.valor, { shouldValidate: true });
    } catch (err) {
      console.error('Error al obtener tipo de cambio:', err);
    } finally {
      setBuscandoDolar(false);
    }
  }, [calculadora.form]);

  return (
    <div className={`calculadora-view ${calculadora.resultado ? 'tiene-resumen' : ''}`}>
      <header className="cabecera">
        <div className="cabecera-izq">
          <h1 className="cabecera-title">Calculadora de Impuestos de Importación</h1>
          <p className="cabecera-subtitle">Estimá cuánto pagarías de impuestos al importar</p>
        </div>
      </header>

      <div className="layout">
        <main className="formulario-panel">
          <FormularioPrincipal
            form={calculadora.form}
            disabled={calculadora.cargandoDolarInicial}
            onBuscarDolar={handleBuscarDolar}
            buscandoDolar={buscandoDolar || calculadora.cargandoDolarInicial}
          />

          {calculadora.error && (
            <div className="alert alert-danger" role="alert">
              {calculadora.error}
            </div>
          )}

          <Resultados
            resultado={calculadora.resultado}
            moneda={calculadora.moneda}
            escenario={calculadora.escenario}
            onEscenarioChange={calculadora.setEscenario}
            sensibilidadDolar={calculadora.sensibilidadDolar}
            onSensibilidadChange={calculadora.setSensibilidadDolar}
            onCargarEjemplo={calculadora.cargarEjemplo}
          />
        </main>

        {isDesktop && (
          <aside className="resultados-panel">
            <ResumenEnVivo
              resultado={calculadora.resultado}
              moneda={calculadora.moneda}
              onMonedaChange={calculadora.setMoneda}
            />
          </aside>
        )}

        {!isDesktop && (
          <ResumenMovil
            resultado={calculadora.resultado}
            moneda={calculadora.moneda}
            onMonedaChange={calculadora.setMoneda}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}