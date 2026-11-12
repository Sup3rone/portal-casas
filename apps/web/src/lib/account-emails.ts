import 'server-only';
// T-4772: aviso «tu contraseña cambió» tras cambiarla en Mi cuenta o restablecerla con «olvidé mi contraseña».
// Sin enlaces ni secretos. Nunca rompe el cambio: los errores se registran y se ignoran.
import { sendEmail } from '@/lib/mailer';
import { escapeHtml } from './booking-emails';

export async function sendPasswordChangedEmail(user: { email: string; name: string | null }, via: 'account' | 'recovery') {
  const when = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Mexico_City' }).format(new Date());
  try {
    await sendEmail({
      to: user.email,
      subject: 'Tu contraseña cambió — ALIA FOR RENT',
      html: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #29251f;">
        <h2 style="color: #654838;">Tu contraseña cambió</h2>
        <p>Hola ${escapeHtml(user.name || '')},</p>
        <p>La contraseña de tu cuenta se cambió el ${escapeHtml(when)} (hora de Ciudad de México)${via === 'recovery' ? ' con el enlace de «olvidé mi contraseña»' : ' desde «Mi cuenta»'}.</p>
        <p><strong>Si no fuiste tú</strong>, entra a «¿Olvidaste tu contraseña?» para crear una nueva y responde a este correo.</p>
      </div>`,
    });
    return true;
  } catch (error) {
    console.error('No se pudo enviar el aviso de cambio de contraseña (cambio OK):', error);
    return false;
  }
}
