// T-4944: «Únete» como cuestionario a pantalla completa, sin scroll (JoinQuiz). Dos audiencias: dueños = rol
// COLLABORATOR (publican sus casas); referidores = tabla Partner (necesitan cuenta registrada, T-4767).
// Textos [Pendiente] en messages/*.json (namespace join). Oculta mientras PUBLIC_PAGES_LIVE = false.
// Sin footer en esta ruta (Footer.tsx) y body a 100dvh (globals.css, main[data-join-quiz]).
// Con «No estamos disponibles» marcado en el panel (page_join.closed) muestra el aviso en vez del cuestionario.
import loadingStyles from '@/components/PageLoading.module.css';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import JoinQuiz from '@/components/JoinQuiz';
import { readSiteContent } from '@/lib/site-content';
import { readPublishedDestinations } from '@/lib/published-destinations';
import { pageMetadata } from '@/lib/seo';
import { withPublicPageRobots } from '@/lib/public-pages';
import { pageTexts } from '@/lib/page-content-store';
import { unoptimizedFor } from '@/lib/image-src';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, { texts }] = await Promise.all([getTranslations({ locale, namespace: 'seo' }), pageTexts('join', locale)]);
  return withPublicPageRobots(pageMetadata(locale, '/unete', texts['seo.joinTitle'] || t('joinTitle'), texts['seo.joinDescription'] || t('joinDescription')));
}

export default async function JoinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [content, page] = await Promise.all([readSiteContent(), pageTexts('join', locale)]);
  const image = page.images.side || content.about_image.trim() || undefined;
  if (page.closed) {
    const messages = await getTranslations({ locale, namespace: 'join' });
    const t = (key: 'title' | 'text' | 'cta') => page.texts[`join.closed.${key}`] || messages(`closed.${key}`);
    return (
      <main data-public-page="unete" data-join-quiz data-join-closed className={`public-paper flex ${loadingStyles.content}`}>
        <div className="flex min-h-0 w-full flex-1">
          <div className="flex min-w-0 flex-1 overflow-y-auto">
            <div className="enter-on-paint m-auto w-full max-w-3xl px-4 py-10 sm:px-8">
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">{page.texts['join.heroEyebrow'] || messages('heroEyebrow')}</p>
              <h1 className="break-words text-3xl font-light leading-snug tracking-[0.06em] sm:text-5xl">{t('title')}</h1>
              <p className="mt-4 max-w-xl whitespace-pre-line break-words leading-relaxed text-gray-600 dark:text-gray-300">{t('text')}</p>
              <Link href="/casas" className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full bg-green-700 px-6 py-3 text-sm font-medium tracking-wide text-white hover:bg-green-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 dark:bg-green-600 dark:hover:bg-green-500">{t('cta')}</Link>
            </div>
          </div>
          {image && <div className="relative hidden w-[38%] max-w-2xl shrink-0 overflow-hidden lg:block">
            <Image src={image} alt="" fill priority unoptimized={unoptimizedFor(image)} sizes="38vw" className="object-cover" />
          </div>}
        </div>
      </main>
    );
  }
  const [destinations, session] = await Promise.all([readPublishedDestinations(), auth()]);
  return (
    <main data-public-page="unete" data-join-quiz className={`public-paper flex ${loadingStyles.content}`}>
      <JoinQuiz states={destinations.map(group => group.state)} whatsapp={content.contact_whatsapp} signedIn={Boolean(session?.user?.email)} image={image} texts={page.texts} />
    </main>
  );
}
