import 'server-only';
// T-5310: lectura de la bitácora de correos para /panel/correos. Solo ADMIN (404 para cualquier otro rol).
import { db, emailLogs } from '@portal/db';
import { and, desc, eq, sql } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { AccessError, requireAdmin } from './property-access';
import { emailKinds, type EmailKind } from './email-log';

export const EMAIL_LOG_PAGE = 50;

export async function emailLogPage() {
  try { return await requireAdmin(); }
  catch (error) { if (error instanceof AccessError) notFound(); throw error; }
}

/** Últimos envíos con filtros. `search` busca en los destinatarios (sin distinguir mayúsculas). */
export async function listEmailLog(filters: { status?: string; kind?: string; search?: string; page?: number }) {
  const page = Math.min(10000, Math.max(1, Math.floor(filters.page || 1)));
  const search = (filters.search || '').trim().toLowerCase().slice(0, 254);
  const where = and(
    filters.status === 'sent' || filters.status === 'failed' ? eq(emailLogs.status, filters.status) : undefined,
    emailKinds.includes(filters.kind as EmailKind) ? eq(emailLogs.kind, filters.kind as EmailKind) : undefined,
    search ? sql`lower(${emailLogs.recipients}::text) like ${'%' + search.replace(/[\%_]/g, '\$&') + '%'}` : undefined,
  );
  const rows = await db.select().from(emailLogs).where(where).orderBy(desc(emailLogs.createdAt)).limit(EMAIL_LOG_PAGE + 1).offset((page - 1) * EMAIL_LOG_PAGE);
  return { rows: rows.slice(0, EMAIL_LOG_PAGE), hasNext: rows.length > EMAIL_LOG_PAGE, page, search };
}
