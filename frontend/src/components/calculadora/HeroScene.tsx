import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import { Check } from 'lucide-react';
import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import isotipoBlanco from '@/assets/totalimport-logos/svg/isotipo-monocromo-azul-marino.svg';
import './HeroScene.css';

gsap.registerPlugin(useGSAP, ScrollTrigger, MotionPathPlugin);

const HERO_MOTION = {
  routeDuration: 6,
  stampInAt: 3.7,
  stampOutAt: 5.35,
  ticketEnterDuration: 0.75,
  copyEnterDuration: 0.58,
  copyEnterOffset: 16,
  ticketEnterOffset: 22,
  copyExitOffset: -12,
  desktopTilt: 3.2,
  desktopLift: 17,
  mobileLift: 9,
  marqueeDuration: 38,
  backdropRouteDuration: 24,
  backdropPlaneDuration: 19,
  backdropPackageDuration: 8,
  backdropShipDuration: 13,
  backdropDriftX: 18,
  backdropDriftY: -11,
  backdropPlaneDriftX: 42,
  backdropPlaneDriftY: -24,
  backdropPackageDriftY: -15,
  backdropScrollY: -24,
  backdropFarScrollX: 16,
  backdropFarScrollY: -40,
  backdropNearScrollX: -11,
  backdropNearScrollY: 48,
};

const EXAMPLE_COSTS = [
  { label: 'Producto', value: 2500, accessible: 'dos mil quinientos dólares' },
  { label: 'Envío', value: 350, accessible: 'trescientos cincuenta dólares' },
  { label: 'Derechos', value: 875, accessible: 'ochocientos setenta y cinco dólares' },
  { label: 'Tasa estadística', value: 96, accessible: 'noventa y seis dólares' },
  { label: 'IVA', value: 802, accessible: 'ochocientos dos dólares' },
];
const EXAMPLE_TOTAL = EXAMPLE_COSTS.reduce((total, cost) => total + cost.value, 0);

const MARQUEE_ITEMS = [
  'Tipo de cambio',
  'Derechos',
  'IVA',
  'Tasa estadística',
  'Percepciones',
  'Valor FOB',
  'Peso',
  'Courier o carga',
  'Posición arancelaria',
  'Régimen',
];

function formatearMonto(valor: number) {
  return `USD ${Math.round(valor).toLocaleString('es-AR')}`;
}

function HeroBackdrop() {
  return (
    <div className="hero-ticket-backdrop-elements">
      <div className="hero-backdrop-grid" />
      <div className="hero-backdrop-depth" data-hero-parallax data-scroll-x={HERO_MOTION.backdropFarScrollX} data-scroll-y={HERO_MOTION.backdropFarScrollY}>
        <svg className="hero-backdrop-route" viewBox="0 0 560 420" fill="none">
          <path d="M22 335C130 312 119 178 250 190S376 288 533 52" />
          <circle cx="22" cy="335" r="5" />
          <circle cx="533" cy="52" r="5" />
        </svg>
        <svg className="hero-backdrop-plane" viewBox="0 0 120 54" fill="none">
          <path d="M4 38h44" />
          <path d="m53 33 15-3L89 9c2-2 6-1 5 2L84 29l23 1c4 0 5 5 1 6l-28 5-14 10c-3 2-6 0-5-3l5-8-14 2-7 5c-2 1-4 0-3-3l5-7-3-2c-2-1-1-3 1-3l8 1Z" />
        </svg>
        <img className="hero-backdrop-globe" src={isotipoBlanco} alt="" />
      </div>
      <div className="hero-backdrop-depth" data-hero-parallax data-scroll-x={HERO_MOTION.backdropNearScrollX} data-scroll-y={HERO_MOTION.backdropNearScrollY}>
        <span className="hero-backdrop-package hero-backdrop-package-one" />
        <span className="hero-backdrop-package hero-backdrop-package-two" />
        <svg className="hero-backdrop-ship" viewBox="0 0 220 92" fill="none">
          <path d="M8 51h198l-18 23c-5 6-12 9-20 9H45c-9 0-17-5-22-12L8 51Z" />
          <path d="M39 30h38v20H39zM82 30h38v20H82zM61 8h38v20H61zM125 30h35v20h-35z" />
          <path d="M0 88c20 0 20-6 40-6s20 6 40 6 20-6 40-6 20 6 40 6 20-6 40-6 20 6 40 6" />
        </svg>
      </div>
    </div>
  );
}

function TicketAmount({ value, accessible }: { value: number; accessible: string }) {
  return (
    <>
      <span className="hero-ticket-amount" data-ticket-counter={value} aria-hidden="true">
        {formatearMonto(value)}
      </span>
      <span className="sr-only">{accessible}</span>
    </>
  );
}

interface TicketAnimationRefs {
  ticket: RefObject<HTMLElement | null>;
  route: RefObject<SVGPathElement | null>;
  parcel: RefObject<SVGGElement | null>;
  stamp: RefObject<HTMLDivElement | null>;
}

function RouteAnimation({ route, parcel }: Pick<TicketAnimationRefs, 'route' | 'parcel'>) {
  return (
    <div className="hero-ticket-route" aria-hidden="true">
      <span className="hero-ticket-origin">CN</span>
      <svg viewBox="0 0 420 78" fill="none">
        <path ref={route} className="hero-ticket-route-path" d="M22 58C110 58 112 14 210 20S310 64 398 18" />
        <circle cx="22" cy="58" r="5" />
        <circle cx="398" cy="18" r="5" />
        <g ref={parcel} className="hero-ticket-package" transform="translate(22 58)">
          <path d="m-10-8 10-5 10 5v12L0 9l-10-5V-8Z" />
          <path d="M0-13v12m-10-7L0-3l10-5" />
        </g>
      </svg>
      <span className="hero-ticket-destination">AR</span>
    </div>
  );
}

function HeroTicket({ ticket, route, parcel, stamp }: TicketAnimationRefs) {
  return (
    <article className="hero-ticket" ref={ticket} aria-label="Ejemplo ilustrativo de desglose de costos de importación">
      <header className="hero-ticket-header">
        <span>ENVÍO #AR-2048</span>
        <span>SHENZHEN <b aria-hidden="true">→</b> BS. AS.</span>
      </header>
      <div className="hero-ticket-stamp" ref={stamp}>
        <Check size={13} strokeWidth={3} aria-hidden="true" /> ADUANA
      </div>
      <RouteAnimation route={route} parcel={parcel} />
      <dl className="hero-ticket-costs">
        {EXAMPLE_COSTS.map(({ label, value, accessible }) => (
          <div className="hero-ticket-cost-row" key={label}>
            <dt>{label}</dt>
            <dd><TicketAmount value={value} accessible={accessible} /></dd>
          </div>
        ))}
      </dl>
      <div className="hero-ticket-total">
        <span>COSTO FINAL ESTIMADO</span>
        <strong className="hero-ticket-total-amount" data-ticket-counter={EXAMPLE_TOTAL} aria-hidden="true">
          {formatearMonto(EXAMPLE_TOTAL)}
        </strong>
        <span className="sr-only">{EXAMPLE_TOTAL.toLocaleString('es-AR')} dólares estadounidenses</span>
      </div>
      <p className="hero-ticket-caption">Ejemplo ilustrativo</p>
    </article>
  );
}

export function HeroScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const ticketScrollRef = useRef<HTMLDivElement>(null);
  const ticketRef = useRef<HTMLElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const packageRef = useRef<SVGGElement>(null);
  const stampRef = useRef<HTMLDivElement>(null);
  const ambientRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const hero = scene.closest<HTMLElement>('.landing-hero') ?? scene;
    if (!('IntersectionObserver' in window)) {
      hero.classList.add('is-ticket-visible');
      ambientRef.current?.play();
      return () => hero.classList.remove('is-ticket-visible');
    }
    const observer = new IntersectionObserver(([entry]) => {
      hero.classList.toggle('is-ticket-visible', entry.isIntersecting);
      ambientRef.current?.paused(!entry.isIntersecting);
    }, { threshold: 0.01 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useGSAP(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const hero = scene.closest<HTMLElement>('.landing-hero');
    const ticketScroll = ticketScrollRef.current;
    const backdrop = backdropRef.current;
    const ticket = ticketRef.current;
    const route = routeRef.current;
    const parcel = packageRef.current;
    const stamp = stampRef.current;
    if (!scene || !hero || !ticketScroll || !ticket || !backdrop || !route || !parcel || !stamp) return;

    const media = gsap.matchMedia();
    const counters = gsap.utils.toArray<HTMLElement>('[data-ticket-counter]', scene);
    const copyNodes = hero.querySelectorAll<HTMLElement>('[data-hero-copy]');
    const copyBlock = hero.querySelector<HTMLElement>('.landing-hero-copy');
    const parallaxLayers = gsap.utils.toArray<HTMLElement>('[data-hero-parallax]', backdrop);

    const addMotion = (query: string, isMobile = false) => {
      media.add(query, () => {
        gsap.fromTo(ticket, { autoAlpha: 0, y: HERO_MOTION.ticketEnterOffset, rotate: -1.5 }, {
          autoAlpha: 1,
          y: 0,
          rotate: 0,
          duration: HERO_MOTION.ticketEnterDuration,
          ease: 'power2.out',
          clearProps: 'transform',
        });

        gsap.fromTo(copyNodes, { autoAlpha: 0, y: HERO_MOTION.copyEnterOffset }, {
          autoAlpha: 1,
          y: 0,
          duration: HERO_MOTION.copyEnterDuration,
          stagger: 0.09,
          ease: 'power2.out',
          clearProps: 'transform',
        });

        counters.forEach((node, index) => {
          const target = Number(node.dataset.ticketCounter);
          const count = { value: 0 };
          gsap.to(count, {
            value: target,
            duration: 0.75,
            delay: 0.2 + index * 0.08,
            ease: 'power1.out',
            onUpdate: () => { node.textContent = formatearMonto(count.value); },
          });
        });

        const ambient = gsap.timeline({ repeat: -1, paused: true });
        ambientRef.current = ambient;
        ambient.to(parcel, {
          duration: HERO_MOTION.routeDuration,
          ease: 'none',
          motionPath: {
            path: route,
            align: route,
            alignOrigin: [0.5, 0.5],
            start: 0,
            end: 1,
          },
        }, 0);
        ambient.set(stamp, { autoAlpha: 0, scale: 0.78, rotate: -18 }, 0);
        ambient.to(stamp, {
          autoAlpha: 0.68,
          scale: 1,
          rotate: -12,
          duration: 0.55,
          ease: 'power2.out',
        }, HERO_MOTION.stampInAt);
        ambient.to(stamp, { autoAlpha: 0, duration: 0.65, ease: 'power1.inOut' }, HERO_MOTION.stampOutAt);
        ambient.play();

        if (hero) {
          if (copyBlock) gsap.to(copyBlock, {
            autoAlpha: 0,
            y: HERO_MOTION.copyExitOffset,
            ease: 'none',
            scrollTrigger: {
              trigger: hero,
              start: 'top top-=120',
              end: 'bottom top',
              scrub: 0.65,
            },
          });

          gsap.fromTo(ticketScroll, {
            y: 0,
            rotateY: 0,
            rotateX: 0,
            transformPerspective: 900,
          }, {
            y: isMobile ? -HERO_MOTION.mobileLift : -HERO_MOTION.desktopLift,
            rotateY: isMobile ? 0 : -HERO_MOTION.desktopTilt,
            rotateX: isMobile ? 0 : 1,
            ease: 'none',
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.7,
            },
          });

          gsap.to(backdrop, {
            y: HERO_MOTION.backdropScrollY,
            ease: 'none',
            scrollTrigger: {
              trigger: hero,
              start: 'top top',
              end: 'bottom top',
              scrub: 0.8,
            },
          });

          parallaxLayers.forEach((layer) => {
            gsap.to(layer, {
              x: Number(layer.dataset.scrollX ?? 0),
              y: Number(layer.dataset.scrollY ?? 0),
              ease: 'none',
              scrollTrigger: {
                trigger: hero,
                start: 'top top',
                end: 'bottom top',
                scrub: 0.9,
              },
            });
          });
        }

        return () => {
          ambientRef.current = null;
          ambient.kill();
        };
      });
    };

    addMotion('(min-width: 900px) and (prefers-reduced-motion: no-preference)');
    addMotion('(max-width: 899px) and (prefers-reduced-motion: no-preference)', true);
    media.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set([ticket, ticketScroll, stamp], { autoAlpha: 1, clearProps: 'transform' });
    });

    return () => media.revert();
  }, { scope: sceneRef });

  return (
    <div className="landing-hero-art" ref={sceneRef} style={{
      '--hero-marquee-duration': `${HERO_MOTION.marqueeDuration}s`,
      '--hero-backdrop-route-duration': `${HERO_MOTION.backdropRouteDuration}s`,
      '--hero-backdrop-plane-duration': `${HERO_MOTION.backdropPlaneDuration}s`,
      '--hero-backdrop-package-duration': `${HERO_MOTION.backdropPackageDuration}s`,
      '--hero-backdrop-ship-duration': `${HERO_MOTION.backdropShipDuration}s`,
      '--hero-backdrop-drift-x': `${HERO_MOTION.backdropDriftX}px`,
      '--hero-backdrop-drift-y': `${HERO_MOTION.backdropDriftY}px`,
      '--hero-backdrop-plane-drift-x': `${HERO_MOTION.backdropPlaneDriftX}px`,
      '--hero-backdrop-plane-drift-y': `${HERO_MOTION.backdropPlaneDriftY}px`,
      '--hero-backdrop-package-drift-y': `${HERO_MOTION.backdropPackageDriftY}px`,
    } as CSSProperties}>
      <div className="hero-ticket-backdrop" ref={backdropRef} aria-hidden="true">
        <HeroBackdrop />
      </div>
      <div className="hero-ticket-scroll" ref={ticketScrollRef}>
        <HeroTicket ticket={ticketRef} route={routeRef} parcel={packageRef} stamp={stampRef} />
      </div>
    </div>
  );
}

export function HeroMarquee() {
  return (
    <div className="landing-hero-marquee" style={{ '--hero-marquee-duration': `${HERO_MOTION.marqueeDuration}s` } as CSSProperties} role="group" aria-label="Conceptos incluidos en el cálculo">
      <span className="sr-only">{MARQUEE_ITEMS.join(' · ')}</span>
      <div className="hero-marquee-viewport" aria-hidden="true">
        <div className="hero-marquee-track">
          {[0, 1].map((copy) => (
            <div className="hero-marquee-group" key={copy}>
              {MARQUEE_ITEMS.map((item) => (
                <span className="hero-marquee-item" key={`${copy}-${item}`}>
                  {item}<b>✦</b>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HeroScene;
