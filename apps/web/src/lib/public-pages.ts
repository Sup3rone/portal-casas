// T-4944: páginas informativas /nosotros y /unete. Nacen como esqueleto con textos [Pendiente].
// Mientras PUBLIC_PAGES_LIVE (public-pages-live.ts) sea false: no se enlazan (Navbar, Footer), llevan noindex
// y no van al sitemap. Publicarlas = ponerla en true cuando el negocio entregue el contenido (docs/MAPA-DEL-PROYECTO.md §14).
import type { Metadata } from 'next';
import { publicFrenchText } from '@/i18n/public-french-text';
import type { SiteContentValues } from './site-content';
import { PUBLIC_PAGES_LIVE } from './public-pages-live';

export { PUBLIC_PAGES_LIVE };
export const publicPagePaths = ['/nosotros', '/unete'] as const;

/** Rutas para el sitemap: vacío mientras sean esqueleto. */
export function publicPagesForSitemap(live = PUBLIC_PAGES_LIVE): string[] {
  return live ? [...publicPagePaths] : [];
}

/** Añade noindex a la metadata mientras las páginas no estén publicadas. */
export function withPublicPageRobots(metadata: Metadata, live = PUBLIC_PAGES_LIVE): Metadata {
  return live ? metadata : { ...metadata, robots: { index: false, follow: false } };
}

/** Texto y título de «Sobre nosotros» del panel, con la misma regla de idioma que la home. */
export function aboutFromContent(content: SiteContentValues, locale: string) {
  const text = locale === 'fr' ? publicFrenchText(content.about_fr) : (locale === 'en' ? content.about_en : content.about_es).trim();
  const title = (locale === 'fr' ? content.about_title_fr : locale === 'en' ? content.about_title_en : content.about_title_es).trim();
  return { text, title, image: content.about_image.trim() };
}

/** wa.me con mensaje prellenado; null si el número del panel falta o no es válido. */
export function whatsappHref(number: string, text: string): string | null {
  return /^[0-9]{8,15}$/.test(number) ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : null;
}
