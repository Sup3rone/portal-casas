import { getRequestConfig } from 'next-intl/server';

const locales = ['es', 'en', 'fr'];

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = locales.includes(requested) ? requested : 'es';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
