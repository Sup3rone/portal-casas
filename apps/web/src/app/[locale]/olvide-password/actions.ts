'use server';

import { db, users, passwordResetTokens } from '@portal/db';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { randomUUID, randomBytes } from 'crypto';
import { sendEmail } from '@/lib/mailer';
import { emailButton } from '@/lib/email-layout';
import { headers } from 'next/headers';
import { consumeRateLimit } from '@/lib/rate-limit';
import { passwordResetUrl } from '@/lib/password-reset-url';

export async function requestPasswordReset(formData: FormData) {
  const retryAfter = consumeRateLimit('recovery', await headers());
  if (retryAfter) return { retryAfter };
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const locale = String(formData.get('locale') || 'es');

  if (email) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // ⚠️ Mensaje genérico SIEMPRE: no revelamos si el correo existe
    if (user) {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await db.insert(passwordResetTokens).values({
        id: randomUUID(),
        userId: user.id,
        token,
        expiresAt,
      });

      const resetUrl = passwordResetUrl(locale, token); // T-4771: PUBLIC_SITE_URL, como el resto del sitio

      await sendEmail({
        kind: 'password-reset',
        to: user.email,
        subject: 'Recupera tu contraseña — ALIA for Rent',
        html: `
          <div>
            <h2 style="margin: 0 0 12px; color: #654838;">Recuperación de contraseña</h2>
            <p>Hola ${user.name ?? ''},</p>
            <p>Recibimos una solicitud para cambiar la contraseña de tu cuenta. Este enlace expira en <strong>1 hora</strong>:</p>
            ${emailButton(resetUrl, 'Cambiar mi contraseña')}
            <p style="font-size: 13px; color: #666;">Si tú no pediste esto, puedes ignorar este correo tranquilamente. Tu contraseña sigue igual.</p>
          </div>
        `,
      }).catch(e => console.error('Fallo el envío (continuamos igual):', e));
    }
  }

  // Mismo destino haya ido bien, mal o correo inexistente
  redirect(`/${locale}/olvide-password?sent=1`);
}
