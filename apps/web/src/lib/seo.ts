import type { Metadata } from 'next';

export const seoLocales = ['es', 'en', 'fr'] as const;
export function siteUrl() {
  const url = new URL(process.env.PUBLIC_SITE_URL || 'http://localhost:3000');
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('PUBLIC_SITE_URL debe ser un origen HTTP(S), sin ruta ni credenciales');
  return url;
}
export function localizedUrl(locale: string, path = '') {
  return new URL(`/${locale}${path}`, siteUrl()).toString();
}
export function seoAlternates(locale: string, path = '') {
  return { canonical: localizedUrl(locale, path), languages: {
    ...Object.fromEntries(seoLocales.map(language => [language, localizedUrl(language, path)])),
    'x-default': localizedUrl('es', path),
  } };
}
export function descriptionExcerpt(description: string, limit = 155) {
  const text = description.trim().replace(/\s+/g, ' ');
  if (text.length <= limit) return text;
  const prefix = text.slice(0, limit - 1);
  const boundary = /\s/u.test(text[limit - 1]) ? prefix.length : prefix.lastIndexOf(' ');
  return boundary > 0 ? prefix.slice(0, boundary).trimEnd() + '…' : '';
}
export function pageMetadata(locale: string, path: string, title: string, description: string, photo?: string | null): Metadata {
  const fullTitle = `${title} | Portal Casas`;
  const image = photo ? new URL(photo, siteUrl()).toString() : undefined;
  return {
    title, description: description || undefined, alternates: seoAlternates(locale, path),
    openGraph: { title: fullTitle, description: description || undefined, siteName: 'Portal Casas', type: 'website', url: localizedUrl(locale, path),
      locale: locale === 'en' ? 'en_GB' : locale === 'fr' ? 'fr_FR' : 'es_MX',
      alternateLocale: seoLocales.filter(language => language !== locale).map(language => language === 'en' ? 'en_GB' : language === 'fr' ? 'fr_FR' : 'es_MX'),
      images: image ? [{ url: image, alt: title }] : [], },
    twitter: { card: 'summary_large_image', title: fullTitle, description: description || undefined, images: image ? [image] : [] },
  };
}
export const privateMetadata: Metadata = { robots: { index: false, follow: false } };
