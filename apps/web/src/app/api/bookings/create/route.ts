// src/app/api/bookings/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db, bookings, properties, users } from "@portal/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { propertyId, startDate, endDate, guestUserId, guestName, guestEmail } = await req.json();

    if (!propertyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Faltan datos (propertyId, startDate, endDate)' },
        { status: 400 }
      );
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json(
        { error: 'La fecha de salida debe ser posterior a la de entrada' },
        { status: 400 }
      );
    }

    await db.insert(bookings).values({
      id: crypto.randomUUID(),
      propertyId,
      startDate,
      endDate,
      source: 'manual',
      guestUserId: guestUserId || null,
    });

    // 📧 Email de confirmación — NUNCA rompe la reserva si falla
    try {
      // Nombre de la propiedad
      const [prop] = await db
        .select({ title: properties.titleEs, slug: properties.slug })
        .from(properties)
        .where(eq(properties.id, propertyId))
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
    console.error('Error creando booking:', e);
    return NextResponse.json({ error: 'Error interno al crear la reserva' }, { status: 500 });
  }
}
