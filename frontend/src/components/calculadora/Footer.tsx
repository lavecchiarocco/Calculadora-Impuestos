import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useForm, ValidationError } from '@formspree/react';
import logoHorizontalColor from '@/assets/totalimport-logos/svg/logo-horizontal.svg';

export function Footer() {
  const [showTerms, setShowTerms] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState('Idea o sugerencia');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [state, handleSubmit, resetForm] = useForm('xrpevore');

  const closeFeedback = () => {
    setShowFeedback(false);
    setFeedbackMessage('');
    setFeedbackType('Idea o sugerencia');
    resetForm();
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="landing-footer-main">
          <a className="landing-brand" href="/#inicio" aria-label="TotalImport, volver al inicio">
            <img src={logoHorizontalColor} alt="TotalImport" />
          </a>
          <nav className="landing-footer-links" aria-label="Enlaces del pie de página">
            <a href="/calculadora">Calculadora</a>
            <a href="/#como-funciona">Cómo funciona</a>
            <a href="/#preguntas">Preguntas frecuentes</a>
          </nav>
          <p className="landing-footer-disclaimer">Los resultados son estimativos y no reemplazan la consulta con un profesional.</p>
        </div>
        <p className="footer-text">
          Al usar esta herramienta aceptás los{' '}
          <button type="button" className="footer-terms-link" onClick={() => setShowTerms(true)} aria-label="Ver términos y condiciones">
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

      <button
        type="button"
        className="feedback-fab"
        onClick={() => {
          resetForm();
          setFeedbackMessage('');
          setFeedbackType('Idea o sugerencia');
          setShowFeedback(true);
        }}
        aria-label="Enviar un comentario o sugerencia"
      >
        <MessageCircle size={22} aria-hidden="true" />
        <span>Dejar un mensaje</span>
      </button>

      {showFeedback && (
        <div
          className="modal-overlay feedback-overlay"
          onClick={closeFeedback}
          role="presentation"
        >
          <section
            className="modal-content feedback-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
          >
            <header className="modal-header">
              <div>
                <h2 id="feedback-title" className="modal-title">¿Qué podemos mejorar?</h2>
                <p className="feedback-description">Contanos si encontraste un error o tenés una idea para la calculadora.</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closeFeedback}
                aria-label="Cerrar formulario de comentarios"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>
            {state.succeeded ? (
              <div className="modal-body feedback-success" role="status" aria-live="polite">
                <div className="feedback-success-icon" aria-hidden="true">✓</div>
                <h3>¡Gracias por tu mensaje!</h3>
                <p>Tu comentario fue enviado. Nos ayuda a mejorar la calculadora.</p>
                <button type="button" className="feedback-submit" onClick={closeFeedback}>Cerrar</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="modal-body feedback-body">
                  <input type="hidden" name="_subject" value={`[Calculadora] ${feedbackType}`} />
                  <label className="feedback-label" htmlFor="feedback-type">Tipo de mensaje</label>
                  <select
                    id="feedback-type"
                    className="feedback-input"
                    name="tipo"
                    value={feedbackType}
                    onChange={(event) => setFeedbackType(event.target.value)}
                  >
                    <option>Error encontrado</option>
                    <option>Funcionalidad para implementar</option>
                    <option>Idea o sugerencia</option>
                    <option>Otro</option>
                  </select>

                  <label className="feedback-label" htmlFor="feedback-message">Tu mensaje</label>
                  <textarea
                    id="feedback-message"
                    className="feedback-input feedback-textarea"
                    name="message"
                    value={feedbackMessage}
                    onChange={(event) => setFeedbackMessage(event.target.value)}
                    placeholder="Escribí tu comentario..."
                    maxLength={2000}
                    required
                    rows={5}
                  />
                  <ValidationError field="message" errors={state.errors} className="feedback-error" />
                  <ValidationError errors={state.errors} className="feedback-error" />
                  <p className="feedback-hint">El mensaje se enviará de forma segura mediante Formspree.</p>
                </div>
                <footer className="modal-footer">
                  <button type="button" className="feedback-cancel" onClick={closeFeedback}>
                    Cancelar
                  </button>
                  <button type="submit" className="feedback-submit" disabled={state.submitting || !feedbackMessage.trim()}>
                    <MessageCircle size={17} aria-hidden="true" />
                    {state.submitting ? 'Enviando…' : 'Enviar mensaje'}
                  </button>
                </footer>
              </form>
            )}
          </section>
        </div>
      )}
    </footer>
  );
}
