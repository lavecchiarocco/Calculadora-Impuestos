import { useCallback, useState } from 'react';
import { useCalculadora } from '@/hooks/useCalculadora';
import { obtenerTipoCambio } from '@/api/client';
import { FormularioPrincipal } from './FormularioPrincipal';
import { ResumenEnVivo } from './ResumenEnVivo';
import { Resultados } from './Resultados';
import './CalculadoraView.css';

export function CalculadoraView() {
  const calculadora = useCalculadora();

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
    <div className="calculadora-view">
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
            disabled={calculadora.cargando || calculadora.cargandoDolarInicial}
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

        <aside className="resultados-panel">
          <ResumenEnVivo
            resultado={calculadora.resultado}
            moneda={calculadora.moneda}
            onMonedaChange={calculadora.setMoneda}
          />
        </aside>
      </div>
    </div>
  );
}