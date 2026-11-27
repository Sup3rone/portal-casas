// T-5417: formato de descarga de los reportes. Sin parámetro = Excel (como antes); cualquier otro valor = null (400).
export type ReportFormat = 'xlsx' | 'pdf';
export const reportFormat = (value: string | null): ReportFormat | null =>
  value == null || value === '' || value === 'xlsx' ? 'xlsx' : value === 'pdf' ? 'pdf' : null;
