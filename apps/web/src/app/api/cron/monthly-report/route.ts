// T-4739: reporte mensual. En producción lo dispara /api/cron/daily el día 1 (un solo cron en Hobby);
// esta ruta queda para ejecutarlo a mano con un mes concreto.
// Envía a cada colaborador con destinatarios el reporte del MES ANTERIOR según la fecha de hoy en
// America/Mexico_City. Vercel manda `Authorization: Bearer $CRON_SECRET`; sin CRON_SECRET configurado
// el endpoint se niega (falla cerrado).
//
// Simulación manual (local o preview, con CRON_SECRET en el entorno):
//   curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/monthly-report?month=2026-10"
// `?month=` solo existe para pruebas: con el mismo secreto y validado (YYYY-MM).
import { NextRequest, NextResponse } from 'next/server';
import { cronAuthorized } from '@/lib/cron-auth';
import { inquiryToday } from '@/lib/inquiry-validation';
import { isMonth, previousMonth } from '@/lib/monthly-report';
import { runMonthlyReports } from '@/lib/monthly-report-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!cronAuthorized(req.headers.get('authorization'))) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
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
