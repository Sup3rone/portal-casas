// src/components/Navbar.tsx
'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import LocaleSwitcher from './LocaleSwitcher';
import ThemeToggle from './ThemeToggle';
import PropertySearchForm from './PropertySearchForm';
import { applyTheme, getServerTheme, getStoredTheme, getTheme, subscribeTheme } from '@/lib/theme';

function AccountThemeOption() {
  const t = useTranslations('theme'), locale = useLocale();
  const theme = useSyncExternalStore(subscribeTheme, getTheme, getServerTheme);
  useLayoutEffect(() => { applyTheme(getStoredTheme()); }, [locale]);
  return <button type="button" onClick={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}
    className="flex min-h-11 w-full items-center gap-3 rounded-lg px-4 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-green-700 dark:text-gray-100 dark:hover:bg-gray-800">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 shrink-0">
      {theme === 'dark' ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>
        : <path d="M20.5 14a8.5 8.5 0 0 1-10.5-10.5A8.5 8.5 0 1 0 20.5 14Z" />}
    </svg>
    {t(theme === 'dark' ? 'light' : 'dark')}
  </button>;
}

function AliaMonogram() {
  return <svg role="img" aria-label="Logo Alia Forrent" viewBox="0 0 32 32"
    width="24" height="20" fill="none" stroke="var(--logo-color)" strokeWidth="1.25"
    strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M3 28 13 4l10 24M7 19h8m4 0h.25" />
    <path d="M17 28V4h12M17 13h9" />
  </svg>;
}

export default function Navbar() {
  const locale = useLocale();
  const pathname = usePathname();
  const homePage = /^\/(?:(?:es|en|fr)\/?)?$/.test(pathname);
  const navRef = useRef<HTMLElement>(null);
  const privatePage = /^\/(?:(?:es|en|fr)\/)?(?:panel|admin)(?:\/|$)/.test(pathname);
  const t = useTranslations('nav');
  const searchText = useTranslations('home');
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN';
  const isManager = isAdmin || (session?.user as { role?: string } | undefined)?.role === 'COLLABORATOR';

  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const searchId = useId();
  const accountRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!homePage) return;
    const nav = navRef.current;
    if (!nav) return;
    let previous = window.scrollY, frame = 0;
    function update() {
      frame = 0;
      const y = window.scrollY;
      const hero = document.querySelector('[data-home-hero]');
      const insideHero = Boolean(hero && hero.getBoundingClientRect().bottom > nav!.offsetHeight);
      const focused = nav!.contains(document.activeElement);
      nav!.toggleAttribute('data-home-top', y <= 8);
      nav!.toggleAttribute('data-home-hidden', insideHero && y > 8 && y > previous && !focused);
      previous = y;
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(update); }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [homePage]);

  function closeAccount() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    function outside(event: MouseEvent) {
      if (event.target instanceof Node && !accountRef.current?.contains(event.target)) closeAccount();
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); closeAccount(); }
    }
    document.addEventListener('click', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('click', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  useEffect(() => {
    if (!searchOpen) return;
    searchRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    function closeSearch() { setSearchOpen(false); searchTrigger.current?.focus(); }
    function outside(event: MouseEvent) {
      if (event.target instanceof Node && !searchRef.current?.contains(event.target)) closeSearch();
    }
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); closeSearch(); }
    }
    document.addEventListener('click', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('click', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [searchOpen]);

  return (
    <nav ref={navRef} data-home-top={homePage ? '' : undefined} className={`relative z-50 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900${privatePage ? '' : ' public-header'}${homePage ? ' home-navbar' : ''}`}>
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between max-md:flex-wrap max-md:gap-4">
          {/* LOGO — izquierda */}
          <Link href="/" className={`${privatePage ? '' : 'home-brand inline-flex items-center gap-[9px] '}text-xl font-semibold tracking-widest text-gray-900 dark:text-gray-100`}>
            {!privatePage && <AliaMonogram />}
            {!privatePage ? <span>ALIA<span className="ml-1 text-gray-500 dark:text-gray-400">FOR</span>RENT</span>
              : <>ALIA<span className="ml-1 text-gray-500 dark:text-gray-400">FOR</span>RENT</>}
          </Link>

          {/* NAV LINKS + ACTIONS — derecha */}
          <div className={privatePage ? 'flex items-center gap-6 max-md:w-full max-md:flex-wrap max-md:gap-4' : 'ml-auto flex items-center justify-end gap-4 max-md:w-full'}>
            <div ref={searchRef} data-header-search className="contents">
              <button ref={searchTrigger} type="button" aria-label={searchText('buscar')} aria-expanded={searchOpen} aria-controls={searchId}
                onClick={() => { setOpen(false); setSearchOpen(value => !value); searchTrigger.current?.focus(); }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-900 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
              </button>
              {searchOpen && <div id={searchId} className="header-search-popover absolute inset-x-0 top-full z-50 max-h-[70dvh] overflow-y-auto border-b border-gray-200 bg-white px-4 py-4 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                <div className="mx-auto max-w-5xl"><PropertySearchForm /></div>
              </div>}
            </div>

            <LocaleSwitcher />
            {privatePage && <ThemeToggle />}

            <div ref={accountRef} className={privatePage ? 'relative ml-auto' : 'relative'}>
              <button ref={triggerRef} type="button" disabled={status === 'loading'}
                aria-label={t('cuenta')} aria-expanded={open} aria-controls={menuId}
                onClick={() => { if (open) closeAccount(); else { setSearchOpen(false); setOpen(true); } }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-900 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 disabled:opacity-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
                  <circle cx="12" cy="8" r="4" fill={status === 'authenticated' ? 'currentColor' : 'none'} />
                  <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
                </svg>
              </button>
              {open && status !== 'loading' && <div id={menuId} aria-label={t('cuenta')}
                className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                {status === 'authenticated' ? <>
                  <Link href="/mi-cuenta" onClick={closeAccount} className="flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-green-700 dark:text-gray-100 dark:hover:bg-gray-800">{t('cuenta').toUpperCase()}</Link>
                  {isManager && <Link href="/panel" onClick={closeAccount} className="flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-medium text-green-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-green-700 dark:text-green-400 dark:hover:bg-gray-800">{t(isAdmin ? 'panelAdmin' : 'panelCollaborator')}</Link>}
                  <button type="button" onClick={() => { closeAccount(); void signOut({ callbackUrl: '/' + locale }); }} className="flex min-h-11 w-full items-center rounded-lg px-4 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-green-700 dark:text-gray-300 dark:hover:bg-gray-800">{t('salir').toUpperCase()}</button>
                </> : <>
                  <Link href="/login" onClick={closeAccount} className="flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-green-700 dark:text-gray-100 dark:hover:bg-gray-800">{t('login').toUpperCase()}</Link>
                  <Link href="/registro" onClick={closeAccount} className="flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-green-700 dark:text-gray-100 dark:hover:bg-gray-800">{t('registro').toUpperCase()}</Link>
                </>}
                {!privatePage && <AccountThemeOption />}
              </div>}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
