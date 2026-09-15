// apps/web/src/app/api/messages/route.ts
import { db, messages } from '@portal/db';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {   // ← solo req, nada de params
  try {
    const formData = await req.formData();

    const propertyId = formData.get('propertyId') as string;  // ← OJO: string, no Number()
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

    const [newMessage] = await db.insert(messages).values({
      id: randomUUID(),      // ← los ids son text en tu schema, hay que generarlos
      propertyId,            // ← string, porque tu PK es text, no integer
      name,
      email,
      phone,
      lang,
      body,
      startDate,
      endDate,
      read: false,
    }).returning();

    return NextResponse.json({ success: true, message: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
