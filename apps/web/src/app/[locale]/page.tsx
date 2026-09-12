import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">{t('titulo')}</h1>
      <p className="mt-2 text-lg opacity-70">{t('subtitulo')}</p>
    </main>
  );
}
