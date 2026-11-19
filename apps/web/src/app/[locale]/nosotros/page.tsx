// T-4944: «Sobre nosotros». Reparto editorial: título grande y foto a lo ancho, historia, equipo, dos fotos
// con pie, valores numerados, contacto y cierre. Animaciones: títulos palabra a palabra (SplitWords), parallax
// (ParallaxImage), fotos que entran giradas (.about-tilt) y botones con letras que ruedan (RollText).
// Textos e imágenes salen del panel (Contenido → Nosotros); lo vacío cae a messages/*.json ([Pendiente])
// y las imágenes vacías a la de cabecera. Oculta mientras PUBLIC_PAGES_LIVE = false.
import loadingStyles from '@/components/PageLoading.module.css';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Reveal from '@/components/Reveal';
import SplitWords from '@/components/SplitWords';
import ParallaxImage from '@/components/ParallaxImage';
import RollText from '@/components/RollText';
import WhatsappCta from '@/components/WhatsappCta';
import { readSiteContent } from '@/lib/site-content';
import { pageMetadata } from '@/lib/seo';
import { unoptimizedFor } from '@/lib/image-src';
import { aboutFromContent, withPublicPageRobots } from '@/lib/public-pages';
import { aboutImages } from '@/lib/page-content';
import { pageTexts } from '@/lib/page-content-store';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, { texts }] = await Promise.all([getTranslations({ locale, namespace: 'seo' }), pageTexts('about', locale)]);
  return withPublicPageRobots(pageMetadata(locale, '/nosotros', texts['seo.aboutTitle'] || t('aboutTitle'), texts['seo.aboutDescription'] || t('aboutDescription')));
}

const linkClass = 'inline-flex min-h-11 items-center justify-center rounded-full border border-green-700 px-6 py-3 text-sm font-medium tracking-wide text-green-800 hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 dark:border-green-400 dark:text-green-300 dark:hover:bg-green-950';
const eyebrowClass = 'mb-4 text-xs uppercase tracking-[0.3em] opacity-70';
const titleClass = 'break-words text-3xl font-light leading-tight tracking-[0.06em] md:text-5xl';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const messages = await getTranslations({ locale, namespace: 'about' });
  const social = await getTranslations({ locale, namespace: 'siteContent' });
  const [content, page] = await Promise.all([readSiteContent(), pageTexts('about', locale)]);
  // Panel → Contenido → Nosotros manda; lo vacío cae a messages/*.json.
  const t = (key: string) => page.texts[`about.${key}`] || messages(key as Parameters<typeof messages>[0]);
  const about = aboutFromContent(content, locale);
  const images = aboutImages(page.images, about.image);
  const values = (['one', 'two', 'three'] as const).map(key => ({ title: t(`values.${key}.title`), text: t(`values.${key}.text`) }));
  const photos = [{ src: images.photoOne, caption: t('photoOneCaption') }, { src: images.photoTwo, caption: t('photoTwoCaption') }];
  const hasContact = Boolean(content.social_instagram || content.social_facebook || content.contact_whatsapp);
  return (
    <main data-public-page="nosotros" className={`public-paper overflow-x-clip ${loadingStyles.content}`}>
      {/* Cabecera: título enorme que entra al primer pintado y, debajo, la foto a lo ancho con parallax. */}
      <section data-page-hero className="mx-auto max-w-7xl px-4 pb-16 pt-32 md:pb-24 md:pt-44">
        <p className={`enter-on-paint ${eyebrowClass}`}>{t('heroEyebrow')}</p>
        <h1 className="break-words text-5xl font-light leading-[1.05] tracking-[0.04em] md:text-8xl">
          <SplitWords text={about.title || t('heroTitleFallback')} paint />
        </h1>
        {images.hero && <ParallaxImage src={images.hero} priority sizes="(min-width: 80rem) 78rem, 100vw" className="mt-12 aspect-[4/3] rounded-sm md:mt-20 md:aspect-[21/9]" />}
      </section>

      <section data-about-section="story" className="mx-auto max-w-3xl px-4 py-16 md:py-28">
        <Reveal className="about-split"><h2 className={`mb-8 ${titleClass}`}><SplitWords text={t('storyTitle')} /></h2></Reveal>
        <Reveal><p data-about-story className="whitespace-pre-wrap break-words text-lg leading-relaxed">{about.text || t('storyFallback')}</p></Reveal>
      </section>

      {/* Equipo: foto vertical con parallax y presentación al lado (apilado en móvil). */}
      <section data-about-section="team" className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-20 md:py-28">
        {images.team && <ParallaxImage src={images.team} sizes="(min-width: 48rem) 36rem, 100vw" className="aspect-[4/5] rounded-sm" />}
        <div>
          <Reveal className="about-split"><h2 className={`mb-8 ${titleClass}`}><SplitWords text={t('teamTitle')} /></h2></Reveal>
          <Reveal><p className="whitespace-pre-wrap break-words text-lg leading-relaxed">{t('teamText')}</p></Reveal>
        </div>
      </section>

      {/* Dos fotos con pie: suben inclinadas y se enderezan, la segunda más abajo y un poco después. */}
      {images.photoOne && <section data-about-section="photos" className="mx-auto grid max-w-5xl grid-cols-2 gap-5 px-4 py-16 md:gap-16 md:py-24">
        {photos.map((photo, index) => <Reveal key={index} as="figure" delay={index * 150} distance={index ? 220 : 120} className={`about-tilt${index ? ' mt-16 md:mt-40' : ''}`}>
          <div className="relative aspect-[3/4] overflow-hidden rounded-sm">
            <Image src={photo.src} alt="" fill sizes="(min-width: 64rem) 28rem, 50vw" unoptimized={unoptimizedFor(photo.src)} className="object-cover" />
          </div>
          <figcaption className="mt-4 break-words text-xs uppercase tracking-[0.25em] opacity-80">{photo.caption}</figcaption>
        </Reveal>)}
      </section>}

      {/* Valores numerados 01 · 02 · 03. */}
      <section data-about-section="values" className="mx-auto max-w-6xl px-4 py-16 md:py-28">
        <Reveal className="about-split"><h2 className={`mb-12 ${titleClass}`}><SplitWords text={t('valuesTitle')} /></h2></Reveal>
        <ol className="grid gap-10 md:grid-cols-3 md:gap-12">
          {values.map((value, index) => <Reveal key={index} as="li" delay={index * 120} className="border-t border-current/20 pt-6">
            <span aria-hidden="true" className="block text-4xl font-light tracking-[0.1em] opacity-50">{String(index + 1).padStart(2, '0')}</span>
            <h3 className="mt-4 break-words text-lg font-medium tracking-wide">{value.title}</h3>
            <p className="mt-3 break-words leading-relaxed opacity-90">{value.text}</p>
          </Reveal>)}
        </ol>
      </section>

      {hasContact && <Reveal as="section" className="about-reveal mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="mb-6 text-2xl font-light tracking-widest">{t('contactTitle')}</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {content.social_instagram && <a href={content.social_instagram} target="_blank" rel="noopener noreferrer" className={linkClass}><RollText text={social('instagramLink')} /></a>}
          {content.social_facebook && <a href={content.social_facebook} target="_blank" rel="noopener noreferrer" className={linkClass}><RollText text={social('facebookLink')} /></a>}
          <WhatsappCta number={content.contact_whatsapp} message={t('whatsappMessage')} label={t('whatsappLabel')} />
        </div>
      </Reveal>}

      {/* Cierre: título, texto, botones y la última foto a lo ancho. */}
      <section data-about-section="closing" className="mx-auto max-w-7xl px-4 pb-8 pt-16 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal className="about-split"><h2 className={`mb-6 ${titleClass}`}><SplitWords text={t('ctaTitle')} /></h2></Reveal>
          <Reveal>
            <p className="mb-10 break-words text-lg leading-relaxed">{t('ctaText')}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/casas" className={linkClass}><RollText text={t('ctaHomes')} /></Link>
              <Link href="/unete" className={linkClass}><RollText text={t('ctaJoin')} /></Link>
            </div>
          </Reveal>
        </div>
        {images.closing && <ParallaxImage src={images.closing} sizes="(min-width: 80rem) 78rem, 100vw" className="mt-16 aspect-[4/3] rounded-sm md:mt-24 md:aspect-[16/7]" />}
      </section>
    </main>
  );
}
