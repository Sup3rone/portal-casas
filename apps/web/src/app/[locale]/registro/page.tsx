import Link from "next/link";
import { getTranslations } from "next-intl/server";
import AuthForm from '@/components/AuthForm';
import { registerAction } from "./actions";

export default async function RegisterPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ error?: string }> }) {
  const { locale } = await params;
  const { error } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">{t('registerTitle')}</h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
          {t('registerSubtitle')}
        </p>

        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-400">
          {t(error === 'duplicado' ? 'duplicateEmail' : 'invalidRegistration')}
        </p>}
        <AuthForm action={registerAction}>
          <input type="hidden" name="locale" value={locale} />
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('fullName')}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              {t('phoneOptional')}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
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
              minLength={6}
              autoComplete="new-password"
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white dark:text-gray-100 transition hover:bg-purple-700"
          >
            {t('registerButton')}
          </button>
        </AuthForm>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
          {t('hasAccount')}{" "}
          <Link href={`/${locale}/login`} className="text-purple-600 dark:text-purple-400 underline">
            {t('loginLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
