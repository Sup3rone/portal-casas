// src/app/[locale]/page.tsx
import { getTranslations } from 'next-intl/server';

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
        <div className="absolute inset-0 bg-black/40" />

        {/* Contenido centrado */}
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <h1 className="mb-4 text-4xl font-light tracking-[0.3em] text-white md:text-6xl">
            {t('bienvenida')}
          </h1>
          <h2 className="mb-12 text-2xl font-light tracking-[0.25em] text-white/90 md:text-3xl">
            {t('propiedadesEnRenta')}
          </h2>

          {/* Widget de búsqueda flotante */}
          <form
            action={`/${locale}/casas`}
            method="GET"
            className="glass-panel flex flex-wrap items-end justify-center gap-4 rounded-2xl p-6 shadow-2xl"
          >
            <div className="text-left">
              <label className="mb-1 block text-xs tracking-widest text-gray-600">
                {t('llegada')}
              </label>
              <input
                type="date"
                name="start"
                className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div className="text-left">
              <label className="mb-1 block text-xs tracking-widest text-gray-600">
                {t('salida')}
              </label>
              <input
                type="date"
                name="end"
                className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div className="text-left">
              <label className="mb-1 block text-xs tracking-widest text-gray-600">
                {t('huespedes')}
              </label>
              <select
                name="guests"
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
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
              className="rounded-lg bg-black px-8 py-2.5 text-sm font-semibold tracking-widest text-white transition hover:bg-gray-800"
            >
              {t('buscar')}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
