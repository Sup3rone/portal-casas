// T-4739: ÚNICO cron de Vercel (plan Hobby: pocos cron jobs y como máximo uno al día).
// vercel.json → "0 12 * * *" = 06:00 en Ciudad de México (Vercel Hobby puede ejecutarlo dentro de esa hora).
// 1) Todos los días: sincroniza los calendarios iCal de todas las propiedades no anuales.
// 2) Si HOY en America/Mexico_City es día 1: envía además el reporte mensual del mes anterior.
// Simulación manual:
//   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/daily
//   (?today=YYYY-MM-DD solo para pruebas: fuerza la fecha MX y con ello si toca reporte mensual)
import { NextRequest, NextResponse } from 'next/server';
import { cronAuthorized } from '@/lib/cron-auth';
import { inquiryToday } from '@/lib/inquiry-validation';
import { previousMonth } from '@/lib/monthly-report';
import { runMonthlyReports } from '@/lib/monthly-report-service';
import { syncAllFeeds } from '@/lib/ical-sync-runner';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!cronAuthorized(req.headers.get('authorization'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const override = new URL(req.url).searchParams.get('today');
  if (override !== null && !/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(override)) return NextResponse.json({ error: 'validation' }, { status: 400 });
  const today = override ?? inquiryToday();
  const out: Record<string, unknown> = { today };
  // Cada parte es independiente: si una falla, la otra corre igual y el fallo queda en la respuesta y en el log.
  try {
    const { results, ...ical } = await syncAllFeeds();
    out.ical = { ...ical, failed: results.filter(r => r.status === 'failed').map(r => ({ feedId: r.feedId, error: r.error })) };
    if (ical.failedFeeds) console.error(`Cron diario: ${ical.failedFeeds} calendario(s) iCal sin leer.`);
  } catch (error) { console.error('Cron diario: la sincronización iCal falló.', error); out.ical = { error: 'error' }; }
  if (today.endsWith('-01')) {
    const month = previousMonth(today);
    try {
      const summary = await runMonthlyReports(month);
      out.monthlyReport = summary;
      if (summary.failed) console.error(`Reporte mensual ${month}: ${summary.failed} envío(s) fallido(s).`);
    } catch (error) { console.error(`Reporte mensual ${month}: el cron falló antes de enviar.`, error); out.monthlyReport = { error: 'error', month }; }
  }
  const failed = (out.ical as { error?: string }).error || (out.monthlyReport as { error?: string } | undefined)?.error;
  return NextResponse.json(out, { status: failed ? 500 : 200, headers: { 'Cache-Control': 'no-store' } });
}
