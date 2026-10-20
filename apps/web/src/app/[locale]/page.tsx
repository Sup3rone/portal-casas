import loadingStyles from '@/components/PageLoading.module.css';
import { propertyLocation } from '@/lib/destinations';
import PropertySearchForm from '@/components/PropertySearchForm';
import HomeFeaturedCarousel from '@/components/HomeFeaturedCarousel';
// src/app/[locale]/page.tsx
import { getTranslations } from 'next-intl/server';
import Reveal from '@/components/Reveal';
import { readSiteContent, readFeaturedProperties } from '@/lib/site-content';
import HomeVideoMotion from '@/components/HomeVideoMotion';
import Image from 'next/image';
import HomeFeaturedLink from '@/components/HomeFeaturedLink';
import { pageMetadata } from '@/lib/seo';
import { publicFrenchText } from '@/i18n/public-french-text';

// Reversible: true devuelve el formulario compartido al hero.
const HOME_SEARCH_IN_HERO = false;
// Solo la home vuelve al video; listado/fichas mantienen el papel.
const HOME_HERO_MEDIA_ENABLED = true;

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
  const aboutTitle = content[locale === 'fr' ? 'about_title_fr' : locale === 'en' ? 'about_title_en' : 'about_title_es'];
  const social = await getTranslations({ locale, namespace: 'siteContent' });
  const common = await getTranslations({ locale, namespace: 'common' });
  const featured = await readFeaturedProperties(content.featured_property_id);
  const labels = await getTranslations({ locale, namespace: 'properties' });
  return (
    <main className={`public-paper home-composition ${loadingStyles.content}`}>
      {/* Una sola capa de video para el hero; Sobre nosotros fluye después de destacadas. */}
      <div className="home-video-scene relative isolate overflow-hidden">
      {HOME_HERO_MEDIA_ENABLED && <><div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
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
      <section data-home-hero className="relative h-screen min-h-[600px]">

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
      {HOME_HERO_MEDIA_ENABLED && <div className="home-video-closing pointer-events-none absolute inset-x-0 bottom-0 h-24" aria-hidden="true" />}
      </div>
      {featured.length > 0 && <Reveal as="section" delay={200} className="about-reveal mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-light tracking-widest">{social('featuredTitle')}</h2>
        <HomeFeaturedCarousel>
          {featured.map(({ property, photo }) => {
            const title = (locale === 'en' ? property.titleEn : locale === 'fr' ? property.titleFr : property.titleEs).trim() || property.titleEs;
            const description = locale === 'fr' ? publicFrenchText(property.descFr) : ((locale === 'en' ? property.descEn : property.descEs) || '').trim();
            return <HomeFeaturedLink aria-label={title + ' — ' + common('verMas')} key={property.id} href={`/casas/${property.slug}`} className="home-featured-image relative block aspect-[4/3] overflow-hidden rounded-2xl border border-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-700">
              <Image src={photo.url} alt="" fill unoptimized loading="lazy" sizes="(max-width: 1023px) 100vw, 360px" className="home-featured-photo object-cover" />
              <div aria-hidden="true" className="home-featured-veil absolute inset-0" />
              <div className="home-featured-content relative w-full p-6 md:p-8">
                <h3 className="home-featured-title break-words font-serif leading-tight">{title}</h3>
                <p className="home-featured-subtitle mt-3">{[propertyLocation(property), property.maxGuests ? property.maxGuests + ' ' + labels('guests') : ''].filter(Boolean).join(' · ')}</p>
                <div className="home-featured-reveal">
                  {description && <p className="home-featured-description">{description}</p>}
                <span aria-hidden="true" className="home-featured-cta">{common('verMas')}</span>
                </div>
              </div>
            </HomeFeaturedLink>;
          })}
        </HomeFeaturedCarousel>
      </Reveal>}
      {(about && content.about_image) && <div className="home-about-section relative">
      <Reveal as="section" delay={100} className="about-reveal relative z-10 mx-auto max-w-6xl px-4 py-16" >
        <div className="home-about-card rounded-2xl p-6 md:p-10">
          <div className="home-about-photo relative aspect-[2/3] overflow-hidden rounded-xl"><Image src={content.about_image} alt={aboutTitle || social('aboutTitle')} fill unoptimized loading="lazy" sizes="(max-width: 767px) 100vw, 360px" className="object-cover" /></div>
          <div className="min-w-0">
          {about && <><h2 className="mb-6 text-center text-2xl font-light tracking-widest">{aboutTitle || social('aboutTitle')}</h2>
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
        </div>
      </Reveal></div>}
    </main>
  );
}
