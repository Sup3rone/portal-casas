// T-4944: «Sobre nosotros». Esqueleto: el texto, título e imagen salen del panel (Contenido → Sobre nosotros);
// lo que falta lleva [Pendiente] en messages/*.json (namespace about). Oculta mientras PUBLIC_PAGES_LIVE = false.
import loadingStyles from '@/components/PageLoading.module.css';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Reveal from '@/components/Reveal';
import PageHero from '@/components/PageHero';
import BenefitGrid from '@/components/BenefitGrid';
import WhatsappCta from '@/components/WhatsappCta';
import { readSiteContent } from '@/lib/site-content';
import { pageMetadata } from '@/lib/seo';
import { aboutFromContent, withPublicPageRobots } from '@/lib/public-pages';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return withPublicPageRobots(pageMetadata(locale, '/nosotros', t('aboutTitle'), t('aboutDescription')));
}

const linkClass = 'inline-flex min-h-11 items-center justify-center rounded-full border border-green-700 px-6 py-3 text-sm font-medium tracking-wide text-green-800 hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 dark:border-green-400 dark:text-green-300 dark:hover:bg-green-950';

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  const social = await getTranslations({ locale, namespace: 'siteContent' });
  const content = await readSiteContent();
  const about = aboutFromContent(content, locale);
  const values = (['one', 'two', 'three'] as const).map(key => ({ title: t(`values.${key}.title`), text: t(`values.${key}.text`) }));
  const hasContact = Boolean(content.social_instagram || content.social_facebook || content.contact_whatsapp);
  return (
    <main data-public-page="nosotros" className={`public-paper ${loadingStyles.content}`}>
      <PageHero eyebrow={t('heroEyebrow')} title={about.title || t('heroTitleFallback')} image={about.image || undefined} />
      <Reveal as="section" className="about-reveal mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-6 text-center text-2xl font-light tracking-widest">{t('storyTitle')}</h2>
        <p data-about-story className="whitespace-pre-wrap break-words leading-relaxed">{about.text || t('storyFallback')}</p>
      </Reveal>
      <Reveal as="section" className="about-reveal mx-auto max-w-6xl px-4 py-16">
        <BenefitGrid title={t('valuesTitle')} items={values} />
      </Reveal>
      {hasContact && <Reveal as="section" className="about-reveal mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="mb-6 text-2xl font-light tracking-widest">{t('contactTitle')}</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {content.social_instagram && <a href={content.social_instagram} target="_blank" rel="noopener noreferrer" className={linkClass}>{social('instagramLink')}</a>}
          {content.social_facebook && <a href={content.social_facebook} target="_blank" rel="noopener noreferrer" className={linkClass}>{social('facebookLink')}</a>}
          <WhatsappCta number={content.contact_whatsapp} message={t('whatsappMessage')} label={t('whatsappLabel')} />
        </div>
      </Reveal>}
      <Reveal as="section" className="about-reveal mx-auto max-w-3xl px-4 py-16 text-center">
        <h2 className="mb-4 text-2xl font-light tracking-widest">{t('ctaTitle')}</h2>
        <p className="mb-8 break-words leading-relaxed">{t('ctaText')}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/casas" className={linkClass}>{t('ctaHomes')}</Link>
          <Link href="/unete" className={linkClass}>{t('ctaJoin')}</Link>
        </div>
      </Reveal>
    </main>
  );
}
