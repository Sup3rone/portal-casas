import 'server-only';
import { db, siteContent } from '@portal/db';
import { sql } from 'drizzle-orm';
import { requireAdmin, AccessError } from './property-access';
import { objectBody, PanelValidationError } from './panel-validation';

export const siteContentKeys = ['about_es', 'about_en', 'about_fr', 'social_instagram', 'social_facebook'] as const;
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
    if (typeof body[key] !== 'string') throw new SiteContentError('INVALID_SITE_CONTENT');
    const value = body[key].trim();
    if (key.startsWith('about_')) {
      if (value.length > 2000) throw new SiteContentError('ABOUT_TOO_LONG');
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
  // Guardado atómico de las cinco claves; revalidar ADMIN dentro del statement.
  const rows = await db.execute(sql`
    insert into "SiteContent" ("key", "value")
    select entry.key, entry.value from (${sql.join(siteContentKeys.map(key => sql`select ${key}::text as key, ${values[key]}::text as value`), sql` union all `)}) entry
    where exists (select 1 from "User" actor where actor.id = ${actor.id} and actor.role::text = 'ADMIN')
    on conflict ("key") do update set "value" = excluded."value"
    returning "key"
  `);
  if (!rows.rows.length) throw new AccessError(403);
}
