import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import '../globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthProvider from '@/components/AuthProvider';
import FooterContactsProvider from '@/components/FooterContactsProvider';
import { readSiteContent } from '@/lib/site-content';

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }, { locale: 'fr' }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const { social_instagram, social_facebook, contact_whatsapp } = await readSiteContent();

  return (
    <html lang={locale} className="light" suppressHydrationWarning>
          <head>
            <script src="/theme-init.js" async fetchPriority="high" />
          </head>
          <body>
            <NextIntlClientProvider>
              <AuthProvider>
                <FooterContactsProvider value={{ social_instagram, social_facebook, contact_whatsapp }}>
                <Navbar />
                {children}
                <Footer />
                </FooterContactsProvider>
              </AuthProvider>
            </NextIntlClientProvider>
          </body>
        </html>
  );
}
