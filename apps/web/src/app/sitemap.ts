import type { MetadataRoute } from 'next';
import { db, properties } from '@portal/db';
import { asc, eq } from 'drizzle-orm';
import { localizedUrl, seoAlternates, seoLocales } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const published = await db.select({ slug: properties.slug }).from(properties).where(eq(properties.published, true)).orderBy(asc(properties.slug));
  const paths = ['', '/casas', ...published.map(property => `/casas/${encodeURIComponent(property.slug)}`)];
  // Property no tiene updatedAt: no inventar fechas de modificación.
  return paths.flatMap(path => seoLocales.map(locale => ({
    url: localizedUrl(locale, path), alternates: { languages: seoAlternates(locale, path).languages },
  })));
}
