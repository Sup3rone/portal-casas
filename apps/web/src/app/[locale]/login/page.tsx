import Link from "next/link";
import { getTranslations } from "next-intl/server";
import AuthForm from '@/components/AuthForm';
import { loginAction } from "./actions";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'auth' });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">{t('loginTitle')}</h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          {t('loginSubtitle')}
        </p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-400">
            {t('invalidCredentials')}
          </p>
        )}

        <AuthForm action={loginAction}>
          <input type="hidden" name="locale" value={locale} />

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('password')}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white dark:text-gray-100 transition hover:bg-purple-700"
          >
            {t('loginButton')}
          </button>
        </AuthForm>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
          {t('noAccount')}{" "}
          <Link href={`/${locale}/registro`} className="text-purple-600 dark:text-purple-400 underline">
            {t('registerLink')}
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <a href={`/${locale}/olvide-password`} className="text-purple-600 dark:text-purple-400 underline">
            {t('forgotTitle')}
          </a>
        </p>
      </div>
    </div>
  );
}
