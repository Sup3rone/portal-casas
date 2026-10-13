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
    const reservation = container.querySelector<HTMLElement>('#reservar');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let previous = window.scrollY, frame = 0;
    let hidden = false, atTop = true, reservationNavigation = false;
    let navigationTimer: ReturnType<typeof setTimeout> | undefined;
    function show() { hidden = false; navbar!.classList.remove('detail-nav-hidden'); }
    function update() {
      frame = 0;
      const position = Math.max(0, window.scrollY);
      // Reserva y footer tienen scroll libre; restaurar snap al volver a las escenas.
      if (reservation && reservation.getBoundingClientRect().top <= window.innerHeight / 2) reservationNavigation = false;
      document.documentElement.classList.toggle('detail-free-scroll', reservationNavigation || Boolean(reservation && reservation.getBoundingClientRect().top <= window.innerHeight / 2));
      const delta = position - previous;
      atTop = position <= 4;
      const atEnd = position + window.innerHeight >= document.documentElement.scrollHeight - 4;
      navbar!.classList.toggle('detail-nav-top', atTop);
      if (motion.matches || atTop || atEnd || (navbar!.contains(document.activeElement) && document.activeElement?.matches(':focus-visible'))) show();
      else if (Math.abs(delta) >= 6) hidden = delta > 0;
      navbar!.classList.toggle('detail-nav-hidden', hidden);
      if (Math.abs(delta) >= 6 || atTop || atEnd) previous = position;
    }
    function reserve(event: MouseEvent) {
      if (!reservation || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element) || !event.target.closest('a[href="#reservar"]')) return;
      event.preventDefault();
      navigateReservation();
    }
    function navigateReservation() {
      if (!reservation) return;
      reservationNavigation = true;
      document.documentElement.classList.add('detail-free-scroll');
      window.history.replaceState(window.history.state, '', '#reservar');
      window.scrollTo({ top: Math.max(0, Math.ceil(window.scrollY + reservation.getBoundingClientRect().top)), behavior: motion.matches ? 'auto' : 'smooth' });
      clearTimeout(navigationTimer);
      navigationTimer = setTimeout(() => {
        // Corregir desplazamientos de layout durante la carga inicial del ancla.
        window.scrollTo({ top: Math.max(0, Math.ceil(window.scrollY + reservation.getBoundingClientRect().top)), behavior: 'auto' });
        reservationNavigation = false; update();
      }, 1200);
    }
    function cancelLanding() { clearTimeout(navigationTimer); reservationNavigation = false; }
    function hash() { if (window.location.hash === '#reservar') navigateReservation(); }
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
    resize.observe(navbar); measure(); viewport(); update(); hash();
    window.addEventListener('hashchange', hash);
    for (const event of ['wheel', 'touchstart', 'keydown', 'pointerdown']) window.addEventListener(event, cancelLanding, { passive: true });
    container.addEventListener('click', reserve);
    window.addEventListener('scroll', scroll, { passive: true });
    navbar.addEventListener('focusin', show);
    motion.addEventListener('change', update);
    window.visualViewport?.addEventListener('resize', viewport);
    window.visualViewport?.addEventListener('scroll', viewport);
    window.addEventListener('resize', viewport);
    window.addEventListener('resize', scroll);
    return () => {
      cancelAnimationFrame(frame); clearTimeout(navigationTimer); resize.disconnect(); classes?.disconnect();
      window.removeEventListener('hashchange', hash);
      for (const event of ['wheel', 'touchstart', 'keydown', 'pointerdown']) window.removeEventListener(event, cancelLanding);
      container.removeEventListener('click', reserve);
      window.removeEventListener('scroll', scroll); navbar.removeEventListener('focusin', show);
      motion.removeEventListener('change', update);
      window.visualViewport?.removeEventListener('resize', viewport);
      window.visualViewport?.removeEventListener('scroll', viewport);
      window.removeEventListener('resize', viewport);
      window.removeEventListener('resize', scroll);
      document.documentElement.classList.remove('detail-free-scroll');
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
