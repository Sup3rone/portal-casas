import 'server-only';
import { db, properties, seasonRates, bookings, media } from '@portal/db';
import { and, eq, sql } from 'drizzle-orm';
import { AccessError, managedProperties, managedResource, type PropertyManager } from './property-access';
import { objectBody, PanelValidationError, resourceInput } from './panel-validation';

export async function createResource(id: string, resource: string, input: unknown, manager: PropertyManager) {
  const value = resourceInput(resource, objectBody(input));
  const resourceId = crypto.randomUUID();
  const scope = and(eq(properties.id, id), managedProperties(manager));
  let result;
  if (resource === 'rates') {
    const rate = value as typeof seasonRates.$inferInsert;
    result = await db.execute(sql`
      insert into "SeasonRate" ("id", "propertyId", "name", "startDate", "endDate", "weekdayPrice", "weekendPrice", "priority")
      select ${resourceId}, ${properties.id}, ${rate.name}, ${rate.startDate}::date, ${rate.endDate}::date,
        ${rate.weekdayPrice}, ${rate.weekendPrice}, ${rate.priority} from ${properties} where ${scope} returning "id"
    `);
  } else if (resource === 'blocks') {
    const block = value as { startDate: string; endDate: string };
    result = await db.execute(sql`
      insert into "Booking" ("id", "propertyId", "startDate", "endDate", "source")
      select ${resourceId}, ${properties.id}, ${block.startDate}::date, ${block.endDate}::date, 'host-block'
      from ${properties} where ${scope} and not exists (
        select 1 from "Booking" occupied where occupied."propertyId" = ${properties.id}
          and occupied."startDate" < ${block.endDate}::date and occupied."endDate" > ${block.startDate}::date
      ) returning "id"
    `);
  } else if (resource === 'media') {
    const photo = value as typeof media.$inferInsert;
    result = await db.execute(sql`
      insert into "Media" ("id", "propertyId", "url", "type", "order", "category")
      select ${resourceId}, ${properties.id}, ${photo.url}, 'PHOTO', ${photo.order}, ${photo.category}
      from ${properties} where ${scope} returning "id"
    `);
  } else throw new PanelValidationError('validation');
  if (!result.rows.length) throw new AccessError(404);
  return resourceId;
}

export async function changeResource(id: string, resource: string, resourceId: string, input: unknown, manager: PropertyManager, removing = false) {
  const value = removing ? null : resourceInput(resource, objectBody(input));
  let rows;
  if (resource === 'rates') {
    const scope = and(eq(seasonRates.id, resourceId), eq(seasonRates.propertyId, id), managedResource(seasonRates.propertyId, manager));
    rows = removing ? await db.delete(seasonRates).where(scope).returning({ id: seasonRates.id })
      : await db.update(seasonRates).set(value as typeof seasonRates.$inferInsert).where(scope).returning({ id: seasonRates.id });
  } else if (resource === 'blocks') {
    const block = value as { startDate: string; endDate: string } | null;
    const scope = and(eq(bookings.id, resourceId), eq(bookings.propertyId, id), eq(bookings.source, 'host-block'), managedResource(bookings.propertyId, manager),
      block ? sql`not exists (select 1 from "Booking" occupied where occupied."propertyId" = ${id}
        and occupied."id" <> ${resourceId} and occupied."startDate" < ${block.endDate}::date and occupied."endDate" > ${block.startDate}::date)` : sql`true`);
    rows = removing ? await db.delete(bookings).where(scope).returning({ id: bookings.id })
      : await db.update(bookings).set(block!).where(scope).returning({ id: bookings.id });
  } else if (resource === 'media') {
    const scope = and(eq(media.id, resourceId), eq(media.propertyId, id), eq(media.type, 'PHOTO'), managedResource(media.propertyId, manager));
    rows = removing ? await db.delete(media).where(scope).returning({ id: media.id })
      : await db.update(media).set(value as typeof media.$inferInsert).where(scope).returning({ id: media.id });
  } else throw new PanelValidationError('validation');
  if (!rows.length) throw new AccessError(404);
}
