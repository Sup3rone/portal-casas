import { NextRequest, NextResponse } from 'next/server';
import { db, messages } from '@portal/db';
import { and, eq } from 'drizzle-orm';
import { AccessError, accessFailure, managedResource, requirePropertyManager } from '@/lib/property-access';

export async function POST(req: NextRequest) {
  try {
    const manager = await requirePropertyManager();
    const body = await req.json().catch(() => null);
    const id = body?.id;
    if (typeof id !== 'string' || !id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    }

    const rows = await db.update(messages).set({ read: true })
      .where(and(eq(messages.id, id), managedResource(messages.propertyId, manager)))
      .returning({ id: messages.id });
    if (!rows.length) throw new AccessError(404);
    return NextResponse.json({ success: true });
  } catch (error) {
    const denied = accessFailure(error);
    if (denied) return NextResponse.json({ error: denied.message }, { status: denied.status });
    console.error('Error marcando mensaje:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
