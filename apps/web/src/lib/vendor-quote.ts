import 'server-only';
// T-5208 (app del vendedor, pantalla 3): cotización de una estancia para enseñarla al cliente.
// - Noches y precios con la regla ÚNICA de stay-quote.ts (la misma que la reserva y el formulario público).
// - Limpieza = Property.cleaningPrice (T-5206); null = «por confirmar».
// - IVA = suggestedTaxes (16 % sobre renta + aseo, regla vigente) y total con los mismos centavos BigInt que /panel/reservas.
// - Comisión = renta × % del referidor (Partner activo) ligado a quien cotiza: misma fórmula que /panel/reservas
//   (commissionAmount, solo sobre la renta). Sin referidor propio → null. Nunca sale en WhatsApp (vendor-share.ts).
// - Permisos en el servidor: casa no gestionada por `manager` → null (la página responde 404).
import { db, properties, seasonRates, bookings, blockDates, partners } from '@portal/db';
import { and, eq, gt, lt, sql } from 'drizzle-orm';
import { managedProperties, type PropertyManager } from './property-access';
import { stayNights } from './stay-quote';
import { breakdownTotal, commissionAmount, rentFromQuote, suggestedTaxes } from './booking-breakdown';

export type QuoteLine = { season: string | null; weekend: boolean; nights: number; price: number };
export type VendorQuote = {
  nights: number; weekdayNights: number; weekendNights: number; lines: QuoteLine[];
  rent: string | null; cleaning: string | null; taxes: string | null; total: string | null;
  commission: { percent: string; amount: string } | null; overlap: boolean;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const valid = (value: string) => DATE.test(value) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
const integer = (value: unknown) => value == null ? null : Number(value);

export async function vendorQuote(propertyId: string, start: string, end: string, manager: PropertyManager): Promise<VendorQuote | null> {
  if (!valid(start) || !valid(end) || end <= start) return null;
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
    db.select({ percent: partners.commissionPercent }).from(partners).where(and(eq(partners.userId, manager.id), eq(partners.active, true))).limit(1),
  ]);
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
  };
}
