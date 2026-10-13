import 'server-only';
import { cache } from 'react';
import { db, properties, media } from '@portal/db';
import { and, eq, sql } from 'drizzle-orm';

// Compartido por página y metadata; cache solo durante el render, no entre visitas.
export const readPublishedProperty = cache(async (slug: string) => {
  const [property] = await db.select().from(properties).where(and(eq(properties.slug, slug), eq(properties.published, true))).limit(1);
  return property;
});
export async function propertySeoPhoto(propertyId: string) {
  const [photo] = await db.select({ url: media.url }).from(media)
    .where(and(eq(media.propertyId, propertyId), eq(media.type, 'PHOTO')))
    .orderBy(sql`${media.isCover} desc`, sql`case when ${media.isCover} then ${media.coverOrder} else ${media.order} end asc`, media.id).limit(1);
  return photo?.url;
}
