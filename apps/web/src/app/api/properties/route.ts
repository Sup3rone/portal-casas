import { NextResponse } from 'next/server';
import { db, properties } from '@portal/db';
import { asc } from 'drizzle-orm';
import { accessFailure, managedProperties, requirePropertyManager } from '@/lib/property-access';

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
