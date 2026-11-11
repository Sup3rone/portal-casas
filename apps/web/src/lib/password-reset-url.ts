// T-4771: enlace del correo «olvidé mi contraseña». Usa la misma URL pública que el resto del sitio
// (PUBLIC_SITE_URL vía siteUrl()); NEXT_PUBLIC_SITE_URL queda solo como respaldo heredado. Antes solo se
// leía NEXT_PUBLIC_SITE_URL y, si faltaba en Vercel, el correo apuntaba a http://localhost:3000.
import { siteUrl } from './seo';

const LOCALES = new Set(['es', 'en', 'fr']);

function resetOrigin() {
  if (process.env.PUBLIC_SITE_URL) {
    try { return siteUrl(); }
    catch (error) { console.error('PUBLIC_SITE_URL no es válida; se usa el respaldo para el enlace de recuperación:', error); }
  }
  const legacy = process.env.NEXT_PUBLIC_SITE_URL;
  if (legacy) {
    try { return new URL(legacy); }
    catch { console.error('NEXT_PUBLIC_SITE_URL no es válida; el enlace de recuperación usará localhost.'); }
  }
  if (process.env.NODE_ENV === 'production') console.error('Falta PUBLIC_SITE_URL: el enlace de recuperación apuntará a localhost.');
  return new URL('http://localhost:3000');
}

/** URL absoluta de /{locale}/reset-password?token=…; un idioma desconocido cae en «es». */
export function passwordResetUrl(locale: string, token: string) {
  const url = new URL(`/${LOCALES.has(locale) ? locale : 'es'}/reset-password`, resetOrigin());
  url.searchParams.set('token', token);
  return url.toString();
}
