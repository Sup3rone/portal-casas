import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db, bookings } from "@portal/db";

// Misma protección que tu /api/ical/sync: cookie admin_session válida
async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = createHash("sha256")
    .update(process.env.ADMIN_PASSWORD ?? "")
    .digest("hex");
  return req.cookies.get("admin_session")?.value === token;
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { propertyId, startDate, endDate } = await req.json();

    if (!propertyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Faltan datos (propertyId, startDate, endDate)" },
        { status: 400 }
      );
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json(
        { error: "La fecha de salida debe ser posterior a la de entrada" },
        { status: 400 }
      );
    }

    await db.insert(bookings).values({
      id: crypto.randomUUID(),
      propertyId,
      startDate,
      endDate,
      source: "manual",
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error creando booking:", e);
    return NextResponse.json(
      { error: "Error interno al crear la reserva" },
      { status: 500 }
    );
  }
}
