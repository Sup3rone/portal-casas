// apps/web/src/app/api/[locale]/messages/route.ts
import { db, messages } from '@portal/db';
import { NextRequest, NextResponse } from 'next/server';

// ... resto del código igual

export async function POST(req: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  try {
    const formData = await req.formData();

    const propertyId = Number(formData.get('propertyId'));
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string || null;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const body = formData.get('body') as string;

    if (!propertyId || !name || !email || !startDate || !endDate || !body) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
    }

    const [newMessage] = await db.insert(messages).values({
      propertyId,
      name,
      email,
      phone,
      lang: locale,
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
