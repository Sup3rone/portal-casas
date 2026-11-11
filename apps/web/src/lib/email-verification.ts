import 'server-only';
// T-4783: «Confirma tu correo — ALIA FOR RENT». Emite el token (24 h, invalida los anteriores) y envía el
// enlace. Nunca lanza: si la base o Resend fallan se registra y devuelve false (el registro sigue).
import { sendEmail } from '@/lib/mailer';
import { issueToken, verifyTokens, VERIFY_TTL_MS } from './auth-tokens';
import { emailVerificationUrl } from './password-reset-url';

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

export function verificationEmail(name: string | null, url: string) {
  const href = escapeHtml(url);
  return {
    subject: 'Confirma tu correo — ALIA FOR RENT',
    html: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #29251f;">
      <h2 style="color: #654838;">Confirma tu correo</h2>
      <p>Hola ${escapeHtml(name || '')},</p>
      <p>Gracias por crear tu cuenta. Confirma que este correo es tuyo; el enlace dura <strong>24 horas</strong> y sirve una sola vez:</p>
      <p style="margin: 24px 0;">
        <a href="${href}" style="background: #654838; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Confirmar mi correo</a>
      </p>
      <p style="font-size: 13px; color: #666;">Si el botón no funciona, copia esta dirección en el navegador:<br>${href}</p>
      <p style="font-size: 13px; color: #666;">Si tú no creaste esta cuenta, ignora este correo.</p>
    </div>`,
  };
}

export async function sendVerificationEmail(user: { id: string; email: string; name: string | null }, locale: string) {
  try {
    const token = await issueToken(verifyTokens, user.id, VERIFY_TTL_MS);
    await sendEmail({ to: user.email, ...verificationEmail(user.name, emailVerificationUrl(locale, token)) });
    return true;
  } catch (error) {
    console.error('No se pudo enviar la confirmación de correo (la cuenta sigue):', error);
    return false;
  }
}
