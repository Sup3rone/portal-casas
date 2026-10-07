// apps/web/src/app/api/messages/route.ts
import { db, properties, bookings } from '@portal/db';
import { and, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';
import { propertyBlocks } from '@/lib/occupation-calendar';
import { inquiryFromFormData, inquiryToday, normalizeInquiry, validateInquiry, type InquiryErrors } from '@/lib/inquiry-validation';

const invalid = (fields: InquiryErrors, maxGuests?: number) =>
  NextResponse.json({ code: 'INVALID_INQUIRY', fields, maxGuests }, { status: 400 });

export async function POST(req: NextRequest) {
  let formData: FormData;
  try { formData = await req.formData(); }
  catch { return NextResponse.json({ code: 'INVALID_FORM_DATA' }, { status: 400 }); }
  const propertyId = formData.get('propertyId');
  if (typeof propertyId !== 'string' || !propertyId.trim()) {
    return NextResponse.json({ code: 'INVALID_PROPERTY' }, { status: 400 });
  }
  const input = inquiryFromFormData(formData);
  const basicErrors = validateInquiry(input, { today: inquiryToday() });
  if (Object.keys(basicErrors).length) return invalid(basicErrors);

  try {
    // Solo lecturas para obtener capacidad/disponibilidad; todavía no se escribe.
    const [property] = await db.select({ maxGuests: properties.maxGuests }).from(properties)
      .where(and(eq(properties.id, propertyId), eq(properties.published, true))).limit(1);
    if (!property) return NextResponse.json({ code: 'PROPERTY_NOT_FOUND' }, { status: 404 });
    const occupied = await db.select({ startDate: bookings.startDate, endDate: bookings.endDate })
      .from(bookings).where(eq(bookings.propertyId, propertyId));
    occupied.push(...await propertyBlocks(propertyId));
    const errors = validateInquiry(input, { today: inquiryToday(), maxGuests: property.maxGuests, bookings: occupied });
    if (Object.keys(errors).length) return invalid(errors, property.maxGuests);

    const value = normalizeInquiry(input);
    const session = await auth();
    const lang = (formData.get('lang') as string) || 'es';
    // Revalidar publicación, capacidad y ocupación en el INSERT por cambios concurrentes.
    // La salida también debe ser seleccionable, como exige rangoDisponible.
    const result = await db.execute(sql`
      insert into "Message" ("id", "propertyId", "name", "email", "phone", "lang", "body", "startDate", "endDate", "userId")
      select ${randomUUID()}, ${properties.id}, ${value.name}, ${value.email}, ${value.phone || null},
        ${lang}, ${value.body},
        ${value.startDate}::date, ${value.endDate}::date, ${session?.user?.id ?? null}
      from ${properties} where ${and(eq(properties.id, propertyId), eq(properties.published, true))}
        and ${properties.maxGuests} >= ${value.guests}
        and not exists (select 1 from "Booking" occupied where occupied."propertyId" = ${properties.id}
          and occupied."startDate" <= ${value.endDate}::date and occupied."endDate" > ${value.startDate}::date)
        and not exists (select 1 from "BlockDate" occupied where occupied."propertyId" = ${properties.id}
          and occupied."startDate" <= ${value.endDate}::date and occupied."endDate" > ${value.startDate}::date)
      returning *
    `);
    const newMessage = result.rows[0];
    if (!newMessage) {
      return NextResponse.json({ code: 'INQUIRY_CHANGED', fields: { endDate: 'availabilityChanged' } }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
