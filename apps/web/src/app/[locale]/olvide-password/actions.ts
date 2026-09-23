'use server';

import { db, users, passwordResetTokens } from '@portal/db';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { randomUUID, randomBytes } from 'crypto';
import { sendEmail } from '@/lib/mailer';

export async function requestPasswordReset(formData: FormData) {
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

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const resetUrl = `${baseUrl}/${locale}/reset-password?token=${token}`;

      await sendEmail({
        to: user.email,
        subject: 'Recupera tu contraseña — Portal Casas',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #6d4aff;">Recuperación de contraseña</h2>
            <p>Hola ${user.name ?? ''},</p>
            <p>Recibimos una solicitud para cambiar la contraseña de tu cuenta. Este enlace expira en <strong>1 hora</strong>:</p>
            <p style="margin: 24px 0;">
              <a href="${resetUrl}" style="background: #6d4aff; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
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
