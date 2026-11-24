import 'server-only';
// T-5208 (app del vendedor, pantalla 3): cotización de una estancia para enseñarla al cliente.
// - Noches y precios con la regla ÚNICA de stay-quote.ts (la misma que la reserva y el formulario público).
// - Limpieza = Property.cleaningPrice (T-5206); null = «por confirmar».
// - IVA = suggestedTaxes (16 % sobre renta + aseo, regla vigente) y total con los mismos centavos BigInt que /panel/reservas.
// - Comisión = renta × % del referidor (Partner activo) ligado a quien cotiza: misma fórmula que /panel/reservas
//   (commissionAmount, solo sobre la renta). Sin referidor propio → null. Nunca sale en WhatsApp (vendor-share.ts).
// - Permisos en el servidor: casa no gestionada por `manager` → null (la página responde 404).
import { db, properties, seasonRates, bookings, blockDates, partners, referralLinks } from '@portal/db';
import { and, asc, eq, gt, isNull, lt, or, sql } from 'drizzle-orm';
import { managedProperties, type PropertyManager } from './property-access';
import { stayNights } from './stay-quote';
import { breakdownTotal, commissionAmount, rentFromQuote, suggestedTaxes } from './booking-breakdown';

export type QuoteLine = { season: string | null; weekend: boolean; nights: number; price: number };
export type VendorQuote = {
  nights: number; weekdayNights: number; weekendNights: number; lines: QuoteLine[];
  rent: string | null; cleaning: string | null; taxes: string | null; total: string | null;
  commission: { percent: string; amount: string } | null; overlap: boolean;
  /** Código de referido del vendedor para esta casa (o su enlace general): el WhatsApp lo lleva para que la venta
   *  se le atribuya y la comisión prometida exista en la reserva. null = sin referidor activo o sin enlace. */
  referralCode: string | null;
};

/** Tope de cálculo para la cotización y la ficha del vendedor: más de un año de estancia no se cotiza aquí. */
export const MAX_STAY_NIGHTS = 365;
export const stayTooLong = (start: string, end: string) => (Date.parse(end + 'T00:00:00Z') - Date.parse(start + 'T00:00:00Z')) / 86_400_000 > MAX_STAY_NIGHTS;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const valid = (value: string) => DATE.test(value) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
const integer = (value: unknown) => value == null ? null : Number(value);

export async function vendorQuote(propertyId: string, start: string, end: string, manager: PropertyManager): Promise<VendorQuote | null> {
  if (!valid(start) || !valid(end) || end <= start || stayTooLong(start, end)) return null;
  const [property] = await db.select({ weekday: properties.baseWeekdayPrice, weekend: properties.baseWeekendPrice, cleaning: properties.cleaningPrice })
    .from(properties).where(and(eq(properties.id, propertyId), managedProperties(manager))).limit(1);
  if (!property) return null;
  const [seasons, booked, blocked, [partner]] = await Promise.all([
    db.select({ name: seasonRates.name, start: seasonRates.startDate, end: seasonRates.endDate, weekday: seasonRates.weekdayPrice, weekend: seasonRates.weekendPrice, priority: seasonRates.priority })
      .from(seasonRates).where(eq(seasonRates.propertyId, propertyId)),
    db.select({ start: bookings.startDate, end: bookings.endDate }).from(bookings)
      .where(and(eq(bookings.propertyId, propertyId), lt(bookings.startDate, sql`${end}::date`), gt(bookings.endDate, sql`${start}::date`))),
    db.select({ start: blockDates.startDate, end: blockDates.endDate }).from(blockDates)
      .where(and(eq(blockDates.propertyId, propertyId), lt(blockDates.startDate, sql`${end}::date`), gt(blockDates.endDate, sql`${start}::date`))),
    db.select({ id: partners.id, percent: partners.commissionPercent }).from(partners).where(and(eq(partners.userId, manager.id), eq(partners.active, true))).limit(1),
  ]);
  // Enlace de esta casa primero (propertyId no nulo ordena antes en ambos motores con `is null` asc), luego el general.
  const [link] = partner ? await db.select({ code: referralLinks.code }).from(referralLinks)
    .where(and(eq(referralLinks.partnerId, partner.id), or(eq(referralLinks.propertyId, propertyId), isNull(referralLinks.propertyId))))
    .orderBy(sql`${referralLinks.propertyId} is null`, asc(referralLinks.createdAt), asc(referralLinks.id)).limit(1) : [];
  const nights = stayNights(start, end, {
    base: { weekday: integer(property.weekday), weekend: integer(property.weekend) },
    seasons: seasons.map(season => ({ name: season.name, start: String(season.start), end: String(season.end), weekday: Number(season.weekday), weekend: Number(season.weekend), priority: Number(season.priority) })),
    booked: [...booked, ...blocked].map(range => ({ start: String(range.start), end: String(range.end) })),
  })!;

  const lines: QuoteLine[] = [];
  for (const night of nights) {
    if (night.price == null) continue;
    const line = lines.find(item => item.season === night.season && item.weekend === night.weekend && item.price === night.price);
    if (line) line.nights++;
    else lines.push({ season: night.season, weekend: night.weekend, nights: 1, price: night.price });
  }
  const priced = nights.every(night => night.price != null);
  const rent = priced ? rentFromQuote(nights.reduce((sum, night) => sum + night.price!, 0)) : null;
  const cleaning = rentFromQuote(integer(property.cleaning));
  const taxes = rent == null ? null : suggestedTaxes(rent, cleaning);
  const percent = partner?.percent == null ? null : Number(partner.percent).toFixed(2);
  const commissionValue = rent && percent ? commissionAmount(rent, percent) : null;
  return {
    nights: nights.length,
    weekdayNights: nights.filter(night => !night.weekend).length,
    weekendNights: nights.filter(night => night.weekend).length,
    lines, rent, cleaning, taxes,
    total: rent == null ? null : breakdownTotal([rent, cleaning, taxes]),
    commission: percent && commissionValue ? { percent, amount: commissionValue } : null,
    overlap: nights.some(night => night.booked),
    referralCode: link?.code ?? null,
  };
}
