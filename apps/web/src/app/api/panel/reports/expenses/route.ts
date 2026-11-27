// T-5248 (fase 3): descarga del Excel de gastos y mantenimientos del mes (solo COLLABORATOR, sus propiedades). T-5417: ?format=pdf.
import { NextRequest, NextResponse } from 'next/server';
import { isMonth } from '@/lib/monthly-report';
import { requireReportOwner } from '@/lib/monthly-report-service';
import { expenseReportFilename, expenseReportPdf, expenseReportPdfFilename, expenseReportXlsx, loadExpenseReport } from '@/lib/expense-report-service';
import { PDF_MIME } from '@/lib/pdf';
import { reportFormat } from '@/lib/report-format';
import { XLSX_MIME } from '@/lib/xlsx';
import { panelError } from '@/lib/panel-response';

export async function GET(req: NextRequest) {
  try {
    const manager = await requireReportOwner();
    const params = new URL(req.url).searchParams;
    const month = params.get('month');
    const locale = ['es', 'en', 'fr'].includes(params.get('locale') ?? '') ? params.get('locale')! : 'es';
    const format = reportFormat(params.get('format'));
    if (!isMonth(month) || !format) return NextResponse.json({ error: 'validation' }, { status: 400 });
    const report = await loadExpenseReport(manager, month, locale);
    const pdf = format === 'pdf';
    const file = pdf ? await expenseReportPdf(report, locale) : await expenseReportXlsx(report, locale);
    return new NextResponse(Buffer.from(file), { headers: {
      'Content-Type': pdf ? PDF_MIME : XLSX_MIME,
      'Content-Disposition': `attachment; filename="${pdf ? expenseReportPdfFilename(month) : expenseReportFilename(month)}"`, 'Cache-Control': 'no-store',
    } });
  } catch (error) { return panelError(error); }
}
