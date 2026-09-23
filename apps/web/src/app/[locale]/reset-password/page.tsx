import { db, passwordResetTokens } from '@portal/db';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { resetPassword } from './actions';

export default async function ResetPasswordPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { token, error } = await searchParams;
  const t = await getTranslations('auth');

  // Validar el token ANTES de mostrar el formulario (se puede mostrar sin miedo:
  // solo confirma validez, no expone datos del usuario)
  let tokenValido = false;
  if (token) {
    const [reset] = await db
      .select({ id: passwordResetTokens.id })
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date())
      ))
      .limit(1);
    tokenValido = !!reset;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">{t('resetTitle')}</h1>

        {!tokenValido ? (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error === 'corta'
              ? t('resetTooShort')
              : t('resetInvalid')}
            <a href={`/${locale}/olvide-password`} className="mt-2 block font-medium text-purple-600 underline">
              {t('resetTryAgain')}
            </a>
          </div>
        ) : (
          <form action={resetPassword} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm border">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="token" value={token} />
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('newPassword')}</label>
              <input required type="password" id="password" name="password" minLength={8}
                className="mt-1 block w-full rounded-md border p-2 shadow-sm focus:border-purple-500 focus:ring-purple-500" />
            </div>
            <button type="submit"
              className="w-full rounded-lg bg-purple-600 py-3 font-bold text-white transition-colors hover:bg-purple-700">
              {t('resetButton')}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
