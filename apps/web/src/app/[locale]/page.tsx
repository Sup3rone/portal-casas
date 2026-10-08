// src/app/[locale]/page.tsx
import { getTranslations } from 'next-intl/server';
import Reveal from '@/components/Reveal';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return (
    <main>
      {/* HERO con video de fondo */}
      <section className="relative h-screen min-h-[600px]">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>

        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />

        {/* Contenido centrado */}
        <Reveal className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <h1 className="mb-4 text-4xl font-light tracking-[0.3em] text-white dark:text-gray-100 md:text-6xl">
            {t('bienvenida')}
          </h1>
          <h2 className="mb-12 text-2xl font-light tracking-[0.25em] text-white/90 dark:text-gray-200 md:text-3xl">
            {t('propiedadesEnRenta')}
          </h2>

          {/* Widget de búsqueda flotante */}
          <form
            action={`/${locale}/casas`}
            method="GET"
            className="glass-panel flex flex-wrap items-end justify-center gap-4 rounded-2xl p-6 shadow-2xl"
          >
            <div className="text-left">
              <label className="mb-1 block text-xs tracking-widest text-gray-600 dark:text-gray-300">
                {t('llegada')}
              </label>
              <input
                type="date"
                name="start"
                className="w-40 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-gray-900 dark:focus:border-green-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="text-left">
              <label className="mb-1 block text-xs tracking-widest text-gray-600 dark:text-gray-300">
                {t('salida')}
              </label>
              <input
                type="date"
                name="end"
                className="w-40 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-gray-900 dark:focus:border-green-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            <div className="text-left">
              <label className="mb-1 block text-xs tracking-widest text-gray-600 dark:text-gray-300">
                {t('huespedes')}
              </label>
              <select
                name="guests"
                className="w-32 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-gray-900 dark:focus:border-green-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">{t('cualquiera')}</option>
                {[1, 2, 3, 4, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-black dark:bg-green-700 px-8 py-2.5 text-sm font-semibold tracking-widest text-white dark:text-gray-100 transition hover:bg-gray-800 dark:hover:bg-green-600"
            >
              {t('buscar')}
            </button>
          </form>
        </Reveal>
      </section>
    </main>
  );
}
