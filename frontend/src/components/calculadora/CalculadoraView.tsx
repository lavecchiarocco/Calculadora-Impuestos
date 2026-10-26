import { useCallback, useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useCalculadora } from '@/hooks/useCalculadora';
import { obtenerTipoCambio } from '@/api/client';
import { FormularioPrincipal } from './FormularioPrincipal';
import { ResumenEnVivo } from './ResumenEnVivo';
import { ResumenMovil } from './ResumenMovil';
import { Resultados } from './Resultados';
import { Footer } from './Footer';
import logoHorizontalColor from '@/assets/totalimport-logos/svg/logo-horizontal.svg';
import isotipoBlanco from '@/assets/totalimport-logos/svg/isotipo-blanco.svg';
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
  const [solicitandoCalculo, setSolicitandoCalculo] = useState(false);
  const resultadosRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!solicitandoCalculo || calculadora.cargando) return;
    if (calculadora.error) {
      setSolicitandoCalculo(false);
      return;
    }
    if (!calculadora.resultado) return;
    resultadosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSolicitandoCalculo(false);
  }, [calculadora.resultado, calculadora.cargando, calculadora.error, solicitandoCalculo]);

  const handleCalcular = useCallback(async () => {
    await calculadora.ejecutarCalculo();
    setSolicitandoCalculo(true);
  }, [calculadora.ejecutarCalculo]);

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
      <header className="calculator-app-nav">
        <a className="calculator-app-brand" href="/" aria-label="TotalImport, volver a la landing">
          <img src={logoHorizontalColor} alt="TotalImport" height={32} />
        </a>
        <a className="calculator-app-home" href="/#inicio"><ArrowLeft size={16} aria-hidden="true" />Volver al inicio</a>
      </header>

      <section className="calculator-page" id="calculadora" aria-labelledby="calculator-title">
      <div className="calculator-hero">
        <img className="calculator-hero-watermark" src={isotipoBlanco} alt="" aria-hidden="true" />
        <div className="calculator-hero-content">
          <span className="calculator-hero-eyebrow">Calculadora de importación</span>
          <h1 id="calculator-title">Estimá los costos de tu operación</h1>
          <p>Ingresá los datos de tu compra para calcular una estimación y comparar los regímenes disponibles.</p>
        </div>
      </div>
      <div className="layout">
        <main className="formulario-panel">
          <FormularioPrincipal
            form={calculadora.form}
            disabled={calculadora.cargandoDolarInicial}
            onBuscarDolar={handleBuscarDolar}
            buscandoDolar={buscandoDolar || calculadora.cargandoDolarInicial}
            onCalcular={handleCalcular}
            calculando={calculadora.cargando}
          />

          {calculadora.error && (
            <div className="alert alert-danger" role="alert">
              {calculadora.error}
            </div>
          )}

          <div ref={resultadosRef} className="calculator-results-anchor">
          <Resultados
            resultado={calculadora.resultado}
            moneda={calculadora.moneda}
            escenario={calculadora.escenario}
            onEscenarioChange={calculadora.setEscenario}
            sensibilidadDolar={calculadora.sensibilidadDolar}
            onSensibilidadChange={calculadora.setSensibilidadDolar}
            onCargarEjemplo={calculadora.cargarEjemplo}
          />
          </div>
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
      </section>

      <Footer />
    </div>
  );
}
