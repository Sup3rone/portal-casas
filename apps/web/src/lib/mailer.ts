import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Fase desarrollo: onboarding@resend.dev solo entrega a tu propio correo.
// Fase producción: EMAIL_FROM="Portal Casas <noreply@tudominio.com>"
const REMITENTE = process.env.EMAIL_FROM || 'Portal Casas <onboarding@resend.dev>';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const { error } = await resend.emails.send({ from: REMITENTE, to, subject, html });
  if (error) {
    console.error('Error enviando email:', error);
    throw new Error('No se pudo enviar el email');
  }
}
