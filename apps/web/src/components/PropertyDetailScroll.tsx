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
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let previous = window.scrollY, frame = 0;
    let hidden = false, atTop = true;
    function show() { hidden = false; navbar!.classList.remove('detail-nav-hidden'); }
    function update() {
      frame = 0;
      const position = Math.max(0, window.scrollY);
      const delta = position - previous;
      atTop = position <= 4;
      const atEnd = position + window.innerHeight >= document.documentElement.scrollHeight - 4;
      navbar!.classList.toggle('detail-nav-top', atTop);
      if (motion.matches || atTop || atEnd || (navbar!.contains(document.activeElement) && document.activeElement?.matches(':focus-visible'))) show();
      else if (Math.abs(delta) >= 6) hidden = delta > 0;
      navbar!.classList.toggle('detail-nav-hidden', hidden);
      if (Math.abs(delta) >= 6 || atTop || atEnd) previous = position;
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
    navbar.addEventListener('focusin', show);
    motion.addEventListener('change', update);
    window.visualViewport?.addEventListener('resize', viewport);
    window.visualViewport?.addEventListener('scroll', viewport);
    window.addEventListener('resize', viewport);
    return () => {
      cancelAnimationFrame(frame); resize.disconnect(); classes?.disconnect();
      window.removeEventListener('scroll', scroll); navbar.removeEventListener('focusin', show);
      motion.removeEventListener('change', update);
      window.visualViewport?.removeEventListener('resize', viewport);
      window.visualViewport?.removeEventListener('scroll', viewport);
      window.removeEventListener('resize', viewport);
      navbar.classList.remove('detail-nav-hidden', 'detail-nav-top');
    };
  }, []);

  function backToTop() {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  return <>
    <main ref={root} className="property-detail" tabIndex={-1}>{children}</main>
    <button ref={topButton} type="button" onClick={backToTop} className="detail-back-top" aria-label={t('backToTop')} title={t('backToTop')}>
      <span aria-hidden="true">↑</span>
    </button>
  </>;
}
