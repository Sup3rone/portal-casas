import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const password = formData.get('password') as string;

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.redirect(new URL('/es/admin/login?error=1', req.url), { status: 303 });
    }

    // Token = hash del password (nunca guardamos la clave en la cookie)
    async function generarToken(password: string): Promise<string> {
      const data = new TextEncoder().encode(`${password}::portal-casas-salt`);
      const buffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    // Y en el POST:
    const token = await generarToken(process.env.ADMIN_PASSWORD!);

    const res = NextResponse.json({ success: true });
    res.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',          // ← ESTO es lo que salva la vida, que llegue a TODAS las rutas
      maxAge: 60 * 60 * 24 * 7  // 7 días, a tu gusto
    });
    return res;
  } catch {
    return NextResponse.redirect(new URL('/es/admin/login?error=1', req.url), { status: 303 });
  }
}
