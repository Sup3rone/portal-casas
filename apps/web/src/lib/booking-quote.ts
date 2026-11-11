import 'server-only';
// T-4738: renta automática de una reserva = cotización con las tarifas VIGENTES de la propiedad
// (base entre semana/fin de semana + temporadas), con la misma regla que vio el huésped (lib/stay-quote.ts).
import { db, properties, seasonRates } from '@portal/db';
import { eq } from 'drizzle-orm';
import { quoteStay } from './stay-quote';
import { rentFromQuote, suggestedTaxes } from './booking-breakdown';

export async function quoteBookingRent(propertyId: string, startDate: string, endDate: string) {
  const [[property], seasons] = await Promise.all([
    db.select({ weekday: properties.baseWeekdayPrice, weekend: properties.baseWeekendPrice }).from(properties).where(eq(properties.id, propertyId)).limit(1),
    db.select({ start: seasonRates.startDate, end: seasonRates.endDate, weekday: seasonRates.weekdayPrice, weekend: seasonRates.weekendPrice, priority: seasonRates.priority })
      .from(seasonRates).where(eq(seasonRates.propertyId, propertyId)),
  ]);
  if (!property) return null;
  return rentFromQuote(quoteStay(startDate, endDate, { base: property, seasons })?.total);
}

/** Valores iniciales al confirmar: renta cotizada e IVA 16 % sobre ella (el aseo aún no existe). */
export async function initialBreakdown(propertyId: string, startDate: string, endDate: string) {
  const rentAmount = await quoteBookingRent(propertyId, startDate, endDate);
  return { rentAmount, taxes: suggestedTaxes(rentAmount, null) };
}
