// src/app/api/bookings/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db, properties, users } from "@portal/db";
import { and, eq, sql } from "drizzle-orm";
import { AccessError, accessFailure, managedProperties, requirePropertyManager } from '@/lib/property-access';
import { sendEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const manager = await requirePropertyManager();
    const { propertyId, startDate, endDate, guestUserId, guestName, guestEmail } = await req.json();

    if (typeof propertyId !== 'string' || !propertyId || typeof startDate !== 'string' || typeof endDate !== 'string' || !startDate || !endDate || (guestUserId != null && typeof guestUserId !== 'string')) {
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
    const result = await db.execute(sql`
      insert into "Booking" ("id", "propertyId", "startDate", "endDate", "source", "guestUserId")
      select ${crypto.randomUUID()}, ${properties.id}, ${startDate}::date, ${endDate}::date, 'manual', ${guestUserId || null}
      from ${properties} where ${and(eq(properties.id, propertyId), managedProperties(manager), guestAccess)}
        and not exists (select 1 from "BlockDate" b where b."propertyId" = ${properties.id}
          and b."startDate" < ${endDate}::date and b."endDate" > ${startDate}::date)
      returning "id"
    `);
    if (!result.rows.length) throw new AccessError(404);

    // 📧 Email de confirmación — NUNCA rompe la reserva si falla
    try {
      // Nombre de la propiedad
      const [prop] = await db
        .select({ title: properties.titleEs, slug: properties.slug })
        .from(properties)
        .where(and(eq(properties.id, propertyId), managedProperties(manager)))
        .limit(1);

      // Si es usuario registrado, su correo de cuenta manda
      let emailDestino = guestEmail as string | undefined;
      let nombreDestino = (guestName as string) || '';

      if (guestUserId) {
        const [guest] = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, guestUserId))
          .limit(1);
        if (guest) {
          emailDestino = guest.email;
          if (!nombreDestino) nombreDestino = guest.name ?? '';
        }
      }

      if (emailDestino && prop) {
        const fmt = (d: string) => new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

        await sendEmail({
          to: emailDestino,
          subject: `✅ Tu reserva está confirmada — ${prop.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #6d4aff;">¡Reserva confirmada! 🎉</h2>
              <p>Hola ${nombreDestino || 'huesped'},</p>
              <p>Tu reserva en <strong>${prop.title}</strong> está confirmada:</p>
              <div style="background: #f5f3ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>🏠 Propiedad:</strong> ${prop.title}</p>
                <p style="margin: 4px 0;"><strong>📅 Llegada:</strong> ${fmt(startDate)}</p>
                <p style="margin: 4px 0;"><strong>🧳 Salida:</strong> ${fmt(endDate)}</p>
              </div>
              <p>¡Nos vemos pronto! Si tienes alguna duda, responde a este correo.</p>
              <p style="font-size: 13px; color: #666;">Gracias por confiar en nosotros.</p>
            </div>
          `,
        });
        console.log(`📧 Confirmación enviada a ${emailDestino}`);
      } else {
        console.log('ℹ️ Reserva creada sin email de confirmación (sin destinatario)');
      }
    } catch (emailError) {
      // El email falló, pero la reserva YA está guardada — no es fatal
      console.error('Fallo el email de confirmación (reserva OK):', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const denied = accessFailure(e);
    if (denied) return NextResponse.json({ error: denied.message }, { status: denied.status });
    console.error('Error creando booking:', e);
    return NextResponse.json({ error: 'Error interno al crear la reserva' }, { status: 500 });
  }
}
