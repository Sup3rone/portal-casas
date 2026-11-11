'use server';
// T-4783: reenviar «Confirma tu correo». Con sesión se usa la cuenta de la sesión (nunca el correo del
// formulario); sin sesión, el correo escrito. Respuesta genérica: no revela si la cuenta existe o ya confirmó.
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db, users } from '@portal/db';
import { auth } from '@/lib/auth';
import { consumeRateLimit } from '@/lib/rate-limit';
import { sendVerificationEmail } from '@/lib/email-verification';

const LOCALES = ['es', 'en', 'fr'];

export async function resendVerification(formData: FormData) {
  const raw = String(formData.get('locale') || 'es');
  const locale = LOCALES.includes(raw) ? raw : 'es';
  if (consumeRateLimit('verify', await headers())) redirect(`/${locale}/confirmar-correo?limite=1`);
  const sessionId = (await auth())?.user?.id;
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const columns = { id: users.id, email: users.email, name: users.name, emailVerifiedAt: users.emailVerifiedAt };
  const [user] = sessionId
    ? await db.select(columns).from(users).where(eq(users.id, sessionId)).limit(1)
    : email ? await db.select(columns).from(users).where(eq(users.email, email)).limit(1) : [];
  if (user && !user.emailVerifiedAt) await sendVerificationEmail(user, locale); // nunca lanza
  redirect(sessionId ? `/${locale}/mi-cuenta?correo=reenviado` : `/${locale}/confirmar-correo?reenviado=1`);
}
