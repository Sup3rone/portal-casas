// T-5310: registro de cada correo enviado (lo llama sendEmail). Nunca guarda el contenido.
import { db, emailKinds, emailLogs } from '@portal/db';
import { lt } from 'drizzle-orm';

export type EmailKind = typeof emailKinds[number];
export { emailKinds };
export const EMAIL_LOG_DAYS = 90;

// Errores de BD (traen SQL y parámetros) no se guardan tal cual.
function cleanError(error: string | null) {
  if (!error) return null;
  return /failed query|neondberror|syntax|relation|column/i.test(error) ? 'INTERNAL_ERROR' : error.slice(0, 300);
}

/**
 * Deja la fila del envío y borra lo que tenga más de EMAIL_LOG_DAYS días. NUNCA lanza: un fallo del registro
 * (p. ej. tabla aún sin crear) no puede romper el envío del correo; solo queda en el log del servidor.
 */
export async function recordEmail(entry: { kind: EmailKind; to: string | string[]; subject: string; status: 'sent' | 'failed'; provider: 'gmail' | 'resend'; error?: string | null }, now = new Date()) {
  try {
    await db.insert(emailLogs).values({
      id: crypto.randomUUID(), kind: emailKinds.includes(entry.kind) ? entry.kind : 'other',
      recipients: (Array.isArray(entry.to) ? entry.to : [entry.to]).map(value => value.trim().toLowerCase()),
      subject: entry.subject.slice(0, 300), status: entry.status, provider: entry.provider, error: cleanError(entry.error ?? null), createdAt: now,
    });
    await db.delete(emailLogs).where(lt(emailLogs.createdAt, new Date(now.getTime() - EMAIL_LOG_DAYS * 86_400_000)));
  } catch (error) {
    console.error('No se pudo registrar el correo en la bitácora (el envío no se ve afectado):', error);
  }
}
