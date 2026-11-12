// src/app/api/bookings/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db, bookings, properties } from "@portal/db";
import { and, eq, sql } from "drizzle-orm";
import { AccessError, accessFailure, managedProperties, requirePropertyManager } from '@/lib/property-access';
import { sendBookingConfirmation } from "@/lib/booking-emails";
import { propertyLocation } from "@/lib/destinations";
import { initialBreakdown } from "@/lib/booking-quote";

export async function POST(req: NextRequest) {
  try {
    const manager = await requirePropertyManager();
    const { propertyId, startDate, endDate, guestUserId, guestName, guestEmail, messageId } = await req.json();

    if (typeof propertyId !== 'string' || !propertyId || typeof startDate !== 'string' || typeof endDate !== 'string' || !startDate || !endDate || (guestUserId != null && typeof guestUserId !== 'string') || (messageId != null && typeof messageId !== 'string')) {
      return NextResponse.json(
        { error: 'Faltan datos (propertyId, startDate, endDate)' },
        { status: 400 }
      );
    }

    const start = new Date(startDate), end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Fechas inválidas', code: 'INVALID_DATES' }, { status: 400 });
    }
    if (start >= end) {
      return NextResponse.json(
        { error: 'La fecha de salida debe ser posterior a la de entrada' },
        { status: 400 }
      );
    }

    // Un colaborador no puede usar ids de huéspedes ajenos a su propiedad.
    const guestAccess = guestUserId ? sql`exists (
      select 1 from "User" actor where actor."id" = ${manager.id} and (
        actor."role" = 'ADMIN' or exists (
          select 1 from "Message" m where m."propertyId" = ${properties.id} and m."userId" = ${guestUserId}
        ) or exists (
          select 1 from "Booking" b where b."propertyId" = ${properties.id} and b."guestUserId" = ${guestUserId}
        )
      )
    )` : sql`true`;
    // T-4736: la reserva hereda la atribución de la consulta que se confirma: misma propiedad, consulta con
    // referido y que aún no haya atribuido otra reserva (una consulta = como mucho una comisión). El % se congela.
    // Sin messageId, consulta sin referido o ya usada: queda null y la reserva se guarda igual que siempre.
    const source = sql`from "Message" m where m."id" = ${messageId || null} and m."propertyId" = ${properties.id}
      and m."referredByPartnerId" is not null
      and not exists (select 1 from "Booking" prior where prior."referralMessageId" = m."id")`;
    const result = await db.execute(sql`
      insert into "Booking" ("id", "propertyId", "startDate", "endDate", "source", "guestUserId",
        "referredByPartnerId", "referralLinkId", "referralMessageId", "commissionPercent")
      select ${crypto.randomUUID()}, ${properties.id}, ${startDate}::date, ${endDate}::date, 'manual', ${guestUserId || null},
        (select m."referredByPartnerId" ${source}), (select m."referralLinkId" ${source}), (select m."id" ${source}),
        (select p."commissionPercent" from "Partner" p where p."id" = (select m."referredByPartnerId" ${source}))
      from ${properties} where ${and(eq(properties.id, propertyId), managedProperties(manager), guestAccess)}
        and not exists (select 1 from "BlockDate" b where b."propertyId" = ${properties.id}
          and b."startDate" < ${endDate}::date and b."endDate" > ${startDate}::date)
      returning "id"
    `);
    if (!result.rows.length) throw new AccessError(404);

    // T-4738: desglose inicial = renta cotizada con las tarifas vigentes + IVA 16 % (ambos editables en
    // /panel/reservas/[id]). Si la propiedad no tiene precio para todas las noches, queda vacío. Nunca rompe la reserva.
    try {
      const values = await initialBreakdown(propertyId, startDate, endDate);
      if (values.rentAmount) await db.update(bookings).set(values).where(eq(bookings.id, String(result.rows[0].id)));
    } catch (breakdownError) {
      console.error('No se pudo precargar el desglose (reserva OK):', breakdownError);
    }

    // T-4683: datos para el botón «Avisar a limpieza» (solo a quien gestiona la propiedad). Nunca rompe la reserva.
    let cleaningNotice: { phone: string; property: string; location: string } | null = null;
    try {
      const [notice] = await db
        .select({ phone: properties.cleaningWhatsapp, property: properties.titleEs, state: properties.state, destinationCity: properties.destinationCity, city: properties.city })
        .from(properties)
        .where(and(eq(properties.id, propertyId), managedProperties(manager)))
        .limit(1);
      if (notice?.phone) cleaningNotice = { phone: notice.phone, property: notice.property, location: propertyLocation(notice) };
    } catch (noticeError) {
      console.error('No se pudo leer el WhatsApp de limpieza (reserva OK):', noticeError);
    }

    // 📧 T-4772: confirmación al huésped + copia al dueño (casa, dirección, fechas, noches, importes y folio).
    // NUNCA rompe la reserva si falla.
    try {
      const sent = await sendBookingConfirmation(String(result.rows[0].id), { guestName, guestEmail, messageId });
      if (!sent.guest) console.log('ℹ️ Reserva creada sin correo al huésped (sin destinatario o falló el envío)');
    } catch (emailError) {
      console.error('Fallo el email de confirmación (reserva OK):', emailError);
    }

    return NextResponse.json({ success: true, cleaningNotice });
  } catch (e) {
    const denied = accessFailure(e);
    if (denied) return NextResponse.json({ error: denied.message }, { status: denied.status });
    console.error('Error creando booking:', e);
    return NextResponse.json({ error: 'Error interno al crear la reserva' }, { status: 500 });
  }
}
