import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db, media } from '@portal/db';
import { and, asc, eq, sql } from 'drizzle-orm';
import { AccessError, managedResource, requirePropertyManager } from '@/lib/property-access';
import { managedProperty } from '@/lib/panel-server';
import { sectionError } from '@/lib/property-sections';

type Context = { params: Promise<{ id: string }> };
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const manager = await requirePropertyManager(), { id } = await params;
    await managedProperty(id, manager);
    const photos = await db.select().from(media).where(and(eq(media.propertyId, id), eq(media.type, 'PHOTO'), eq(media.isCover, true), managedResource(media.propertyId, manager)))
      .orderBy(asc(media.coverOrder), asc(media.id)).limit(5);
    return NextResponse.json({ mediaIds: photos.map(photo => photo.id) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return sectionError(error); }
}
export async function PUT(req: NextRequest, { params }: Context) {
  try {
    const manager = await requirePropertyManager(), { id } = await params;
    await managedProperty(id, manager);
    const body = await req.json().catch(() => null);
    const ids: unknown = body?.mediaIds;
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || !Array.isArray(ids) || ids.length > 5 ||
      ids.some(value => typeof value !== 'string' || !value.trim() || value.length > 200) || new Set(ids).size !== ids.length) {
      return NextResponse.json({ error: 'validation', code: 'INVALID_COVER_SELECTION' }, { status: 400 });
    }
    const photoIds = ids as string[];
    for (const photoId of photoIds) {
      const [photo] = await db.select({ id: media.id }).from(media).where(and(eq(media.id, photoId), eq(media.propertyId, id), eq(media.type, 'PHOTO'), managedResource(media.propertyId, manager))).limit(1);
      if (!photo) return NextResponse.json({ error: 'validation', code: 'INVALID_COVER_PHOTO' }, { status: 400 });
    }
    // Un único UPDATE reemplaza selección y orden; revalida PHOTO/dueño al escribir.
    const validPhotos = photoIds.map(photoId => sql`exists (select 1 from "Media" photo where photo.id = ${photoId} and photo."propertyId" = ${id} and photo.type = 'PHOTO')`);
    const isCover = photoIds.length ? sql`${media.id} in (${sql.join(photoIds.map(photoId => sql`${photoId}`), sql`, `)})` : sql`false`;
    const coverOrder = photoIds.length ? sql`case ${media.id} ${sql.join(photoIds.map((photoId, index) => sql`when ${photoId} then cast(${index} as integer)`), sql` `)} else null end` : sql`null`;
    const rows = await db.update(media).set({ isCover, coverOrder })
      .where(and(eq(media.propertyId, id), managedResource(media.propertyId, manager), ...validPhotos)).returning({ id: media.id });
    if (!rows.length && photoIds.length) throw new AccessError(404);
    revalidatePath('/[locale]/panel', 'layout');
    revalidatePath('/[locale]/casas', 'page');
    return NextResponse.json({ success: true, mediaIds: photoIds }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return sectionError(error); }
}
