import { NextRequest, NextResponse } from "next/server";
import { db, messages } from "@portal/db";
import { eq } from "drizzle-orm";

// Genera el token de sesión — IDÉNTICO al de proxy.ts y login
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
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Falta el id del mensaje' }, { status: 400 });
    }

    await db.delete(messages).where(eq(messages.id, id));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Error eliminando mensaje:', e);
    return NextResponse.json({ error: 'Error interno al eliminar' }, { status: 500 });
  }
}
