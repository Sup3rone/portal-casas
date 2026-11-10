// T-4719: 404 de marca. Se muestra con notFound() (ficha no publicada) y con
// cualquier URL sin ruta, vía [locale]/[...rest]. Navbar y Footer vienen del layout.
// Elemento único: placa de número de casa con «404»; el resto, sobrio.
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

const action = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-colors '
  + 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-action-border)] motion-reduce:transition-none';

export default async function NotFound() {
  const t = await getTranslations('notFoundPage');
  return (
    <main className="public-paper relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-24 text-[var(--paper-text)] sm:px-6" data-not-found>
      <title>{`${t('title')} | Portal Casas`}</title>
      <div className="flex w-full max-w-xl flex-col items-center text-center">
        {/* Decorativa: el mensaje real es el h1. */}
        <div aria-hidden="true"
          className="relative mb-12 rounded-md border-2 border-[var(--brand-brown)] bg-[var(--brand-brown-soft)] px-10 pb-5 pt-6 shadow-[0_1px_0_var(--brand-brown-light),inset_0_0_0_6px_var(--brand-brown-soft),inset_0_0_0_7px_var(--brand-brown-light)] dark:border-[var(--brand-brown-light)] dark:bg-[color-mix(in_srgb,var(--brand-brown)_45%,var(--paper-bg))] dark:shadow-[inset_0_0_0_6px_transparent,inset_0_0_0_7px_color-mix(in_srgb,var(--brand-brown-light)_45%,transparent)]">
          {['left-2 top-2', 'right-2 top-2', 'bottom-2 left-2', 'bottom-2 right-2'].map(corner => (
            <span key={corner} className={`absolute ${corner} size-1.5 rounded-full bg-[var(--brand-brown)] opacity-60 dark:bg-[var(--brand-brown-light)]`} />
          ))}
          <span className="block font-[family-name:var(--font-heading)] text-7xl leading-none tracking-[0.12em] text-[var(--brand-brown-strong)] tabular-nums sm:text-8xl dark:text-[var(--brand-brown-light)]">404</span>
        </div>
        <h1 className="text-balance text-3xl leading-tight sm:text-4xl">{t('heading')}</h1>
        <p className="mt-5 max-w-[46ch] text-pretty text-base leading-relaxed text-[color-mix(in_srgb,var(--paper-text)_82%,var(--paper-bg))]">{t('body')}</p>
        <nav className="mt-10 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Link href="/casas" className={`${action} bg-[var(--brand-action)] text-[var(--brand-action-ink)] hover:bg-[var(--brand-action-hover)]`}>{t('listing')}</Link>
          <Link href="/" className={`${action} border border-[var(--brand-action-border)] text-[var(--paper-text)] hover:bg-[var(--brand-action-surface)] hover:text-[var(--brand-action-ink)] dark:border-[var(--brand-action)] dark:hover:bg-[color-mix(in_srgb,var(--brand-action)_18%,var(--paper-bg))] dark:hover:text-[var(--paper-text)]`}>{t('home')}</Link>
        </nav>
      </div>
    </main>
  );
}
