'use client';
// T-5210: switch «Usuario | Vendedor» (solo lo pinta el Navbar para ADMIN y COLLABORATOR). Salta a la página
// equivalente del otro modo y recuerda la elección en la cookie alia_mode (la lee la entrada /app de la PWA).
// No es un permiso: el panel sigue protegido en el servidor.
import { useTranslations } from 'next-intl';
import { MODE_COOKIE, modeTarget, type Mode } from '../lib/vendor-mode';

const pill = 'flex min-h-9 items-center rounded-full px-3';

export default function ModeSwitch({ pathname, locale }: { pathname: string; locale: string }) {
  const t = useTranslations('vendor');
  const { mode, target } = modeTarget(pathname, '');
  const other: Mode = mode === 'vendor' ? 'user' : 'vendor';
  const option = (value: Mode) => value === 'user' ? t('modeUser') : t('modeVendor');
  function go(event: React.MouseEvent<HTMLAnchorElement>) {
    document.cookie = `${MODE_COOKIE}=${other}; path=/; max-age=31536000; samesite=lax`;
    // Con la query actual (fechas, huéspedes, destino), que el render del servidor no conoce.
    event.currentTarget.href = `/${locale}${modeTarget(window.location.pathname, window.location.search).target}`;
  }
  return <div data-mode-switch="" role="group" aria-label={t('modeLabel')}
    className="inline-flex shrink-0 items-center rounded-full border border-gray-200 p-0.5 text-xs font-semibold dark:border-gray-700">
    {(['user', 'vendor'] as const).map(value => value === mode
      ? <span key={value} aria-current="page" className={`${pill} bg-green-700 text-white`}>{option(value)}</span>
      : <a key={value} href={`/${locale}${target}`} onClick={go} className={`${pill} text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-green-700 dark:text-gray-200 dark:hover:bg-gray-800`}>{option(value)}</a>)}
  </div>;
}
