'use client';
// T-5210: switch «Usuario | Vendedor». El Navbar solo lo monta para ADMIN y COLLABORATOR, y aquí solo se ve en la
// APP INSTALADA (isInstalledApp); en la computadora o el navegador normal no aparece. Cambiar de modo lleva al inicio
// del otro y lo recuerda en la cookie alia_mode (la lee la entrada /app). No es un permiso: el panel sigue protegido.
import { useState, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { MODE_COOKIE, isInstalledApp, modeTarget, type AppWindow, type Mode } from '../lib/vendor-mode';

const noop = () => () => {};

/** Interruptor tipo iOS «Modo vendedor»: encendido = panel (vendedor), apagado = sitio normal (usuario). */
export function ModeSwitchView({ pathname, locale }: { pathname: string; locale: string }) {
  const t = useTranslations('vendor');
  const { mode, target } = modeTarget(pathname);
  const [on, setOn] = useState(mode === 'vendor');
  const href = target === '/' ? `/${locale}` : `/${locale}${target}`;
  function toggle() {
    const next: Mode = mode === 'vendor' ? 'user' : 'vendor';
    document.cookie = `${MODE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    setOn(value => !value); // la bolita se desliza y luego cambia de pantalla
    window.setTimeout(() => window.location.assign(href), 180);
  }
  // Interruptor con ícono de tienda en la bolita y el identificador SIEMPRE visible: «Vendedor» debajo en el teléfono
  // (la fila del header cabe en 360 px) y «Modo vendedor» al lado en pantallas grandes.
  return <button type="button" role="switch" aria-checked={on} aria-label={t('modeSwitch')} data-mode-switch="" data-target={href} onClick={toggle}
    className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-1 text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 max-sm:flex-col max-sm:gap-0.5 dark:text-gray-100">
    <span aria-hidden="true" className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${on ? 'bg-green-700' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <span className={`absolute top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-gray-700 shadow transition-[left] duration-200 ${on ? 'left-[1.375rem] text-green-700' : 'left-0.5'}`}>
        <svg data-mode-icon="" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M3 9l1.5-5h15L21 9" /><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" /><path d="M5 13v7h14v-7" /><path d="M10 20v-4h4v4" />
        </svg>
      </span>
    </span>
    <span aria-hidden="true" className="text-[11px] font-semibold leading-none sm:hidden">{t('modeShort')}</span>
    <span aria-hidden="true" className="text-sm font-semibold max-sm:hidden">{t('modeSwitch')}</span>
  </button>;
}

export default function ModeSwitch(props: { pathname: string; locale: string }) {
  // En el servidor no se sabe si es la app: oculto (sin parpadeo en la computadora); en el navegador se lee al hidratar.
  const installed = useSyncExternalStore(noop, () => isInstalledApp(window as unknown as AppWindow), () => false);
  return installed ? <ModeSwitchView {...props} /> : <span data-mode-switch-slot="" hidden />;
}
