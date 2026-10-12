'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';

export default function PropertyDetailScroll({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const topButton = useRef<HTMLButtonElement>(null);
  const t = useTranslations('details');
  useEffect(() => {
    const container = root.current;
    const navbar = document.querySelector<HTMLElement>('body > nav');
    if (!container || !navbar) return;
    const scroller = container.querySelector?.<HTMLElement>('.detail-snap-container');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let previousOuter = window.scrollY, previousInner = scroller?.scrollTop || 0, frame = 0;
    let hidden = false, atTop = true;
    function show() { hidden = false; navbar!.classList.remove('detail-nav-hidden'); }
    function update() {
      frame = 0;
      const outer = Math.max(0, window.scrollY), inner = Math.max(0, scroller?.scrollTop || 0);
      const outerDelta = outer - previousOuter, innerDelta = inner - previousInner;
      const delta = Math.abs(outerDelta) >= 6 ? outerDelta : innerDelta;
      atTop = outer <= 4 && inner <= 4;
      navbar!.classList.toggle('detail-nav-top', atTop);
      if (motion.matches || atTop || (navbar!.contains(document.activeElement) && document.activeElement?.matches(':focus-visible'))) show();
      else if (Math.abs(delta) >= 6) hidden = delta > 0;
      navbar!.classList.toggle('detail-nav-hidden', hidden);
      if (Math.abs(outerDelta) >= 6 || atTop) previousOuter = outer;
      if (Math.abs(innerDelta) >= 6 || atTop) previousInner = inner;
    }
    function scroll() { if (!frame) frame = requestAnimationFrame(update); }
    function measure() { container!.style.setProperty('--detail-nav-height', `${navbar!.getBoundingClientRect().height}px`); }
    function viewport() {
      const view = window.visualViewport;
      container!.style.setProperty('--detail-viewport-height', `${view?.height ?? window.innerHeight}px`);
      const offset = view ? Math.max(0, window.innerHeight - view.height - view.offsetTop) : 0;
      topButton.current?.style.setProperty('--detail-keyboard-offset', `${offset}px`);
    }
    // React puede reescribir className de la navbar al cambiar sesión/tema.
    const classes = typeof MutationObserver === 'undefined' ? null : new MutationObserver(() => {
      if (navbar!.classList.contains('detail-nav-hidden') !== hidden) navbar!.classList.toggle('detail-nav-hidden', hidden);
      if (navbar!.classList.contains('detail-nav-top') !== atTop) navbar!.classList.toggle('detail-nav-top', atTop);
    });
    classes?.observe(navbar, { attributes: true, attributeFilter: ['class'] });
    const resize = new ResizeObserver(measure);
    resize.observe(navbar); measure(); viewport(); update();
    window.addEventListener('scroll', scroll, { passive: true });
    scroller?.addEventListener('scroll', scroll, { passive: true });
    navbar.addEventListener('focusin', show);
    motion.addEventListener('change', update);
    window.visualViewport?.addEventListener('resize', viewport);
    window.visualViewport?.addEventListener('scroll', viewport);
    window.addEventListener('resize', viewport);
    return () => {
      cancelAnimationFrame(frame); resize.disconnect(); classes?.disconnect();
      scroller?.removeEventListener('scroll', scroll);
      window.removeEventListener('scroll', scroll); navbar.removeEventListener('focusin', show);
      motion.removeEventListener('change', update);
      window.visualViewport?.removeEventListener('resize', viewport);
      window.visualViewport?.removeEventListener('scroll', viewport);
      window.removeEventListener('resize', viewport);
      navbar.classList.remove('detail-nav-hidden', 'detail-nav-top');
    };
  }, []);

  function backToTop() {
    root.current?.querySelector?.<HTMLElement>('.detail-snap-container')?.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  return <>
    <main ref={root} className="property-detail" tabIndex={-1}>{children}</main>
    <button ref={topButton} type="button" onClick={backToTop} className="detail-back-top" aria-label={t('backToTop')} title={t('backToTop')}>
      <span aria-hidden="true">↑</span>
    </button>
  </>;
}
