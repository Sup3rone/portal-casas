// apps/web/src/app/api/messages/route.ts
import { db, properties } from '@portal/db';
import { and, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // ¿Hay sesión activa? (si no, undefined → mensaje anónimo, como hoy)
    const session = await auth();

    const formData = await req.formData();

    const propertyId = formData.get('propertyId') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = (formData.get('phone') as string) || null;
    const startDate = (formData.get('startDate') as string) || null;
    const endDate = (formData.get('endDate') as string) || null;
    const body = formData.get('body') as string;
    const lang = (formData.get('lang') as string) || 'es';

    if (!propertyId || !name || !email || !startDate || !endDate || !body) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    // La consulta pública solo puede dirigirse a una propiedad publicada.
    const result = await db.execute(sql`
      insert into "Message" ("id", "propertyId", "name", "email", "phone", "lang", "body", "startDate", "endDate", "userId")
      select ${randomUUID()}, ${properties.id}, ${name}, ${email}, ${phone}, ${lang}, ${body},
        ${startDate}::date, ${endDate}::date, ${session?.user?.id ?? null}
      from ${properties} where ${and(eq(properties.id, propertyId), eq(properties.published, true))}
      returning *
    `);
    const newMessage = result.rows[0];
    if (!newMessage) return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });

    return NextResponse.json({ success: true, message: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
