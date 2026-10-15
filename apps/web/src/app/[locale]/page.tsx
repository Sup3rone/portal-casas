import PropertySearchForm from '@/components/PropertySearchForm';
import { PUBLIC_PHOTO_BACKGROUNDS } from '@/lib/public-appearance';
// src/app/[locale]/page.tsx
import { getTranslations } from 'next-intl/server';
import Reveal from '@/components/Reveal';
import { readSiteContent, readFeaturedProperty, briefDescription } from '@/lib/site-content';
import HomeVideoMotion from '@/components/HomeVideoMotion';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { pageMetadata } from '@/lib/seo';
import { publicFrenchText } from '@/i18n/public-french-text';

// Reversible: true devuelve el formulario compartido al hero.
const HOME_SEARCH_IN_HERO = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return pageMetadata(locale, '', t('homeTitle'), t('homeDescription'));
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  const content = await readSiteContent();
  const about = locale === 'fr' ? publicFrenchText(content.about_fr) : content[locale === 'en' ? 'about_en' : 'about_es'];
  const social = await getTranslations({ locale, namespace: 'siteContent' });
  const featured = await readFeaturedProperty(content.featured_property_id);
  const labels = await getTranslations({ locale, namespace: 'properties' });
  const featuredTitle = featured && ((locale === 'en' ? featured.property.titleEn : locale === 'fr' ? featured.property.titleFr : featured.property.titleEs).trim() || featured.property.titleEs);
  const featuredDescription = featured && briefDescription(locale === 'fr' ? publicFrenchText(featured.property.descFr) : (locale === 'en' ? featured.property.descEn : featured.property.descEs).trim() || featured.property.descEs);
  return (
    <main className={PUBLIC_PHOTO_BACKGROUNDS ? undefined : 'public-paper'}>
      {/* Una sola capa de video acompaña hero y Sobre nosotros. */}
      <div className="home-video-scene relative isolate overflow-hidden">
      {PUBLIC_PHOTO_BACKGROUNDS && <><div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <video
          id="home-background-video"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="home-background-video absolute inset-0 h-full w-full object-cover"
        >
          <source src={content.home_background_video || '/videos/hero.mp4'} media="(prefers-reduced-motion: no-preference)" />
        </video>

        {/* Overlay oscuro para legibilidad */}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
      </div>
      <HomeVideoMotion /></>}
      <section className="relative h-screen min-h-[600px]">

        {/* Contenido centrado */}
        <Reveal className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <h1 className="mb-4 text-4xl font-light tracking-[0.3em] text-white dark:text-gray-100 md:text-6xl">
            {t('bienvenida')}
          </h1>
          <h2 className={`${HOME_SEARCH_IN_HERO ? 'mb-12 ' : ''}text-2xl font-light tracking-[0.25em] text-white/90 dark:text-gray-200 md:text-3xl`}>
            {t('propiedadesEnRenta')}
          </h2>

          {/* Widget de búsqueda flotante */}
          {HOME_SEARCH_IN_HERO && <PropertySearchForm />}
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
      {PUBLIC_PHOTO_BACKGROUNDS && <div className="home-video-closing pointer-events-none absolute inset-x-0 bottom-0 h-24" aria-hidden="true" />}
      </div>
      {featured && <Reveal as="section" delay={200} className="about-reveal mx-auto max-w-6xl px-4 py-16">
        <div className="grid min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 md:grid-cols-2">
          <div className="home-featured-image min-w-0 overflow-hidden">
            <Image src={featured.photo.url} alt={featuredTitle || featured.property.titleEs} width={1200} height={900} unoptimized className="home-featured-photo aspect-[4/3] h-full w-full object-cover" />
          </div>
          <div className="min-w-0 space-y-4 p-6 text-gray-900 dark:text-gray-100 md:p-10">
            <p className="text-sm font-medium tracking-widest text-green-800 dark:text-green-300">{social('featuredTitle')}</p>
            <h2 className="break-words text-2xl font-light">{featuredTitle}</h2>
            <p className="break-words text-gray-600 dark:text-gray-300">{featured.property.city}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{featured.property.maxGuests} {labels('guests')} · {featured.property.bedrooms} {labels('bedrooms')} · {featured.property.bathrooms} {labels('bathrooms')}</p>
            {featuredDescription && <p className="break-words leading-relaxed">{featuredDescription}</p>}
            <Link href={`/casas/${featured.property.slug}`} className="inline-flex min-h-11 items-center rounded-lg bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800 dark:hover:bg-green-600">{social('featuredView')}</Link>
          </div>
        </div>
      </Reveal>}
    </main>
  );
}
