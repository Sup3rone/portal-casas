import { NextRequest, NextResponse } from 'next/server';
import { db, properties } from '@portal/db';
import { asc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { accessFailure, managedProperties, requirePropertyManager } from '@/lib/property-access';
import { propertyInput } from '@/lib/panel-validation';
import { panelError } from '@/lib/panel-response';
import { insertFirstIcalFeed, validateFeedInput } from '@/lib/ical-feeds';

export async function POST(req: NextRequest) {
  try {
    const manager = await requirePropertyManager();
    const body = await req.json().catch(() => null);
    // T-4739: calendario iCal opcional en el alta. Sus campos se separan ANTES de propertyInput (que rechaza claves
    // desconocidas) y el enlace se valida ANTES de escribir: si es inválido no se crea la propiedad (no queda una
    // ficha a medias). Solo para renta nocturna/ambas (el sync omite las anuales).
    const { icalUrl, icalSource, ...propertyBody } = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {} as Record<string, unknown>;
    const values = propertyInput(body && typeof body === 'object' && !Array.isArray(body) ? propertyBody : body, true);
    const ical = icalUrl == null || icalUrl === '' || values.rentalType === 'anual' ? null : validateFeedInput({ url: icalUrl, source: icalSource });
    const id = crypto.randomUUID();
    const slug = `${values.titleEs!.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'property'}-${id.slice(0, 8)}`;
    const result = await db.execute(sql`
      insert into "Property" ("id", "slug", "titleEs", "titleEn", "titleFr", "descEs", "descEn", "descFr", "address", "city", "lat", "lng", "maxGuests", "bedrooms", "bathrooms", "baseWeekdayPrice", "baseWeekendPrice", "ownerId", "published", "rentalType", "contactName", "whatsapp", "state", "destinationCity", "sectionTitles", "contactEmail", "sectionsEnabled", "sectionsOrder")
      select ${id}, ${slug}, ${values.titleEs}, ${values.titleEn}, ${values.titleFr},
        ${values.descEs}, ${values.descEn}, ${values.descFr}, ${values.address}, ${values.city},
        ${values.lat ?? null}, ${values.lng ?? null}, ${values.maxGuests}, ${values.bedrooms}, ${values.bathrooms},
        ${values.baseWeekdayPrice ?? null}, ${values.baseWeekendPrice ?? null}, actor."id", false,
        ${values.rentalType}, ${values.contactName ?? null}, ${values.whatsapp ?? null}, ${values.state ?? null}, ${values.destinationCity ?? null}, ${values.sectionTitles ? JSON.stringify(values.sectionTitles) : null}, ${values.contactEmail ?? null}, ${JSON.stringify(values.sectionsEnabled)}, ${values.sectionsOrder ? JSON.stringify(values.sectionsOrder) : null}
      from "User" actor where actor."id" = ${manager.id} and actor."role"::text in ('ADMIN', 'COLLABORATOR')
      returning "id"
    `);
    if (!result.rows.length) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    let icalFeedId: string | null = null;
    if (ical) {
      try { icalFeedId = (await insertFirstIcalFeed(id, ical)).id; }
      catch (feedError) { console.error('Propiedad creada; no se pudo guardar su calendario iCal:', feedError); }
    }
    revalidatePath('/[locale]/panel', 'layout');
    return NextResponse.json({ id, icalFeedId, icalRequested: Boolean(ical) }, { status: 201 });
  } catch (error) { return panelError(error); }
}

// Inventario de gestión; el catálogo público conserva sus rutas actuales.
export async function GET() {
  try {
    const manager = await requirePropertyManager();
    const rows = await db.select().from(properties)
      .where(managedProperties(manager)).orderBy(asc(properties.slug));
    return NextResponse.json({ properties: rows });
  } catch (error) {
    const denied = accessFailure(error);
    if (denied) return NextResponse.json({ error: denied.message }, { status: denied.status });
    console.error('Error leyendo propiedades:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
