// T-4738: desglose de precio de una reserva (renta, aseo, impuestos) y comisión del colaborador.
// Puro (sin BD): lo usan la API (validación) y el formulario del panel (cálculo en vivo), así que
// servidor y pantalla dan exactamente el mismo número.
//
// Dinero en centavos con BigInt; nunca con flotantes.
// Comisión = renta × % congelado (Booking.commissionPercent). Aseo e impuestos NO generan comisión.
// Redondeo: a centavos, mitad hacia arriba (ROUND_HALF_UP), una sola vez al final.
//   Ej.: renta 1,234.55 × 12.50 % = 154.31875 → 154.32 · renta 100.10 × 2.50 % = 2.5025 → 2.50
//        · renta 0.10 × 5 % = 0.005 → 0.01 (la mitad sube).

export const MAX_AMOUNT = '9999999999.99'; // numeric(12,2)
const AMOUNT = /^\d{1,10}(?:\.\d{1,2})?$/;
const PERCENT = /^\d{1,3}(?:\.\d{1,2})?$/;
// Constantes BigInt sin literales `n` (el target de TS es ES2017).
const ZERO = BigInt(0), HUNDRED = BigInt(100), HALF = BigInt(5000), SCALE = BigInt(10000);

export type AmountResult = { ok: true; value: string | null } | { ok: false };

/**
 * Valida un importe del formulario/API. Vacío/null → null (sin dato, válido).
 * Acepta punto decimal, hasta 2 decimales, ≥ 0. Rechaza negativos, comas, exponentes, espacios internos y NaN.
 */
export function parseAmount(input: unknown): AmountResult {
  if (input === null || input === undefined || (typeof input === 'string' && !input.trim())) return { ok: true, value: null };
  const raw = typeof input === 'number' && Number.isFinite(input) ? String(input) : typeof input === 'string' ? input.trim() : null;
  if (raw === null || !AMOUNT.test(raw)) return { ok: false };
  return { ok: true, value: centsToAmount(toCents(raw)) };
}

/** '1234.5' → 123450n. Supone formato ya validado (AMOUNT o PERCENT). */
export function toCents(value: string): bigint {
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * HUNDRED + BigInt((fraction + '00').slice(0, 2));
}

export function centsToAmount(cents: bigint): string {
  const sign = cents < ZERO ? '-' : '';
  const abs = cents < ZERO ? -cents : cents;
  return `${sign}${abs / HUNDRED}.${String(abs % HUNDRED).padStart(2, '0')}`;
}

/** importe × % (string con 2 decimales), a centavos y mitad hacia arriba; null si falta un dato. */
export function percentOf(amount: string | null | undefined, percent: string | null | undefined): string | null {
  if (amount == null || percent == null || !AMOUNT.test(amount) || !PERCENT.test(percent)) return null;
  // centavos × (centésimas de punto porcentual) / 10000, mitad hacia arriba.
  const product = toCents(amount) * toCents(percent);
  return centsToAmount((product + HALF) / SCALE);
}

/** Comisión del colaborador = renta × % congelado. */
export const commissionAmount = (rent: string | null | undefined, percent: string | null | undefined) => percentOf(rent, percent);

/**
 * Impuestos por defecto (decisión del usuario, 10-11-2026): IVA 16 % sobre renta + aseo.
 * Solo es la sugerencia/valor inicial: el campo se puede editar.
 */
export const DEFAULT_TAX_PERCENT = '16.00';
export function suggestedTaxes(rent: string | null | undefined, cleaning: string | null | undefined) {
  if (rent == null && cleaning == null) return null;
  return percentOf(breakdownTotal([rent, cleaning]), DEFAULT_TAX_PERCENT);
}

/** Renta sugerida a partir de la cotización (enteros MXN de las tarifas) → importe con 2 decimales. */
export const rentFromQuote = (total: number | null | undefined) =>
  total == null || !Number.isSafeInteger(total) || total < 0 || total > 9_999_999_999 ? null : `${total}.00`;

/** Suma de lo capturado (renta + aseo + impuestos); null si no hay ningún dato. */
export function breakdownTotal(values: (string | null | undefined)[]): string | null {
  const present = values.filter((value): value is string => value != null && AMOUNT.test(value));
  return present.length ? centsToAmount(present.reduce((sum, value) => sum + toCents(value), ZERO)) : null;
}

export type BreakdownInput = { rentAmount: string | null; cleaningCost: string | null; taxes: string | null };
export const breakdownFields = ['rentAmount', 'cleaningCost', 'taxes'] as const;

/**
 * Valida el cuerpo del PATCH: solo estos tres campos (el % no), cada uno importe ≥ 0 o vacío (= borrar).
 * Devuelve SOLO los campos presentes: un PATCH parcial no vacía los demás. Cuerpo sin campos → inválido.
 */
export function validateBreakdown(input: unknown): { ok: true; value: Partial<BreakdownInput> } | { ok: false; fields: string[] } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, fields: [] };
  const body = input as Record<string, unknown>;
  if (Object.keys(body).some(key => !(breakdownFields as readonly string[]).includes(key))) return { ok: false, fields: [] };
  const value: Partial<BreakdownInput> = {}, fields: string[] = [];
  if (!Object.keys(body).length) return { ok: false, fields: [] };
  for (const field of breakdownFields) {
    if (!(field in body)) continue;
    const parsed = parseAmount(body[field]);
    if (parsed.ok) value[field] = parsed.value; else fields.push(field);
  }
  return fields.length ? { ok: false, fields } : { ok: true, value };
}

/** Formato de moneda para mostrar (MXN), sin pasar por flotantes al redondear. Misma convención que Inquiries. */
export function formatMoney(value: string | null, panelLocale: string) {
  if (value == null) return '—';
  const locale = panelLocale === 'en' ? 'en-GB' : panelLocale === 'fr' ? 'fr-FR' : 'es-MX';
  // Blindaje si se reutiliza fuera de este flujo: conserva el signo y exige formato decimal.
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return '—';
  const [, sign, whole, rawFraction = ''] = match, fraction = (rawFraction + '00').slice(0, 2);
  const grouped = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(BigInt(whole));
  const decimal = new Intl.NumberFormat(locale).formatToParts(1.5).find(part => part.type === 'decimal')?.value ?? '.';
  return `${sign}$${grouped}${decimal}${fraction} MXN`;
}
