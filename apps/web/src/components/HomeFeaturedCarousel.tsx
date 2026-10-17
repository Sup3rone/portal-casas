'use client';

import { Children, useEffect, useRef, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

// Solo recorrido: las tarjetas siguen siendo los mismos HomeFeaturedLink.
export default function HomeFeaturedCarousel({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  const root = useRef<HTMLDivElement>(null), track = useRef<HTMLDivElement>(null);
  const t = useTranslations('details.gallery');
  const title = useTranslations('siteContent');
  function move(direction: number) {
    const element = track.current;
    if (!element) return;
    const visible = window.matchMedia('(min-width: 1024px)').matches ? 3 : 1;
    const max = Math.max(0, items.length - visible);
    const step = (element.children[1] as HTMLElement | undefined)?.offsetLeft ?? element.clientWidth;
    const current = Math.round(element.scrollLeft / Math.max(1, step));
    const next = current + direction > max ? 0 : current + direction < 0 ? max : current + direction;
    element.scrollTo({ left: (element.children[next] as HTMLElement)?.offsetLeft || 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  // Con <=3 no hay autoplay, incluso en móvil; flechas móviles dan acceso al resto.
  useEffect(() => {
    if (items.length <= 3) return;
    const element = root.current;
    const timer = window.setInterval(() => {
      if (!element || document.hidden || element.matches(':hover') || element.contains(document.activeElement)
        || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = element.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const rail = track.current;
        if (!rail) return;
        const visible = window.matchMedia('(min-width: 1024px)').matches ? 3 : 1;
        const step = (rail.children[1] as HTMLElement | undefined)?.offsetLeft ?? rail.clientWidth;
        const next = Math.round(rail.scrollLeft / Math.max(1, step)) + 1;
        rail.scrollTo({ left: next > items.length - visible ? 0 : (rail.children[next] as HTMLElement).offsetLeft, behavior: 'smooth' });
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [items.length]);
  return <div ref={root} role="region" aria-label={title('featuredTitle')} className="home-featured-carousel">
    <div ref={track} className="home-featured-track">
      {items.map((item, index) => <div key={index} className="home-featured-item">{item}</div>)}
    </div>
    {items.length > 1 && <div className={`home-featured-carousel-controls${items.length <= 3 ? ' home-featured-mobile-controls' : ''}`}>
      <button type="button" onClick={() => move(-1)} aria-label={t('anterior')}>‹</button>
      <button type="button" onClick={() => move(1)} aria-label={t('siguiente')}>›</button>
    </div>}
  </div>;
}
