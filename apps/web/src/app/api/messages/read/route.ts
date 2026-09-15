import { NextRequest, NextResponse } from 'next/server';
import { db, messages } from '@portal/db';
import { eq } from 'drizzle-orm';
import { createHash } from 'crypto';

// Mismo token que el proxy — así nadie sin sesión puede tocar este endpoint
function tokenValido(password: string | undefined): string {
  return createHash('sha256')
    .update(`${password}::portal-casas-salt`)
    .digest('hex');
}

export async function POST(req: NextRequest) {
  // Protección: solo sesiones admin
  const cookie = req.cookies.get('admin_session')?.value;
  if (cookie !== tokenValido(process.env.ADMIN_PASSWORD)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = body?.id;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id requerido' }, { status: 400 });
  }

  await db.update(messages).set({ read: true }).where(eq(messages.id, id));

  return NextResponse.json({ success: true });
}
