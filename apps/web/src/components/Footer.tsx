'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import Reveal from './Reveal';
import { useFooterContacts, formatContactWhatsapp } from './FooterContactsProvider';

export default function Footer({ inDetail = false }: { inDetail?: boolean } = {}) {
  const t = useTranslations('footer');
  const nav = useTranslations('nav');
  const social = useTranslations('siteContent');
  const contacts = useFooterContacts();
  const pathname = usePathname();
  const Content = /^\/(?:(?:es|en|fr)\/)?(?:panel|admin)(?:\/|$)/.test(pathname) ? 'div' : Reveal;
  if (!inDetail && /^\/(?:(?:es|en|fr)\/)?casas\/[^/]+\/?$/.test(pathname)) return null;

  return (
    <footer className="mt-20 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-12">
      <Content className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Portal Casas</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('descripcion')}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-gray-100 mb-4">{t('navegacion')}</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li><Link href="/casas" className="hover:text-purple-600 dark:hover:text-purple-400">{nav('casas')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900 dark:text-gray-100 mb-4">{t('contacto')}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">hola@portalcasas.com</p>
            {(contacts.social_instagram || contacts.social_facebook || contacts.contact_whatsapp) && <div className="mt-4 flex min-w-0 flex-wrap items-center gap-4">
              {contacts.social_instagram && <a href={contacts.social_instagram} target="_blank" rel="noopener noreferrer" aria-label={social('instagramLink')} className="about-social-link flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-green-700 text-green-800 hover:bg-green-50 dark:border-green-400 dark:text-green-300 dark:hover:bg-green-950">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
              </a>}
              {contacts.social_facebook && <a href={contacts.social_facebook} target="_blank" rel="noopener noreferrer" aria-label={social('facebookLink')} className="about-social-link flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-green-700 text-green-800 hover:bg-green-50 dark:border-green-400 dark:text-green-300 dark:hover:bg-green-950">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M14 22v-9h3l.5-4H14V7c0-1 .3-2 2-2h2V1.5A24 24 0 0 0 15 1c-3 0-5 2-5 5v3H7v4h3v9z" /></svg>
              </a>}
              {contacts.contact_whatsapp && <a href={'https://wa.me/'+contacts.contact_whatsapp} target="_blank" rel="noopener noreferrer" aria-label={social('contactWhatsappLink',{number:formatContactWhatsapp(contacts.contact_whatsapp)})} className="about-social-link flex min-h-11 min-w-0 max-w-full flex-wrap items-center gap-2 rounded-full border border-green-700 px-3 py-2 text-green-800 hover:bg-green-50 dark:border-green-400 dark:text-green-300 dark:hover:bg-green-950">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6 shrink-0"><path d="M21 11.5a9 9 0 0 1-13.3 7.9L3 21l1.6-4.7A9 9 0 1 1 21 11.5Z" /><path d="m8 7 2 3-1 1c1 2 2 3 4 4l1-1 3 2c-1 2-3 2-5 1-3-2-5-4-6-7 0-1 1-3 2-3Z" /></svg>
                <span className="break-words text-sm">{formatContactWhatsapp(contacts.contact_whatsapp)}</span>
              </a>}
            </div>}
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {t('derechos', { year: new Date().getFullYear() })}
        </div>
      </Content>
    </footer>
  );
}
