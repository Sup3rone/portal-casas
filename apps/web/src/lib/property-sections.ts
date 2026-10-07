import 'server-only';
import { db, properties, propertySections, media } from '@portal/db';
import { and, asc, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { AccessError, accessFailure, managedProperties, managedResource, type PropertyManager } from './property-access';
import { objectBody, PanelValidationError } from './panel-validation';
import { panelError } from './panel-response';

export const sectionNames = ['destino', 'amenidades', 'habitaciones', 'lugar', 'advertencias'] as const;
export type SectionName = typeof sectionNames[number];
export type EditorialSection = typeof propertySections.$inferSelect;
class SectionValidationError extends PanelValidationError {
  constructor(public code: string) { super('validation'); }
}
export function sectionInput(section: string, input: unknown) {
  if (!sectionNames.includes(section as SectionName)) throw new SectionValidationError('INVALID_SECTION');
  let body;
  try { body = objectBody(input); } catch { throw new SectionValidationError('INVALID_SECTION_CONTENT'); }
  const fields = ['descriptionEs', 'descriptionEn', 'descriptionFr', 'heroMediaId'] as const;
  if (Object.keys(body).some(key => key !== 'photoMediaIds' && !fields.includes(key as typeof fields[number])) || fields.some(key => !(key in body))) {
    throw new SectionValidationError('INVALID_SECTION_CONTENT');
  }
  const value = {} as Record<typeof fields[number], string | null>;
  for (const key of fields) {
    if (body[key] !== null && (typeof body[key] !== 'string' || (body[key] as string).length > (key === 'heroMediaId' ? 200 : 10000))) {
      throw new SectionValidationError('INVALID_SECTION_CONTENT');
    }
    value[key] = typeof body[key] === 'string' ? (body[key] as string).trim() || null : null;
  }
  const ids = body.photoMediaIds ?? null;
  if (ids !== null && (!Array.isArray(ids) || ids.length > 2 || ids.some(id => typeof id !== 'string' || !id.trim() || id.length > 200) || new Set(ids).size !== ids.length)) {
    throw new SectionValidationError('INVALID_SECTION_PHOTOS');
  }
  return { ...value, photoMediaIds: ids as string[] | null };
}
export async function sectionsForProperty(id: string, manager: PropertyManager) {
  return db.select().from(propertySections)
    .where(and(eq(propertySections.propertyId, id), managedResource(propertySections.propertyId, manager)))
    .orderBy(asc(propertySections.section));
}
export async function savePropertySection(id: string, section: string, input: unknown, manager: PropertyManager) {
  const value = sectionInput(section, input);
  if (value.heroMediaId !== null) {
    const [hero] = await db.select({ id: media.id }).from(media)
      .where(and(eq(media.id, value.heroMediaId), eq(media.propertyId, id), eq(media.type, 'PHOTO'), managedResource(media.propertyId, manager))).limit(1);
    if (!hero) throw new SectionValidationError('INVALID_HERO');
  }
  for (const photoId of value.photoMediaIds || []) {
    const [photo] = await db.select({ id: media.id }).from(media)
      .where(and(eq(media.id, photoId), eq(media.propertyId, id), eq(media.type, 'PHOTO'), managedResource(media.propertyId, manager))).limit(1);
    if (!photo) throw new SectionValidationError('INVALID_SECTION_PHOTOS');
  }
  // Revalidar dueño y PHOTO dentro del UPSERT para cambios posteriores a la lectura.
  const heroScope = value.heroMediaId === null ? sql`true` : sql`exists (
    select 1 from "Media" hero where hero."id" = ${value.heroMediaId}
      and hero."propertyId" = ${id} and hero."type"::text = 'PHOTO'
  )`;
  const photoScope = and(sql`true`, ...(value.photoMediaIds || []).map(photoId => sql`exists (
    select 1 from "Media" photo where photo."id" = ${photoId} and photo."propertyId" = ${id} and photo."type"::text = 'PHOTO'
  )`));
  const photoIds = value.photoMediaIds?.length ? JSON.stringify(value.photoMediaIds) : null;
  const result = await db.execute(sql`
    insert into "PropertySection" ("propertyId", "section", "descriptionEs", "descriptionEn", "descriptionFr", "heroMediaId", "photoMediaIds")
    select ${properties.id}, ${section}, ${value.descriptionEs}, ${value.descriptionEn}, ${value.descriptionFr}, ${value.heroMediaId}, ${photoIds}
    from ${properties} where ${and(eq(properties.id, id), managedProperties(manager), heroScope, photoScope)}
    on conflict ("propertyId", "section") do update set
      "descriptionEs" = excluded."descriptionEs", "descriptionEn" = excluded."descriptionEn",
      "descriptionFr" = excluded."descriptionFr", "heroMediaId" = excluded."heroMediaId", "photoMediaIds" = excluded."photoMediaIds"
    where ${managedResource(propertySections.propertyId, manager)} and ${heroScope} and ${photoScope}
    returning *
  `);
  if (!result.rows.length) throw new AccessError(404);
}
export function sectionError(error: unknown) {
  if (error instanceof SectionValidationError) return NextResponse.json({ error: 'validation', code: error.code }, { status: 400 });
  const denied = accessFailure(error);
  if (denied) return NextResponse.json({ error: denied.message,
    code: denied.code || (denied.status === 401 ? 'UNAUTHENTICATED' : denied.status === 403 ? 'FORBIDDEN' : 'PROPERTY_NOT_FOUND'),
  }, { status: denied.status });
  return panelError(error);
}
