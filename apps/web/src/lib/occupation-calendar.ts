import 'server-only';
import { db, properties, bookings, users, blockDates } from '@portal/db';
import { and, asc, eq, sql } from 'drizzle-orm';
import { AccessError, managedProperties, managedResource, type PropertyManager } from './property-access';
import { dateRange, objectBody, PanelValidationError } from './panel-validation';

export async function occupationCalendar(manager: PropertyManager, locale: string) {
  const title = locale === 'en' ? properties.titleEn : locale === 'fr' ? properties.titleFr : properties.titleEs;
  const [propiedades, reservations, blocks] = await Promise.all([
    db.select({ id: properties.id, slug: properties.slug, title }).from(properties).where(managedProperties(manager)).orderBy(asc(properties.slug)),
    db.select({ propertyId: bookings.propertyId, start: bookings.startDate, end: bookings.endDate, source: bookings.source, guestName: users.name })
      .from(bookings).leftJoin(users, eq(bookings.guestUserId, users.id)).where(managedResource(bookings.propertyId, manager)),
    db.select().from(blockDates).where(managedResource(blockDates.propertyId, manager)),
  ]);
  return { propiedades, bookings: [...reservations.map(row => ({ ...row, manualBlock: row.source === 'host-block', ownBlock: false })),
    ...blocks.map(row => ({ propertyId: row.propertyId, start: row.startDate, end: row.endDate, source: 'manual', guestName: null, manualBlock: true, ownBlock: row.createdBy === manager.id }))] };
}

export async function createCalendarBlock(id: string, input: unknown, manager: PropertyManager) {
  const body = objectBody(input);
  if (Object.keys(body).some(key => !['startDate', 'endDate'].includes(key))) throw new PanelValidationError('validation');
  const range = dateRange(body);
  const result = await db.execute(sql`
    insert into "BlockDate" ("id", "propertyId", "startDate", "endDate", "createdBy")
    select ${crypto.randomUUID()}, ${properties.id}, ${range.startDate}::date, ${range.endDate}::date, ${manager.id}
    from ${properties} where ${and(eq(properties.id, id), managedProperties(manager))}
      and not exists (select 1 from "Booking" b where b."propertyId" = ${properties.id}
        and b."startDate" < ${range.endDate}::date and b."endDate" > ${range.startDate}::date)
      and not exists (select 1 from "BlockDate" b where b."propertyId" = ${properties.id}
        and b."startDate" < ${range.endDate}::date and b."endDate" > ${range.startDate}::date)
    returning "id"
  `);
  if (!result.rows.length) throw new AccessError(404);
}

export async function propertyBlocks(propertyId: string, manager?: PropertyManager) {
  return db.select({ startDate: blockDates.startDate, endDate: blockDates.endDate }).from(blockDates)
    .where(and(eq(blockDates.propertyId, propertyId), manager ? managedResource(blockDates.propertyId, manager) : undefined));
}
