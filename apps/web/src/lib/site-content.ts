import 'server-only';
import { db, siteContent, properties, media } from '@portal/db';
import { and, asc, eq, sql } from 'drizzle-orm';
import { requireAdmin, AccessError } from './property-access';
import { objectBody, PanelValidationError } from './panel-validation';

export const siteContentKeys = ['about_es', 'about_en', 'about_fr', 'social_instagram', 'social_facebook', 'featured_property_id', 'contact_whatsapp'] as const;
export type SiteContentValues = Record<typeof siteContentKeys[number], string>;
export class SiteContentError extends PanelValidationError {
  constructor(public code: string) { super('validation'); }
}
export function siteContentInput(input: unknown): SiteContentValues {
  let body;
  try { body = objectBody(input); } catch { throw new SiteContentError('INVALID_SITE_CONTENT'); }
  if (Object.keys(body).length !== siteContentKeys.length || Object.keys(body).some(key => !siteContentKeys.includes(key as typeof siteContentKeys[number]))) {
    throw new SiteContentError('INVALID_SITE_CONTENT');
  }
  const values = {} as SiteContentValues;
  for (const key of siteContentKeys) {
    const raw = key === 'featured_property_id' && body[key] === null ? '' : body[key];
    if (typeof raw !== 'string') throw new SiteContentError('INVALID_SITE_CONTENT');
    const value = raw.trim();
    if (key.startsWith('about_')) {
      if (value.length > 2000) throw new SiteContentError('ABOUT_TOO_LONG');
    } else if (key === 'contact_whatsapp') {
      if (value && !/^[0-9]{8,15}$/.test(value)) throw new SiteContentError('INVALID_CONTACT_WHATSAPP');
    } else if (key === 'featured_property_id') {
      if (value.length > 200) throw new SiteContentError('INVALID_FEATURED_PROPERTY');
    } else if (value) {
      try {
        const url = new URL(value);
        if (value.length > 2048 || url.protocol !== 'https:' || url.username || url.password) throw new Error();
      } catch { throw new SiteContentError('INVALID_SOCIAL_URL'); }
    }
    values[key] = value;
  }
  return values;
}
export async function readSiteContent(): Promise<SiteContentValues> {
  const values = Object.fromEntries(siteContentKeys.map(key => [key, ''])) as SiteContentValues;
  for (const row of await db.select().from(siteContent)) {
    if (siteContentKeys.includes(row.key as typeof siteContentKeys[number])) values[row.key as keyof SiteContentValues] = row.value;
  }
  return values;
}
export async function saveSiteContent(input: unknown) {
  const actor = await requireAdmin();
  const values = siteContentInput(input);
  if (values.featured_property_id) {
    const [property] = await db.select({ id: properties.id }).from(properties).where(and(eq(properties.id, values.featured_property_id), eq(properties.published, true))).limit(1);
    if (!property) throw new SiteContentError('INVALID_FEATURED_PROPERTY');
  }
  // Guardado atómico de las claves; revalidar ADMIN dentro del statement.
  const rows = await db.execute(sql`
    insert into "SiteContent" ("key", "value")
    select entry.key, entry.value from (${sql.join(siteContentKeys.map(key => sql`select ${key}::text as key, ${values[key]}::text as value`), sql` union all `)}) entry
    where exists (select 1 from "User" actor where actor.id = ${actor.id} and actor.role::text = 'ADMIN')
    on conflict ("key") do update set "value" = excluded."value"
    returning "key"
  `);
  if (!rows.rows.length) throw new AccessError(403);
}

export async function featuredPropertyOptions() {
  await requireAdmin();
  return db.select({ id: properties.id, titleEs: properties.titleEs, titleEn: properties.titleEn, titleFr: properties.titleFr, city: properties.city })
    .from(properties).where(eq(properties.published, true)).orderBy(asc(properties.titleEs), asc(properties.id));
}

export function briefDescription(description: string, limit = 200) {
  const text = description.trim().replace(/\s+/g, ' ');
  if (text.length <= limit) return text;
  const prefix = text.slice(0, limit);
  const boundary = /\s/.test(text[limit]) ? limit : prefix.lastIndexOf(' ');
  return prefix.slice(0, boundary > 0 ? boundary : limit).trimEnd() + '…';
}

export async function readFeaturedProperty(id: string) {
  if (!id) return null;
  const [row] = await db.select({ property: properties, photo: media }).from(properties)
    .innerJoin(media, and(eq(media.propertyId, properties.id), eq(media.type, 'PHOTO'), sql`${media.id} = (
      select candidate.id from "Media" candidate where candidate."propertyId" = ${properties.id} and candidate.type = 'PHOTO'
      order by candidate."isCover" desc,
        case when candidate."isCover" then candidate."coverOrder" else candidate."order" end asc, candidate.id asc limit 1
    )`)).where(and(eq(properties.id, id), eq(properties.published, true))).limit(1);
  return row && row.photo.url ? row : null;
}
