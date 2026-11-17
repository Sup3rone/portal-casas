// T-4944: «Únete» como cuestionario a pantalla completa, sin scroll (JoinQuiz). Dos audiencias: dueños = rol
// COLLABORATOR (publican sus casas); referidores = tabla Partner (necesitan cuenta registrada, T-4767).
// Textos [Pendiente] en messages/*.json (namespace join). Oculta mientras PUBLIC_PAGES_LIVE = false.
// Sin footer en esta ruta (Footer.tsx) y body a 100dvh (globals.css, main[data-join-quiz]).
import loadingStyles from '@/components/PageLoading.module.css';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import JoinQuiz from '@/components/JoinQuiz';
import { readSiteContent } from '@/lib/site-content';
import { readPublishedDestinations } from '@/lib/published-destinations';
import { pageMetadata } from '@/lib/seo';
import { withPublicPageRobots } from '@/lib/public-pages';
import { pageTexts } from '@/lib/page-content-store';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, { texts }] = await Promise.all([getTranslations({ locale, namespace: 'seo' }), pageTexts('join', locale)]);
  return withPublicPageRobots(pageMetadata(locale, '/unete', texts['seo.joinTitle'] || t('joinTitle'), texts['seo.joinDescription'] || t('joinDescription')));
}

export default async function JoinPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [content, destinations, session, page] = await Promise.all([readSiteContent(), readPublishedDestinations(), auth(), pageTexts('join', locale)]);
  return (
    <main data-public-page="unete" data-join-quiz className={`public-paper flex ${loadingStyles.content}`}>
      <JoinQuiz states={destinations.map(group => group.state)} whatsapp={content.contact_whatsapp} signedIn={Boolean(session?.user?.email)} image={page.images.side || content.about_image.trim() || undefined} texts={page.texts} />
    </main>
  );
}
