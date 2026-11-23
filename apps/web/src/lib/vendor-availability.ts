import 'server-only';
// T-5200 (app del vendedor): ¿qué casas de las que gestiono están libres en estas fechas y cuánto cuestan?
// - Una estancia ocupa [start,end): la noche de salida no ocupa. Por eso el traslape es `startDate < end`
//   (no `<=` como en /casas): la casa sale libre aunque otra llegada empiece el día de salida.
// - Permisos en el servidor: solo casas de managedProperties (ADMIN todas, COLLABORATOR las suyas), publicadas o no.
// - El total sale de quoteStay (misma regla que el formulario público y la renta de la reserva); sin precio → null.
import { db, properties, seasonRates } from '@portal/db';
import { and, asc, eq, gte, inArray, sql } from 'drizzle-orm';
import { managedProperties, type PropertyManager } from './property-access';
import { quoteStay, type StayPricing } from './stay-quote';

export type VendorFilters = { start: string; end: string; guests?: number; state?: string; destinationCity?: string };
export type VendorCard = {
  id: string; slug: string; title: string; bedrooms: number; bathrooms: number; maxGuests: number;
  published: boolean; cover: string | null; nights: number; total: number | null;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function availableForVendor(filters: VendorFilters, manager: PropertyManager, locale: 'es' | 'en' | 'fr' = 'es'): Promise<VendorCard[]> {
  const { start, end } = filters;
  if (!DATE.test(start) || !DATE.test(end) || end <= start) return [];
  const title = locale === 'en' ? properties.titleEn : locale === 'fr' ? properties.titleFr : properties.titleEs;
  const rows = await db.select({
    id: properties.id, slug: properties.slug, title, bedrooms: properties.bedrooms, bathrooms: properties.bathrooms,
    maxGuests: properties.maxGuests, published: properties.published,
    weekday: properties.baseWeekdayPrice, weekend: properties.baseWeekendPrice,
    // Una portada: la primera elegida como portada; si no hay, la primera PHOTO por orden (como /casas).
    // "Property"."id" va calificado a mano: en la lista del select Drizzle escribe ${properties.id} como "id" a secas,
    // que dentro de la subconsulta resolvería a m."id".
    cover: sql<string | null>`(select m."url" from "Media" m where m."propertyId" = "Property"."id" and m."type" = 'PHOTO'
      order by m."isCover" desc, case when m."isCover" then m."coverOrder" else m."order" end asc, m."id" asc limit 1)`,
  }).from(properties)
    .where(and(managedProperties(manager),
      inArray(properties.rentalType, ['nocturna', 'ambas']),
      filters.state ? eq(properties.state, filters.state) : undefined,
      filters.destinationCity ? eq(properties.destinationCity, filters.destinationCity) : undefined,
      filters.guests !== undefined ? gte(properties.maxGuests, filters.guests) : undefined,
      sql`not exists (
        select 1 from "Booking" occupied where occupied."propertyId" = ${properties.id}
          and occupied."startDate" < ${end}::date and occupied."endDate" > ${start}::date
      ) and not exists (
        select 1 from "BlockDate" occupied where occupied."propertyId" = ${properties.id}
          and occupied."startDate" < ${end}::date and occupied."endDate" > ${start}::date
      )`))
    .orderBy(asc(properties.createdAt), asc(properties.id));
  if (!rows.length) return [];

  // Temporadas de todas las casas resultantes en una sola consulta (sin N+1).
  const seasons = await db.select({
    propertyId: seasonRates.propertyId, start: seasonRates.startDate, end: seasonRates.endDate,
    weekday: seasonRates.weekdayPrice, weekend: seasonRates.weekendPrice, priority: seasonRates.priority,
  }).from(seasonRates).where(inArray(seasonRates.propertyId, rows.map(row => row.id)));
  const seasonsByProperty = new Map<string, StayPricing['seasons']>();
  for (const { propertyId, ...season } of seasons) {
    seasonsByProperty.set(propertyId, [...seasonsByProperty.get(propertyId) ?? [], season]);
  }

  return rows.map(row => {
    const quote = quoteStay(start, end, { base: { weekday: row.weekday, weekend: row.weekend }, seasons: seasonsByProperty.get(row.id) ?? [] });
    return {
      id: row.id, slug: row.slug, title: row.title, bedrooms: Number(row.bedrooms), bathrooms: Number(row.bathrooms),
      maxGuests: Number(row.maxGuests), published: Boolean(row.published), cover: row.cover ?? null,
      nights: quote?.nights ?? 0, total: quote?.total ?? null,
    };
  });
}
