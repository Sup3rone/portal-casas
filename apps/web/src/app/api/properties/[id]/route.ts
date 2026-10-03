import { NextRequest, NextResponse } from 'next/server';
import { db, properties } from '@portal/db';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { AccessError, accessFailure, managedProperties, requirePropertyManager } from '@/lib/property-access';

// Lista explícita: ni ownerId, ni id, ni createdAt se aceptan por asignación masiva.
const textos = ['titleEs', 'titleEn', 'titleFr', 'descEs', 'descEn', 'descFr', 'address', 'city'] as const;
const enteros = ['maxGuests', 'bedrooms'] as const;
const precios = ['baseWeekdayPrice', 'baseWeekendPrice'] as const;
const campos = new Set<string>([...textos, ...enteros, ...precios, 'bathrooms', 'lat', 'lng', 'published']);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const manager = await requirePropertyManager();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        !Object.keys(body).length || Object.keys(body).some(key => !campos.has(key))) {
      return NextResponse.json({ error: 'Campos inválidos' }, { status: 400 });
    }
    const cambios: Partial<typeof properties.$inferInsert> = {};
    for (const key of textos) {
      if (key in body) {
        if (typeof body[key] !== 'string' || !body[key].trim()) {
          return NextResponse.json({ error: 'Texto inválido' }, { status: 400 });
        }
        cambios[key] = body[key];
      }
    }
    for (const key of [...enteros, ...precios]) {
      if (key in body) {
        const value = body[key];
        if (!(precios.includes(key as typeof precios[number]) && value === null) &&
            (typeof value !== 'number' || !Number.isInteger(value) || value < (key === 'maxGuests' ? 1 : 0) || value > 2147483647)) {
          return NextResponse.json({ error: 'Número inválido' }, { status: 400 });
        }
        cambios[key] = value;
      }
    }
    for (const key of ['bathrooms', 'lat', 'lng'] as const) {
      if (key in body) {
        const value = body[key];
        if (!(key !== 'bathrooms' && value === null) &&
            (typeof value !== 'number' || !Number.isFinite(value) ||
              (key === 'bathrooms' && value < 0) || (key === 'lat' && Math.abs(value) > 90) ||
              (key === 'lng' && Math.abs(value) > 180))) {
          return NextResponse.json({ error: 'Número inválido' }, { status: 400 });
        }
        cambios[key] = value;
      }
    }
    if ('published' in body) {
      if (typeof body.published !== 'boolean') return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
      cambios.published = body.published;
    }
    const rows = await db.update(properties).set(cambios)
      .where(and(eq(properties.id, id), managedProperties(manager)))
      .returning({ id: properties.id });
    if (!rows.length) throw new AccessError(404);
    revalidatePath('/[locale]/casas', 'page');
    revalidatePath('/[locale]/casas/[slug]', 'page');
    return NextResponse.json({ success: true });
  } catch (error) {
    const denied = accessFailure(error);
    if (denied) return NextResponse.json({ error: denied.message }, { status: denied.status });
    console.error('Error actualizando propiedad:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
