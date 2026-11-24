// T-5210 (pedido de Gabriel, replanteado 23-nov): «Modo usuario ↔ Modo vendedor» en la APP INSTALADA del teléfono.
// - Modo vendedor = el panel de quien entra (el colaborador solo ve sus casas; permisos en el servidor).
// - Modo usuario = el sitio normal.
// - Cambiar de modo lleva SIEMPRE al inicio del otro: vendedor → portada; usuario → «¿Qué está libre?».
export const MODE_COOKIE = 'alia_mode';
/** Marca que deja la entrada /[locale]/app (inicio de la PWA/APK) para saber que este navegador es «la app». */
export const APP_COOKIE = 'alia_app';
export type Mode = 'vendor' | 'user';

export function modeTarget(pathname: string): { mode: Mode; target: string } {
  const path = pathname.replace(/^\/(?:es|en|fr)(?=\/|$)/, '') || '/';
  return /^\/(?:panel|admin)(?:\/|$)/.test(path) ? { mode: 'vendor', target: '/' } : { mode: 'user', target: '/panel/vender' };
}

export type AppWindow = { matchMedia?: (query: string) => { matches: boolean }; navigator?: { standalone?: boolean }; document?: { cookie?: string } };

/** ¿Se está usando como app instalada? Android/PWA/TWA (standalone), iPhone desde la pantalla de inicio, o entró por /app. */
export function isInstalledApp(win: AppWindow) {
  if (win.matchMedia?.('(display-mode: standalone)').matches) return true;
  if (win.navigator?.standalone === true) return true;
  return (win.document?.cookie ?? '').split(';').some(part => part.trim() === `${APP_COOKIE}=1`);
}
