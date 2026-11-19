import { NextRequest, NextResponse } from 'next/server';
import { db, properties, media } from '@portal/db';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { AccessError, managedProperties, requirePropertyManager } from '@/lib/property-access';
import { managedProperty } from '@/lib/panel-server';
import { propertyInput } from '@/lib/panel-validation';
import { panelError } from '@/lib/panel-response';
import { autoTranslate } from '@/lib/auto-translation';
import { propertyGroups, propertyTranslationFields } from '@/lib/translation-groups';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const manager = await requirePropertyManager();
    const { id } = await params;
    const current = await managedProperty(id, manager);
    const changes = propertyInput(await req.json().catch(() => null));
    if (changes.sectionsEnabled) changes.sectionsEnabled = { ...current.sectionsEnabled, ...changes.sectionsEnabled, reserva: true };
    const urls = [...new Set([changes.sectionBgInicio, changes.sectionBgMapa, changes.sectionBgReserva].filter((value): value is string => typeof value === 'string'))];
    if (urls.length) {
      const photos = await db.select({ url: media.url }).from(media)
        .where(and(eq(media.propertyId, id), eq(media.type, 'PHOTO'), inArray(media.url, urls)));
      if (urls.some(url => !photos.some(photo => photo.url === url))) {
        return NextResponse.json({ error: 'validation', code: 'INVALID_BACKGROUND_PHOTO' }, { status: 400 });
      }
    }
    if ('published' in changes && manager.role !== 'ADMIN' && !manager.canPublishProperties) throw new AccessError(403);
    // T-5072: si cambian título o descripción, en/fr vacíos o automáticos se traducen desde el español.
    const touched = Object.values(propertyTranslationFields).flat().some(key => key in changes);
    const translation = touched ? await autoTranslate(propertyGroups(id, { ...current, ...changes })) : null;
    if (translation) {
      const [title, desc] = translation.groups;
      Object.assign(changes, { titleEs: title.es, titleEn: title.en, titleFr: title.fr, descEs: desc.es, descEn: desc.en, descFr: desc.fr });
    }
    // Revalidar el permiso dentro del UPDATE, no solo en el formulario.
    const publication = 'published' in changes
      ? sql`exists (select 1 from "User" actor where actor."id" = ${manager.id} and (actor."role"::text = 'ADMIN' or (actor."role"::text = 'COLLABORATOR' and actor."canPublishProperties" = true)))`
      : sql`true`;
    const rows = await db.update(properties).set(changes)
      .where(and(eq(properties.id, id), managedProperties(manager), publication))
      .returning({ id: properties.id });
    if (!rows.length) throw new AccessError(404);
    await translation?.commit();
    if (['published', 'state', 'destinationCity'].some(key => key in changes)) revalidatePath('/[locale]', 'layout');
    revalidatePath('/[locale]/casas', 'page');
    revalidatePath('/[locale]/casas/[slug]', 'page');
    revalidatePath('/[locale]/panel', 'layout');
    return NextResponse.json({ success: true, translation: translation?.outcome ?? 'none' });
  } catch (error) { return panelError(error); }
}
