// T-4739: cron mensual (Vercel Cron, vercel.json → "0 13 1 * *" = día 1, 07:00 en Ciudad de México).
// Envía a cada colaborador con destinatarios el reporte del MES ANTERIOR según la fecha de hoy en
// America/Mexico_City. Vercel manda `Authorization: Bearer $CRON_SECRET`; sin CRON_SECRET configurado
// el endpoint se niega (falla cerrado).
//
// Simulación manual (local o preview, con CRON_SECRET en el entorno):
//   curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/monthly-report?month=2026-10"
// `?month=` solo existe para pruebas: con el mismo secreto y validado (YYYY-MM).
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { inquiryToday } from '@/lib/inquiry-validation';
import { isMonth, previousMonth } from '@/lib/monthly-report';
import { runMonthlyReports } from '@/lib/monthly-report-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(header: string | null) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16 || !header) return false;
  const expected = Buffer.from(`Bearer ${secret}`), received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) console.error('CRON_SECRET no configurado: el reporte mensual automático no se puede ejecutar.');
  else if (secret.length < 16) console.error('CRON_SECRET demasiado corto (< 16): el cron se rechaza. Configura uno aleatorio más largo.');
  if (!authorized(req.headers.get('authorization'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const override = new URL(req.url).searchParams.get('month');
  if (override !== null && !isMonth(override)) return NextResponse.json({ error: 'validation' }, { status: 400 });
  const month = override ?? previousMonth(inquiryToday());
  try {
    const summary = await runMonthlyReports(month);
    if (summary.failed) console.error(`Reporte mensual ${month}: ${summary.failed} envío(s) fallido(s).`);
    return NextResponse.json(summary, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error(`Reporte mensual ${month}: el cron falló antes de enviar.`, error);
    return NextResponse.json({ error: 'error', month }, { status: 500 });
  }
}
