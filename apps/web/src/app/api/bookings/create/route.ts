import { NextRequest, NextResponse } from "next/server";
import { db, bookings } from "@portal/db";

// Genera el token de sesión con Web Crypto — IDÉNTICO al de proxy.ts y login
async function generarToken(password: string | undefined): Promise<string> {
  if (!password) return 'sin-password-configurada';
  const data = new TextEncoder().encode(`${password}::portal-casas-salt`);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function POST(req: NextRequest) {
  const tokenValido = await generarToken(process.env.ADMIN_PASSWORD);
  const cookieSession = req.cookies.get('admin_session')?.value;

  if (cookieSession !== tokenValido) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { propertyId, startDate, endDate } = await req.json();

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
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error creando booking:', e);
    return NextResponse.json({ error: 'Error interno al crear la reserva' }, { status: 500 });
  }
}
