export type Theme = 'light' | 'dark';
export const themeStorageKey = 'portal-casas-theme';
export const themeChangeEvent = 'portal-casas-theme-change';

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  try { localStorage.setItem(themeStorageKey, theme); } catch {}
  window.dispatchEvent(new Event(themeChangeEvent));
}

export function getStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem(themeStorageKey);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return 'dark';
}

export function getTheme(): Theme {
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

export function subscribeTheme(callback: () => void) {
  window.addEventListener(themeChangeEvent, callback);
  return () => window.removeEventListener(themeChangeEvent, callback);
}

export const getServerTheme = (): Theme => 'dark';
