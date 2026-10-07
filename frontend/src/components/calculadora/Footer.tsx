import { useState } from 'react';

export function Footer() {
  const [showTerms, setShowTerms] = useState(false);

  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">
          Al usar esta herramienta aceptás los
          <button
            type="button"
            className="footer-terms-link"
            onClick={() => setShowTerms(true)}
            aria-label="Ver términos y condiciones"
          >
            Términos y condiciones
          </button>
        </p>
      </div>

      {showTerms && (
        <div className="modal-overlay" onClick={() => setShowTerms(false)} role="dialog" aria-modal="true" aria-labelledby="terms-title">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="terms-title" className="modal-title">Términos y condiciones de uso: TotalImport</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowTerms(false)}
                aria-label="Cerrar términos y condiciones"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-date"><strong>Última actualización:</strong> 07/10/2026</p>
              
              <section className="terms-section">
                <h3>1. Qué es esta herramienta</h3>
                <p>Es una calculadora que estima, a partir de los datos que ingresás, los impuestos y el costo aproximado de importar mercadería a la Argentina. Es informativa y orientativa.</p>
              </section>

              <section className="terms-section">
                <h3>2. No es asesoramiento</h3>
                <p>Los resultados no constituyen asesoramiento aduanero, impositivo, contable ni legal, ni reemplazan la intervención de un despachante de aduana, un courier o un contador. No somos ARCA ni mantenemos relación con ningún organismo público o empresa de logística.</p>
              </section>

              <section className="terms-section">
                <h3>3. Las estimaciones pueden diferir de lo que efectivamente pagues</h3>
                <p>Los cálculos usan alícuotas, topes y reglas que pueden cambiar por decreto o resolución, o estar mal interpretados.</p>
                <p>Cuando falta un dato (por ejemplo la posición arancelaria), la herramienta usa valores máximos del rango posible para no subestimar el costo. Eso puede generar una estimación mayor a la real.</p>
                <p>Los parámetros marcados "a confirmar" no están verificados con fuentes oficiales.</p>
                <p>Los montos finales los determinan la Aduana, el courier y las normas vigentes al momento de la operación. También pueden influir tasas de servicio, almacenaje, percepciones, el tipo de cambio aplicado y otros costos que la herramienta no contempla.</p>
              </section>

              <section className="terms-section">
                <h3>4. Tus datos y tu responsabilidad</h3>
                <p>Sos responsable de la exactitud de lo que ingresás y de verificar los resultados antes de tomar decisiones de compra, precio o inversión. Elegir el régimen de importación correcto, incluyendo si corresponde uso personal o comercial, y cumplir los requisitos (límites de valor, peso y cantidad, certificaciones, inscripciones) es tu responsabilidad.</p>
              </section>

              <section className="terms-section">
                <h3>5. Uso permitido</h3>
                <p>No se puede usar la herramienta para evadir controles ni obligaciones aduaneras o impositivas, por ejemplo, para fraccionar envíos con el fin de eludir topes. Tampoco para actividades ilícitas ni para intentar dañar o sobrecargar el servicio.</p>
              </section>

              <section className="terms-section">
                <h3>6. Disponibilidad</h3>
                <p>La herramienta se ofrece "tal cual está", sin garantía de que funcione sin interrupciones o errores. Podemos modificarla, suspenderla o discontinuarla en cualquier momento.</p>
              </section>

              <section className="terms-section">
                <h3>7. Limitación de responsabilidad</h3>
                <p>En la medida permitida por la ley, no respondemos por pérdidas, costos o daños derivados del uso de la herramienta o de la confianza en sus resultados, incluyendo diferencias entre lo estimado y lo pagado. Esto no limita derechos que la ley reconozca a los consumidores y que no puedan renunciarse.</p>
              </section>

              <section className="terms-section">
                <h3>8. Privacidad y datos personales</h3>
                <p>Hoy, los datos de la cotización que cargás se procesan para calcular el resultado y se guardan solo en tu navegador / se envían a nuestro servidor para calcular, sin asociarlos a una identidad.</p>
                <p>No pedimos datos personales para usar la herramienta.</p>
                <p>Responsable del tratamiento: [nombre y contacto]. La Agencia de Acceso a la Información Pública (AAIP) es el órgano de control de la Ley 25.326 de Protección de los Datos Personales y atiende denuncias y reclamos de los titulares.</p>
              </section>

              <section className="terms-section">
                <h3>9. Propiedad intelectual</h3>
                <p>El software, el diseño y los textos de la herramienta pertenecen a [titular] o se usan con autorización. No se pueden copiar ni redistribuir sin permiso, salvo lo que la ley permita.</p>
              </section>

              <section className="terms-section">
                <h3>10. Cambios en estos términos</h3>
                <p>Podemos actualizarlos. La versión vigente es la publicada en esta página, con su fecha de actualización. Seguir usando la herramienta implica aceptar los cambios.</p>
              </section>

              <section className="terms-section">
                <h3>11. Ley aplicable y jurisdicción</h3>
                <p>Se rigen por las leyes de la República Argentina. Para cualquier controversia, serán competentes los tribunales de [ciudad/jurisdicción], sin perjuicio de los derechos que la normativa de defensa del consumidor reconozca al usuario.</p>
              </section>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowTerms(false)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}