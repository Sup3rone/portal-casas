// src/app/[locale]/page.tsx
import { getTranslations } from 'next-intl/server';
import Reveal from '@/components/Reveal';
import { readSiteContent } from '@/lib/site-content';
import HomeVideoMotion from '@/components/HomeVideoMotion';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const content = await readSiteContent();
  const about = content[locale === 'en' ? 'about_en' : locale === 'fr' ? 'about_fr' : 'about_es'];
  const social = await getTranslations({ locale, namespace: 'siteContent' });
  return (
    <main>
      {/* Una sola capa de video acompaña hero y Sobre nosotros. */}
      <div className="home-video-scene relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <video
          id="home-background-video"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="home-background-video absolute inset-0 h-full w-full object-cover"
        >
          <source src="/videos/hero.mp4" type="video/mp4" media="(prefers-reduced-motion: no-preference)" />
        </video>

        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
      </div>
      <HomeVideoMotion />
      <section className="relative h-screen min-h-[600px]">

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
      {(about || content.social_instagram || content.social_facebook) && <div className="home-about-video relative">
      <Reveal as="section" delay={100} className="about-reveal relative z-10 mx-auto max-w-4xl px-4 py-16" >
        <div className="glass-panel rounded-2xl p-6 text-gray-900 shadow-xl dark:text-gray-100 md:p-10">
          {about && <><h2 className="mb-6 text-center text-2xl font-light tracking-widest">{social('aboutTitle')}</h2>
            <p className="whitespace-pre-wrap break-words leading-relaxed">{about}</p></>}
          <div className="mt-6 flex justify-center gap-4">
            {content.social_instagram && <a href={content.social_instagram} target="_blank" rel="noopener noreferrer" aria-label={social('instagramLink')}
              className="about-social-link flex h-11 w-11 items-center justify-center rounded-full border border-green-700 text-green-800 hover:bg-green-50 dark:border-green-400 dark:text-green-300 dark:hover:bg-green-950">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
            </a>}
            {content.social_facebook && <a href={content.social_facebook} target="_blank" rel="noopener noreferrer" aria-label={social('facebookLink')}
              className="about-social-link flex h-11 w-11 items-center justify-center rounded-full border border-green-700 text-green-800 hover:bg-green-50 dark:border-green-400 dark:text-green-300 dark:hover:bg-green-950">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M14 22v-9h3l.5-4H14V7c0-1 .3-2 2-2h2V1.5A24 24 0 0 0 15 1c-3 0-5 2-5 5v3H7v4h3v9z" /></svg>
            </a>}
          </div>
        </div>
      </Reveal></div>}
      <div className="home-video-closing pointer-events-none absolute inset-x-0 bottom-0 h-24" aria-hidden="true" />
      </div>
    </main>
  );
}
