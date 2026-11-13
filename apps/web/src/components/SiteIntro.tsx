'use client';
// T-4835: animación de la primera carga. El emblema aparece al centro, «ALIA FOR RENT» sube letra por letra y
// el papel se abre en círculo desde la espiral. Toda la secuencia es CSS (app/site-loader.css): corre desde el
// primer pintado, sin esperar a la hidratación, y nunca bloquea clics (pointer-events: none).
// Una vez por visita: el script en línea de layout.tsx (SITE_INTRO_SKIP) la oculta antes de pintar si ya se vio;
// aquí solo se marca como vista cuando termina. Solo en home, listado y detalle; el panel no la muestra.
import { useEffect, useRef, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { Marcellus } from 'next/font/google';
import { SITE_INTRO_KEY, SITE_INTRO_PATH, SITE_INTRO_SEEN_CLASS } from '@/lib/site-intro';

const logoFont = Marcellus({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-logo-family' });

const WORD = 'ALIA FOR RENT';

export default function SiteIntro() {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const show = SITE_INTRO_PATH.test(pathname ?? '');

  useEffect(() => {
    const root = document.documentElement, element = ref.current;
    if (!element || root.classList.contains(SITE_INTRO_SEEN_CLASS)) return;
    const done = (event: AnimationEvent) => {
      if (event.target !== element || event.animationName !== 'site-intro-gone') return;
      root.classList.add(SITE_INTRO_SEEN_CLASS);
      try { sessionStorage.setItem(SITE_INTRO_KEY, '1'); } catch {}
    };
    element.addEventListener('animationend', done);
    return () => element.removeEventListener('animationend', done);
  }, [show]);

  if (!show) return null;
  let letter = 0;
  return (
    <div ref={ref} className={`site-intro ${logoFont.variable}`} aria-hidden="true">
      <div className="site-intro-mark">
        <span className="site-intro-emblem" />
        <span className="site-intro-word brand-wordmark">
          {WORD.split('').map((char, index) => char === ' '
            ? <span key={index} className="site-intro-space" />
            : <span key={index} className={index >= 5 && index <= 7 ? 'site-intro-for' : undefined}
                style={{ '--i': letter++ } as CSSProperties}>{char}</span>)}
        </span>
      </div>
    </div>
  );
}
