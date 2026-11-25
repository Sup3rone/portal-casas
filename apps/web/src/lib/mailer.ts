import { Resend } from 'resend';
import nodemailer, { type Transporter } from 'nodemailer';

// T-5308: dos salidas para TODOS los correos del portal (contraseña, cuenta, reservas, consultas, reportes, avisos).
// 1) Gmail por SMTP si están GMAIL_USER y GMAIL_APP_PASSWORD (contraseña de aplicación; requiere verificación en
//    dos pasos). Mientras no haya dominio propio es la única forma gratis de entregar a cualquier destinatario.
//    Límite de Gmail: ~500 destinatarios al día. El remitente es la propia cuenta de Gmail.
//    Puerto 587 + STARTTLS obligatorio (requireTLS): si el servidor no ofrece TLS, no se envía. Se eligió 587 y no 465
//    porque algunos antivirus (Norton Mail Shield) interceptan el 465 con un certificado no confiable.
// 2) Si no, Resend. Sin EMAIL_FROM con dominio verificado, onboarding@resend.dev solo entrega al dueño de la cuenta.
// La elección se hace en cada envío (no al cargar el módulo) para que cambiar variables no deje un estado viejo.
const SENDER_NAME = 'ALIA for Rent';

let gmail: { key: string; transport: Transporter } | null = null;
function gmailTransport(user: string, pass: string) {
  const key = `${user}\n${pass}`;
  if (gmail?.key !== key) {
    gmail = { key, transport: nodemailer.createTransport({ host: 'smtp.gmail.com', port: 587, secure: false, requireTLS: true, auth: { user, pass } }) };
  }
  return gmail.transport;
}

export function mailProvider() {
  return process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim() ? 'gmail' as const : 'resend' as const;
}

// T-4739: `to` admite varios destinatarios y `attachments` (p. ej. el Excel del reporte mensual).
export async function sendEmail({ to, subject, html, attachments }: {
  to: string | string[]; subject: string; html: string; attachments?: { filename: string; content: Buffer }[];
}) {
  if (mailProvider() === 'gmail') {
    const user = process.env.GMAIL_USER!.trim();
    // La contraseña de aplicación se muestra en grupos de 4 con espacios; se acepta con o sin ellos.
    const pass = process.env.GMAIL_APP_PASSWORD!.replace(/\s+/g, '');
    try {
      await gmailTransport(user, pass).sendMail({
        from: { name: SENDER_NAME, address: user }, to, subject, html, ...(attachments?.length ? { attachments } : {}),
      });
    } catch (error) {
      // Solo el código y la respuesta del servidor: nunca credenciales.
      const info = error && typeof error === 'object' ? error as { code?: string; responseCode?: number } : {};
      const detail = [info.code, info.responseCode].filter(Boolean).join(' ');
      console.error('Error enviando email por Gmail:', detail || 'sin código');
      throw new Error(`No se pudo enviar el email (Gmail${detail ? ' ' + detail : ''})`);
    }
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  // Fase desarrollo: onboarding@resend.dev solo entrega a tu propio correo.
  // Fase producción: EMAIL_FROM="ALIA for Rent <noreply@tudominio.com>"
  const from = process.env.EMAIL_FROM || `${SENDER_NAME} <onboarding@resend.dev>`;
  const { error } = await resend.emails.send({ from, to, subject, html, ...(attachments?.length ? { attachments } : {}) });
  if (error) {
    console.error('Error enviando email:', error);
    throw new Error('No se pudo enviar el email');
  }
}
