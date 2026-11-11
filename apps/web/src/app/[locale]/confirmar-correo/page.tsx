// T-4783: abre el enlace de «Confirma tu correo». Consume el token (hash, no usado, no vencido) y marca
// emailVerifiedAt de SU dueño, no el de la sesión abierta. Vencido / ya usado / inválido ofrecen reenviar.
import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { db, users } from '@portal/db';
import { consumeToken, verifyTokens } from '@/lib/auth-tokens';
import { privateMetadata } from '@/lib/seo';
import { resendVerification } from './actions';

export const metadata = privateMetadata;
export const dynamic = 'force-dynamic';

type Outcome = 'done' | 'used' | 'expired' | 'invalid' | 'resent' | 'limited';
const KEYS = { done: 'verifyDone', used: 'verifyUsed', expired: 'verifyExpired', invalid: 'verifyInvalid', resent: 'verifyResent', limited: 'verifyLimited' } as const;

export default async function ConfirmEmailPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; reenviado?: string; limite?: string }>;
}) {
  const { locale } = await params;
  const { token, reenviado, limite } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'auth' });

  let outcome: Outcome;
  if (limite) outcome = 'limited';
  else if (reenviado && !token) outcome = 'resent';
  else {
    const result = await consumeToken(verifyTokens, String(token ?? ''));
    if (result.status === 'valid') {
      await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, result.userId));
      outcome = 'done';
    } else outcome = result.status;
  }
  const ok = outcome === 'done' || outcome === 'resent';

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">{t('verifyTitle')}</h1>
        <p role={ok ? 'status' : 'alert'} className={`rounded-lg p-4 text-sm ${ok
          ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-300'
          : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'}`}>
          {t(KEYS[outcome])}
        </p>
        {outcome === 'done' ? (
          <a href={`/${locale}/mi-cuenta`} className="mt-4 block font-medium text-[var(--brand-brown)] dark:text-[var(--brand-brown-light)] underline">
            {t('verifyGoAccount')}
          </a>
        ) : (
          <form action={resendVerification} className="mt-6 space-y-4 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm border dark:border-gray-700">
            <input type="hidden" name="locale" value={locale} />
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">{t('email')}</label>
              <input required type="email" id="email" name="email" autoComplete="email"
                className="mt-1 block w-full rounded-md border p-2 shadow-sm focus:border-[var(--brand-brown)] focus:ring-[var(--brand-brown)] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
            </div>
            <button type="submit"
              className="w-full rounded-lg bg-[var(--brand-brown)] py-3 font-bold text-white dark:text-gray-100 transition-colors hover:bg-[var(--brand-brown-strong)]">
              {t('verifyResend')}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
