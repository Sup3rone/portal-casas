'use server';

import { db, users } from '@portal/db';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { sendEmail } from '@/lib/mailer';
import { headers } from 'next/headers';
import { consumeRateLimit } from '@/lib/rate-limit';
import { passwordResetUrl } from '@/lib/password-reset-url';
import { issueToken, resetTokens, RESET_TTL_MS } from '@/lib/auth-tokens';
import { escapeHtml } from '@/lib/email-verification';

export async function requestPasswordReset(formData: FormData) {
  const retryAfter = consumeRateLimit('recovery', await headers());
  if (retryAfter) return { retryAfter };
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const locale = String(formData.get('locale') || 'es');

  if (email) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // ⚠️ Mensaje genérico SIEMPRE: no revelamos si el correo existe
    if (user) {
      // T-4783: la base guarda solo el hash; pedir otro enlace invalida los anteriores. Dura 1 hora.
      const token = await issueToken(resetTokens, user.id, RESET_TTL_MS);

      const resetUrl = passwordResetUrl(locale, token); // T-4771: PUBLIC_SITE_URL, como el resto del sitio

      await sendEmail({
        to: user.email,
        subject: 'Recupera tu contraseña — Portal Casas',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #654838;">Recuperación de contraseña</h2>
            <p>Hola ${escapeHtml(user.name ?? '')},</p>
            <p>Recibimos una solicitud para cambiar la contraseña de tu cuenta. Este enlace expira en <strong>1 hora</strong>:</p>
            <p style="margin: 24px 0;">
              <a href="${escapeHtml(resetUrl)}" style="background: #654838; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Cambiar mi contraseña
              </a>
            </p>
            <p style="font-size: 13px; color: #666;">Si tú no pediste esto, puedes ignorar este correo tranquilamente. Tu contraseña sigue igual.</p>
          </div>
        `,
      }).catch(e => console.error('Fallo el envío (continuamos igual):', e));
    }
  }

  // Mismo destino haya ido bien, mal o correo inexistente
  redirect(`/${locale}/olvide-password?sent=1`);
}
