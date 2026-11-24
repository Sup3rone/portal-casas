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
  return <button type="button" role="switch" aria-checked={on} data-mode-switch="" data-target={href} onClick={toggle}
    className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-full px-1 text-sm font-semibold text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 dark:text-gray-100">
    {/* En el teléfono solo el interruptor (la fila del header no cabe con el texto); el nombre sigue para lectores. */}
    <span className="max-sm:sr-only">{t('modeSwitch')}</span>
    <span aria-hidden="true" className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${on ? 'bg-green-700' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left] duration-200 ${on ? 'left-[1.375rem]' : 'left-0.5'}`} />
    </span>
  </button>;
}

export default function ModeSwitch(props: { pathname: string; locale: string }) {
  // En el servidor no se sabe si es la app: oculto (sin parpadeo en la computadora); en el navegador se lee al hidratar.
  const installed = useSyncExternalStore(noop, () => isInstalledApp(window as unknown as AppWindow), () => false);
  return installed ? <ModeSwitchView {...props} /> : <span data-mode-switch-slot="" hidden />;
}
