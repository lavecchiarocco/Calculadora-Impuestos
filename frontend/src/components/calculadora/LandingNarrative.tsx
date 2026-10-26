import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Package,
  Scale,
  ShieldCheck,
} from "lucide-react";
import logoHorizontalColor from "@/assets/totalimport-logos/svg/logo-horizontal.svg";
import "./LandingNarrative.css";

const HeroScene = lazy(() => import("./HeroScene").then((module) => ({ default: module.HeroScene })));
const HeroMarquee = lazy(() => import("./HeroScene").then((module) => ({ default: module.HeroMarquee })));

const pasos = [
  {
    titulo: "Todo empieza con los datos de tu operación.",
    texto:
      "Ingresá el precio FOB, el costo de envío, la cantidad y el máximo de productos idénticos. El seguro es opcional.",
    icono: Package,
  },
  {
    titulo: "Cada dato forma parte del resultado.",
    texto:
      "La calculadora combina los datos ingresados con las condiciones y reglas disponibles para estimar los costos de cada régimen.",
    icono: ClipboardList,
  },
  {
    titulo: "Compará las alternativas y entendé las diferencias.",
    texto:
      "Revisá los costos estimados, la elegibilidad y los escenarios mínimo y conservador cuando estén disponibles.",
    icono: Scale,
  },
];

const preguntas = [
  {
    q: "¿El resultado es el costo definitivo de mi importación?",
    a: "No. Es una estimación orientativa a partir de los datos ingresados y de las reglas disponibles en la herramienta. El monto efectivo puede variar por normativa vigente, clasificación arancelaria, courier, Aduana y otros cargos.",
  },
  {
    q: "¿Qué pasa si no conozco la posición arancelaria (NCM)?",
    a: "Podés continuar sin informarla. Cuando falta una alícuota específica, algunos valores pueden estimarse con el máximo del rango posible; el detalle identifica los importes que están a confirmar o son estimaciones máximas.",
  },
  {
    q: "¿La calculadora contempla todos los costos de logística?",
    a: "Contempla los datos que cargás de precio, envío y seguro, y los conceptos tributarios que devuelve el cálculo para los regímenes disponibles. No necesariamente incluye cargos del courier, almacenaje, servicios u otros costos particulares.",
  },
  {
    q: "¿Puedo comparar distintos regímenes?",
    a: "Sí. La pantalla de resultados presenta los regímenes que devuelve el cálculo, su elegibilidad y los escenarios disponibles. La disponibilidad y los requisitos deben verificarse para cada operación.",
  },
];

function Navbar() {
  return (
    <header className="landing-nav">
      <a
        className="landing-brand"
        href="#inicio"
        aria-label="TotalImport, inicio"
      >
        <img src={logoHorizontalColor} alt="TotalImport" />
      </a>
      <nav aria-label="Navegación principal">
        <a href="/calculadora">Calculadora</a>
        <a href="#como-funciona">Cómo funciona</a>
        <a href="#preguntas">Preguntas frecuentes</a>
      </nav>
      <a className="landing-nav-cta" href="/calculadora">
        Ir al cálculo <ArrowRight size={16} />
      </a>
    </header>
  );
}

function StoryPanel({ active }: { active: number }) {
  const [displayedActive, setDisplayedActive] = useState(active);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (active === displayedActive) return;

    setIsExiting(true);
    const timeout = window.setTimeout(() => {
      setDisplayedActive(active);
      setIsExiting(false);
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [active, displayedActive]);

  const actual = pasos[displayedActive];
  const Icono = actual.icono;
  const titulosVisuales = [
    "Datos de la operación",
    "Construcción de la estimación",
    "Resultados por régimen",
  ];

  return (
    <div
      className="story-panel"
      aria-live="polite"
      aria-label={`Visualización de etapa ${displayedActive + 1}: ${actual.titulo}`}
    >
      <div className="story-panel-top">
        <span className="story-panel-kicker">Vista del proceso</span>
        <span className="story-panel-count">0{displayedActive + 1} / 03</span>
      </div>
      <div className={`story-demo-card${isExiting ? " is-exiting" : ""}`} key={displayedActive}>
        <div className="story-demo-heading">
          <span className="story-icon">
            <Icono size={19} />
          </span>
          <div>
            <span className="story-demo-overline">ETAPA 0{displayedActive + 1}</span>
            <strong>{titulosVisuales[displayedActive]}</strong>
          </div>
        </div>
        {displayedActive === 0 && (
          <div className="story-visual story-input-visual">
            <p className="story-visual-caption">Campos requeridos · valores ilustrativos</p>
            <div className="story-input-row story-reveal-item">
              <span>Precio FOB</span><strong>USD 240</strong>
            </div>
            <div className="story-input-row story-reveal-item">
              <span>Costo de envío</span><strong>USD 35</strong>
            </div>
            <div className="story-input-row story-reveal-item">
              <span>Seguro <i>Opcional</i></span><strong>Sin informar</strong>
            </div>
            <div className="story-input-row story-reveal-item">
              <span>Cantidad de productos</span><strong>5</strong>
            </div>
            <div className="story-input-row story-reveal-item">
              <span>Máx. productos idénticos</span><strong>3</strong>
            </div>
          </div>
        )}
        {displayedActive === 1 && (
          <div className="story-visual story-process-visual">
            <div className="story-process-row story-reveal-item">
              <span className="story-process-icon"><Check size={15} /></span>
              <span><strong>Información de compra</strong><small>FOB · envío · seguro · cantidad</small></span>
            </div>
            <div className="story-process-row story-reveal-item">
              <span className="story-process-icon"><Check size={15} /></span>
              <span><strong>Condiciones declaradas</strong><small>Tipo de cambio · DDP · NCM</small></span>
            </div>
            <div className="story-process-row story-reveal-item">
              <span className="story-process-icon"><Check size={15} /></span>
              <span><strong>Reglas disponibles</strong><small>Parámetros implementados</small></span>
            </div>
            <div className="story-estimate-result story-reveal-item">
              <span>Estimación orientativa</span>
              <small>Según los datos y parámetros disponibles</small>
            </div>
          </div>
        )}
        {displayedActive === 2 && (
          <div className="story-visual story-results-visual">
            <p className="story-visual-caption">Alternativas disponibles en la calculadora</p>
            {["Pequeños envíos", "Courier comercial", "Régimen general"].map((regimen, index) => (
              <div className="story-regime-row story-reveal-item" key={regimen}>
                <span className="story-regime-index">0{index + 1}</span>
                <strong>{regimen}</strong>
                <span className="story-regime-detail" aria-hidden="true"></span>
              </div>
            ))}
            <div className="story-scenario-chips story-reveal-item">
              <span>Escenario mínimo</span><span>Conservador</span>
            </div>
          </div>
        )}
        <p className="story-demo-note">
          {displayedActive === 0
            ? "Los valores son ilustrativos y no representan una cotización real."
            : displayedActive === 1
              ? "Los componentes dependen de los datos ingresados y del régimen."
              : "Importes y elegibilidad dependen de cada operación."}
        </p>
      </div>
      <div
        className="story-progress"
        aria-label={`Progreso: etapa ${active + 1} de 3`}
      >
        {pasos.map((paso, index) => (
          <span
            key={paso.titulo}
            className={
              index < active
                ? "is-complete"
                : index === active
                  ? "is-active"
                  : ""
            }
          />
        ))}
      </div>
    </div>
  );
}

export function LandingNarrative({ position }: { position: "top" | "bottom" }) {
  const [active, setActive] = useState(0);
  const stepsRef = useRef<HTMLDivElement>(null);

  // 1) Reveal: igual que antes, pero SIN la lógica del paso activo
  useEffect(() => {
    document.documentElement.classList.add("landing-motion-ready");
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-story-step], [data-reveal]",
      ),
    );
    if (!("IntersectionObserver" in window))
      return () =>
        document.documentElement.classList.remove("landing-motion-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        }
      },
      { threshold: 0.28, rootMargin: "-10% 0px -20% 0px" },
    );
    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("landing-motion-ready");
    };
  }, []);

  // 2) Paso activo: solo en la instancia que renderiza la historia
  useEffect(() => {
    if (position !== "bottom") return;
    const nodes = Array.from(
      stepsRef.current?.querySelectorAll<HTMLElement>("[data-story-step]") ??
        [],
    );
    if (!nodes.length || !("IntersectionObserver" in window)) return;
    const isMobileLayout = window.matchMedia("(max-width: 680px)").matches;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((entry) => entry.isIntersecting);
        if (!intersecting.length) return;

        const activationPoint = window.innerHeight * (isMobileLayout ? 0.75 : 0.5);
        const closestStep = intersecting.reduce((closest, entry) => {
          const distance = Math.abs(
            entry.boundingClientRect.top + entry.boundingClientRect.height / 2 - activationPoint,
          );
          const closestDistance = Math.abs(
            closest.boundingClientRect.top + closest.boundingClientRect.height / 2 - activationPoint,
          );
          return distance < closestDistance ? entry : closest;
        });
        const nextActive = Number(closestStep.target.getAttribute("data-story-step"));
        setActive((current) => current === nextActive ? current : nextActive);
      },
      {
        rootMargin: isMobileLayout ? "-65% 0px -15% 0px" : "-40% 0px -40% 0px",
        threshold: 0,
      },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [position]);

  if (position === "top")
    return (
      <>
        <Navbar />
        <section
          id="inicio"
          className="landing-hero"
          aria-labelledby="landing-title"
        >
          <div className="landing-hero-copy" data-reveal>
            <span className="landing-eyebrow" data-hero-copy>
              <span className="landing-eyebrow-dot" /> Claridad para planificar
              tu importación
            </span>
            <h1 id="landing-title" data-hero-copy>
              Calculá el costo real <span>de importar.</span>
            </h1>
            <p data-hero-copy>
              Conocé una estimación de impuestos y costos para tu operación en
              Argentina, con los datos de tu compra y una comparación de
              regímenes.
            </p>
            <div className="landing-hero-actions" data-hero-copy>
              <a className="landing-primary-button" href="/calculadora">
                Comenzar cálculo <ArrowRight size={17} />
              </a>
              <a className="landing-text-link" href="#como-funciona">
                Conocé cómo funciona <ArrowDown size={15} />
              </a>
            </div>
            <div className="landing-trust-note" data-hero-copy>
              <ShieldCheck size={17} /> Estimación transparente, con supuestos
              visibles
            </div>
          </div>
          <Suspense fallback={<div className="landing-hero-art hero-ticket-loading" aria-hidden="true" />}>
            <HeroScene />
          </Suspense>
        </section>
        <Suspense fallback={<div className="landing-hero-marquee hero-marquee-loading" aria-hidden="true" />}>
          <HeroMarquee />
        </Suspense>
      </>
    );

  return (
    <div className="landing-content">
      <section className="landing-how landing-section" id="como-funciona">
        <div className="landing-section-heading" data-reveal>
          <span className="landing-eyebrow">Un recorrido simple</span>
          <h2>De la cotización a una decisión más clara</h2>
          <p>
            La calculadora organiza la información de tu operación para que
            puedas entender sus componentes.
          </p>
        </div>
        <div className="landing-steps">
          {pasos.map(({ titulo, texto, icono: Icono }, index) => (
            <article className="landing-step" data-reveal key={titulo}>
              <span className="landing-step-number">0{index + 1}</span>
              <span className="landing-step-icon">
                <Icono size={20} />
              </span>
              <h3>{titulo}</h3>
              <p>{texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="landing-story landing-section"
        aria-labelledby="story-title"
      >
        <div className="story-intro" data-reveal>
          <span className="landing-eyebrow">Una operación, paso a paso</span>
          <h2 id="story-title">Entendé qué hay detrás de cada estimación.</h2>
          <p>
            Seguí el recorrido desde la información inicial hasta la lectura
            comparativa de resultados.
          </p>
        </div>
        <div className="story-layout">
          <div className="story-steps" ref={stepsRef}>
            {pasos.map(({ titulo, texto }, index) => (
              <article
                className={`story-step${index === active ? " is-active" : index < active ? " is-complete" : ""}`}
                data-story-step={index}
                aria-current={index === active ? "step" : undefined}
                key={titulo}
              >
                <span className="story-step-number" aria-hidden="true">0{index + 1}</span>
                <div className="story-step-copy">
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="story-sticky">
            <StoryPanel active={active} />
          </div>
        </div>
      </section>

      <section
        className="landing-components landing-section"
        id="que-contempla"
      >
        <div className="landing-section-heading" data-reveal>
          <span className="landing-eyebrow">Alcance del cálculo</span>
          <h2>Una estimación armada con los datos de tu operación</h2>
          <p>
            Estos son los componentes que la interfaz permite ingresar y revisar
            en el resultado.
          </p>
        </div>
        <div className="components-grid">
          <article data-reveal>
            <span>01</span>
            <h3>Valor de la compra</h3>
            <p>
              Precio FOB, costo de envío, seguro, cantidad y tipo de cambio
              informado o consultado en la herramienta.
            </p>
          </article>
          <article data-reveal>
            <span>02</span>
            <h3>Tributos y escenarios</h3>
            <p>
              Detalle de tributos por régimen cuando está disponible, escenarios
              mínimo y conservador, y comparación de elegibilidad.
            </p>
          </article>
          <article data-reveal>
            <span>03</span>
            <h3>Condiciones declaradas</h3>
            <p>
              Incluye opciones para indicar envío DDP, organismo externo, NCM y
              alícuotas cuando contás con esos datos.
            </p>
          </article>
        </div>
        <p className="landing-limit-note">
          <CircleHelp size={18} />
          <span>
            <strong>Una referencia para planificar.</strong> Pueden faltar
            cargos del courier, almacenaje, servicios u otros costos. Las tasas,
            topes y requisitos dependen de la normativa vigente; verificá la
            operación con tu courier o despachante.
          </span>
        </p>
      </section>

      <section className="landing-faq landing-section" id="preguntas">
        <div className="landing-faq-heading" data-reveal>
          <span className="landing-eyebrow">Preguntas frecuentes</span>
          <h2>Información para usarla con criterio</h2>
          <p>Conocé el alcance de la estimación antes de tomar una decisión.</p>
        </div>
        <div className="landing-faq-list">
          {preguntas.map(({ q, a }) => (
            <details className="landing-faq-item" key={q} data-reveal>
              <summary>
                {q}
                <ChevronDown size={18} />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-final-cta" data-reveal>
        <div>
          <span className="landing-eyebrow">El próximo paso es tuyo</span>
          <h2>Tu próxima importación empieza con mejores datos.</h2>
          <p>
            Ingresá tu cotización y explorá la estimación para tu operación.
          </p>
        </div>
        <a className="landing-primary-button" href="/calculadora">
          Ir a la calculadora <ArrowRight size={17} />
        </a>
      </section>
    </div>
  );
}
