// T-4736: programa de referidos — utilidades puras (sin BD), usables desde el proxy.
//
// Cookie de atribución:
// - Nombre `alia_ref`, valor = código normalizado (A-Z, 0-9, guion; 4–32).
// - Se escribe en el proxy cuando una página pública llega con `?ref=CODIGO` válido de forma.
//   No se consulta la BD ahí: un código inexistente o de un colaborador inactivo
//   simplemente no atribuye nada al enviar la consulta.
// - Expira a los 30 días. Último clic gana: un `?ref=` nuevo reemplaza al anterior.
// - httpOnly + SameSite=Lax + Secure en producción. No identifica al visitante.
// - El sitio público no cambia: la URL se queda igual y no se muestra nada.
export const REFERRAL_COOKIE = 'alia_ref';
export const REFERRAL_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const CODE_PATTERN = /^[A-Z0-9-]{4,32}$/;
// Sin 0/O/1/I/L para que el código se pueda dictar sin confusiones.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function normalizeReferralCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const code = value.trim().toUpperCase();
  return CODE_PATTERN.test(code) ? code : null;
}

export function referralCodeFromCookieHeader(header: string | null | undefined): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === REFERRAL_COOKIE) {
      try { return normalizeReferralCode(decodeURIComponent(rest.join('='))); }
      catch { return null; }
    }
  }
  return null;
}

export function referralCookieOptions(production = process.env.NODE_ENV === 'production') {
  return { httpOnly: true, sameSite: 'lax' as const, secure: production, path: '/', maxAge: REFERRAL_MAX_AGE_SECONDS };
}

export function generateReferralCode(random: (size: number) => Uint8Array = size => crypto.getRandomValues(new Uint8Array(size)), length = 8) {
  return Array.from(random(length), byte => ALPHABET[byte % ALPHABET.length]).join('');
}

/**
 * Enlace para compartir: general → home; por propiedad → su ficha.
 * Sin prefijo de idioma a propósito: next-intl redirige al idioma del visitante (es/en/fr)
 * y el proxy ya dejó la cookie en esa primera respuesta.
 */
export function referralUrl(origin: URL | string, code: string, slug?: string | null) {
  const url = new URL(slug ? `/casas/${encodeURIComponent(slug)}` : '/', origin);
  url.searchParams.set('ref', code);
  return url.toString();
}
