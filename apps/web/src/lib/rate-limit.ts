type Flow = 'login' | 'register' | 'recovery' | 'inquiry';
const policies: Record<Flow, { limit: number; window: number }> = {
  login: { limit: 10, window: 15 * 60_000 },
  register: { limit: 5, window: 60 * 60_000 },
  recovery: { limit: 3, window: 60 * 60_000 },
  inquiry: { limit: 5, window: 15 * 60_000 },
};
const entries = new Map<string, { count: number; expires: number }>();
let lastCleanup = 0;
// Limpieza periódica al recibir peticiones, sin timers que mantengan la función viva.
export function consumeRateLimit(flow: Flow, headers: Headers, now = Date.now()) {
  if (now - lastCleanup >= 60_000) {
    for (const [key, entry] of entries) if (entry.expires <= now) entries.delete(key);
    lastCleanup = now;
  }
  const ip = headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const key = `${flow}:${ip}`;
  let entry = entries.get(key);
  if (!entry || entry.expires <= now) {
    entry = { count: 0, expires: now + policies[flow].window };
    entries.set(key, entry);
  }
  if (entry.count >= policies[flow].limit) return Math.max(1, Math.ceil((entry.expires - now) / 1000));
  entry.count++;
  return 0;
}
export function rateLimitResponse(seconds: number, locale: string) {
  const messages = {
    es: 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.',
    en: 'Too many attempts. Please wait a few minutes before trying again.',
    fr: 'Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.',
  };
  return Response.json({ code: 'RATE_LIMITED', message: messages[locale as keyof typeof messages] || messages.es },
    { status: 429, headers: { 'Retry-After': String(seconds), 'Cache-Control': 'no-store' } });
}
export function rateLimitLocale(headers: Headers) {
  try {
    const locale = new URL(headers.get('referer') || 'http://localhost/es').pathname.split('/')[1];
    if (['es', 'en', 'fr'].includes(locale)) return locale;
  } catch { /* Referer inválido: usar negociación de idioma. */ }
  return headers.get('accept-language')?.match(/\b(es|en|fr)\b/i)?.[1].toLowerCase() || 'es';
}
