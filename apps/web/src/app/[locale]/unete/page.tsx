// T-4944: «Únete», para dos audiencias. Dueños = rol COLLABORATOR (publican sus casas); referidores = tabla Partner
// (necesitan una cuenta registrada, T-4767). Esqueleto con [Pendiente] en messages/*.json (namespace join).
// Oculta mientras PUBLIC_PAGES_LIVE = false.
import loadingStyles from '@/components/PageLoading.module.css';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import Reveal from '@/components/Reveal';
import PageHero from '@/components/PageHero';
import BenefitGrid from '@/components/BenefitGrid';
import StepsList from '@/components/StepsList';
import FaqList from '@/components/FaqList';
import WhatsappCta from '@/components/WhatsappCta';
import { readSiteContent } from '@/lib/site-content';
import { pageMetadata } from '@/lib/seo';
import { withPublicPageRobots } from '@/lib/public-pages';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'seo' });
  return withPublicPageRobots(pageMetadata(locale, '/unete', t('joinTitle'), t('joinDescription')));
}

const items = ['one', 'two', 'three'] as const;
const audiences = [{ key: 'owners', anchor: 'duenos' }, { key: 'referrers', anchor: 'referidores' }] as const;
const primaryClass = 'inline-flex min-h-11 items-center justify-center rounded-full bg-green-700 px-6 py-3 text-sm font-medium tracking-wide text-white hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 dark:bg-green-600 dark:hover:bg-green-500';

export default async function JoinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'join' });
  const [content, session] = await Promise.all([readSiteContent(), auth()]);
  const signedIn = Boolean(session?.user?.email);
  return (
    <main data-public-page="unete" className={`public-paper ${loadingStyles.content}`}>
      <PageHero eyebrow={t('heroEyebrow')} title={t('heroTitle')} text={t('heroText')}>
        <nav aria-label={t('chooserLabel')} className="mt-10 grid gap-4 text-left sm:grid-cols-2">
          {audiences.map(({ key, anchor }) => <a key={key} href={`#${anchor}`} className="block rounded-2xl border border-gray-200 bg-white/80 p-6 hover:border-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 dark:border-gray-700 dark:bg-gray-900/80 dark:hover:border-green-400">
            <span className="block break-words font-medium">{t(`${key}.cardTitle`)}</span>
            <span className="mt-2 block break-words text-sm text-gray-600 dark:text-gray-300">{t(`${key}.cardText`)}</span>
          </a>)}
        </nav>
      </PageHero>
      {audiences.map(({ key, anchor }) => <section key={key} id={anchor} data-audience={key} aria-labelledby={`${anchor}-title`} className="scroll-mt-24 border-t border-gray-200 py-16 dark:border-gray-700">
        <Reveal className="about-reveal mx-auto max-w-6xl space-y-16 px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 id={`${anchor}-title`} className="mb-4 text-2xl font-light tracking-widest">{t(`${key}.title`)}</h2>
            <p className="break-words leading-relaxed">{t(`${key}.intro`)}</p>
          </div>
          <BenefitGrid title={t('benefitsTitle')} items={items.map(item => ({ title: t(`${key}.benefits.${item}.title`), text: t(`${key}.benefits.${item}.text`) }))} />
          <StepsList title={t('stepsTitle')} steps={items.map(item => t(`${key}.steps.${item}`))} />
          <div className="text-center">
            {key === 'referrers' && !signedIn
              ? <>
                <Link href="/registro" data-cta="registro" className={primaryClass}>{t('referrers.ctaRegister')}</Link>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{t('referrers.ctaRegisterHint')}</p>
              </>
              : <WhatsappCta number={content.contact_whatsapp} message={t(`${key}.whatsappMessage`)} label={t(`${key}.cta`)} />}
          </div>
          <FaqList title={t('faqTitle')} items={items.map(item => ({ question: t(`${key}.faq.${item}.question`), answer: t(`${key}.faq.${item}.answer`) }))} />
        </Reveal>
      </section>)}
    </main>
  );
}
