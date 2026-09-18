import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';


const locales = ['es', 'en', 'fr'] as const;
type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = locales.includes(requested as Locale)
    ? (requested as Locale)
    : 'es';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
