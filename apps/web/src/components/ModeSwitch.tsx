'use client';
// T-5210: switch «Usuario | Vendedor». El Navbar solo lo monta para ADMIN y COLLABORATOR, y aquí solo se ve en la
// APP INSTALADA (isInstalledApp); en la computadora o el navegador normal no aparece. Cambiar de modo lleva al inicio
// del otro y lo recuerda en la cookie alia_mode (la lee la entrada /app). No es un permiso: el panel sigue protegido.
import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { MODE_COOKIE, isInstalledApp, modeTarget, type AppWindow, type Mode } from '../lib/vendor-mode';

const pill = 'flex min-h-9 items-center rounded-full px-3';
const noop = () => () => {};

export function ModeSwitchView({ pathname, locale }: { pathname: string; locale: string }) {
  const t = useTranslations('vendor');
  const { mode, target } = modeTarget(pathname);
  const other: Mode = mode === 'vendor' ? 'user' : 'vendor';
  const remember = () => { document.cookie = `${MODE_COOKIE}=${other}; path=/; max-age=31536000; samesite=lax`; };
  return <div data-mode-switch="" role="group" aria-label={t('modeLabel')}
    className="inline-flex shrink-0 items-center rounded-full border border-gray-200 p-0.5 text-xs font-semibold dark:border-gray-700">
    {(['user', 'vendor'] as const).map(value => value === mode
      ? <span key={value} aria-current="page" className={`${pill} bg-green-700 text-white`}>{value === 'user' ? t('modeUser') : t('modeVendor')}</span>
      : <a key={value} href={target === '/' ? `/${locale}` : `/${locale}${target}`} onClick={remember}
          className={`${pill} text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-green-700 dark:text-gray-200 dark:hover:bg-gray-800`}>{value === 'user' ? t('modeUser') : t('modeVendor')}</a>)}
  </div>;
}

export default function ModeSwitch(props: { pathname: string; locale: string }) {
  // En el servidor no se sabe si es la app: oculto (sin parpadeo en la computadora); en el navegador se lee al hidratar.
  const installed = useSyncExternalStore(noop, () => isInstalledApp(window as unknown as AppWindow), () => false);
  return installed ? <ModeSwitchView {...props} /> : <span data-mode-switch-slot="" hidden />;
}
