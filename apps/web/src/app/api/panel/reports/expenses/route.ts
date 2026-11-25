// T-5248 (fase 3): descarga del Excel de gastos y mantenimientos del mes (solo COLLABORATOR, sus propiedades).
import { NextRequest, NextResponse } from 'next/server';
import { isMonth } from '@/lib/monthly-report';
import { requireReportOwner } from '@/lib/monthly-report-service';
import { expenseReportFilename, expenseReportXlsx, loadExpenseReport } from '@/lib/expense-report-service';
import { XLSX_MIME } from '@/lib/xlsx';
import { panelError } from '@/lib/panel-response';

export async function GET(req: NextRequest) {
  try {
    const manager = await requireReportOwner();
    const params = new URL(req.url).searchParams;
    const month = params.get('month');
    const locale = ['es', 'en', 'fr'].includes(params.get('locale') ?? '') ? params.get('locale')! : 'es';
    if (!isMonth(month)) return NextResponse.json({ error: 'validation' }, { status: 400 });
    const file = await expenseReportXlsx(await loadExpenseReport(manager, month, locale), locale);
    return new NextResponse(Buffer.from(file), { headers: {
      'Content-Type': XLSX_MIME, 'Content-Disposition': `attachment; filename="${expenseReportFilename(month)}"`, 'Cache-Control': 'no-store',
    } });
  } catch (error) { return panelError(error); }
}
