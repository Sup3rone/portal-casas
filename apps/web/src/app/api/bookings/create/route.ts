// src/app/api/bookings/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db, bookings } from "@portal/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // 🔒 Protección con Auth.js (el nuevo sistema, por rol)
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { propertyId, startDate, endDate, guestUserId } = await req.json();

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
      guestUserId: guestUserId || null,   // ← EL NUEVO DATO
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error creando booking:', e);
    return NextResponse.json({ error: 'Error interno al crear la reserva' }, { status: 500 });
  }
}
