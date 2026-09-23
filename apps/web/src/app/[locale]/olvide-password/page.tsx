import { getTranslations } from 'next-intl/server';
import { requestPasswordReset } from './actions';

export default async function ForgotPasswordPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { locale } = await params;
  const { sent } = await searchParams;
  const t = await getTranslations('auth');

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">{t('forgotTitle')}</h1>
        <p className="mb-6 text-sm text-gray-600">{t('forgotSubtitle')}</p>

        {sent ? (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
            {t('forgotSent')}
          </div>
        ) : (
          <form action={requestPasswordReset} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm border">
            <input type="hidden" name="locale" value={locale} />
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo electrónico</label>
              <input required type="email" id="email" name="email"
                className="mt-1 block w-full rounded-md border p-2 shadow-sm focus:border-purple-500 focus:ring-purple-500" />
            </div>
            <button type="submit"
              className="w-full rounded-lg bg-purple-600 py-3 font-bold text-white transition-colors hover:bg-purple-700">
              {t('forgotButton')}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
