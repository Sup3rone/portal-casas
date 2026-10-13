import type { MetadataRoute } from 'next';
import { seoLocales, siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const privatePaths = ['/panel', '/admin', '/mi-cuenta', '/login', '/registro', '/olvide-password', '/reset-password'];
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/', ...privatePaths,
    ...seoLocales.flatMap(locale => privatePaths.map(path => `/${locale}${path}`))] },
    sitemap: new URL('/sitemap.xml', siteUrl()).toString() };
}
