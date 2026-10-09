import { NextRequest, NextResponse } from 'next/server';
import { db, properties, media } from '@portal/db';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { AccessError, managedProperties, requirePropertyManager } from '@/lib/property-access';
import { managedProperty } from '@/lib/panel-server';
import { propertyInput } from '@/lib/panel-validation';
import { panelError } from '@/lib/panel-response';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const manager = await requirePropertyManager();
    const { id } = await params;
    await managedProperty(id, manager);
    const changes = propertyInput(await req.json().catch(() => null));
    const urls = [...new Set([changes.sectionBgInicio, changes.sectionBgMapa, changes.sectionBgReserva].filter((value): value is string => typeof value === 'string'))];
    if (urls.length) {
      const photos = await db.select({ url: media.url }).from(media)
        .where(and(eq(media.propertyId, id), eq(media.type, 'PHOTO'), inArray(media.url, urls)));
      if (urls.some(url => !photos.some(photo => photo.url === url))) {
        return NextResponse.json({ error: 'validation', code: 'INVALID_BACKGROUND_PHOTO' }, { status: 400 });
      }
    }
    if (changes.published === true && manager.role !== 'ADMIN') throw new AccessError(403);
    // Revalidar aprobación del admin dentro del UPDATE, no solo en el formulario.
    const publication = changes.published === true
      ? sql`exists (select 1 from "User" actor where actor."id" = ${manager.id} and actor."role"::text = 'ADMIN')`
      : sql`true`;
    const rows = await db.update(properties).set(changes)
      .where(and(eq(properties.id, id), managedProperties(manager), publication))
      .returning({ id: properties.id });
    if (!rows.length) throw new AccessError(404);
    revalidatePath('/[locale]/casas', 'page');
    revalidatePath('/[locale]/casas/[slug]', 'page');
    revalidatePath('/[locale]/panel', 'layout');
    return NextResponse.json({ success: true });
  } catch (error) { return panelError(error); }
}
