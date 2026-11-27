// T-5417: generador mínimo de PDF SIN dependencias, para los reportes (mismas filas que el Excel de lib/xlsx.ts).
//
// Por qué no una librería: la misma razón que xlsx.ts (dependencia nueva = pnpm-lock.yaml distinto y Vercel instala
// con el lockfile congelado; pdfkit o pdf-lib pesan cientos de KB para dibujar una tabla). Chromium no cabe en Hobby.
//
// Formato: PDF 1.4, carta horizontal, fuentes estándar Helvetica y Helvetica-Bold (todo lector las trae, no se
// incrustan) con WinAnsiEncoding: cubre los acentos y signos de es/en/fr. Lo que no cabe en WinAnsi sale como «?».
// Los anchos de cada carácter son los de los AFM oficiales de Adobe (Helvetica.afm / Helvetica-Bold.afm), para que
// el ajuste de texto en cada columna sea exacto. Texto en cadenas hexadecimales (no hay nada que escapar), streams
// sin comprimir y sin fecha de creación: el mismo reporte da siempre los mismos bytes.
import type { Cell, Row } from './xlsx';

export const PDF_MIME = 'application/pdf';

// Anchos (unidades de 1/1000 de em) para los códigos WinAnsi 32..255. 0 = código sin carácter en cp1252.
const REGULAR = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,0,556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500];
const BOLD = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,0,556,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556];
/** Unicode → byte cp1252 para el tramo 0x80-0x9F (€, comillas tipográficas, rayas…); 0xA0-0xFF coincide con Latin-1. */
const CP1252_HIGH = new Map<number, number>([[0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84], [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88], [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c], [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93], [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97], [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b], [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f]]);
const QUESTION = 0x3f;

/** Un carácter (code point) → byte WinAnsi. Espacios finos y duros (fr usa U+202F en miles) → espacio. */
function winAnsi(codePoint: number) {
  if (codePoint === 0x202f || codePoint === 0x2009 || codePoint === 0x00a0 || codePoint === 0x2007) return 0x20;
  if (codePoint >= 0x20 && codePoint <= 0x7e) return codePoint;
  if (codePoint >= 0xa1 && codePoint <= 0xff) return codePoint;
  return CP1252_HIGH.get(codePoint) ?? (codePoint === 0x09 ? 0x20 : QUESTION);
}
const encode = (text: string) => Array.from(text, char => winAnsi(char.codePointAt(0)!));

export function textWidth(text: string, size: number, bold = false) {
  const table = bold ? BOLD : REGULAR;
  return encode(text).reduce((sum, byte) => sum + table[byte - 32], 0) * size / 1000;
}

/** Ajusta el texto al ancho: por palabras y, si una palabra sola no cabe, la parte por caracteres. */
export function wrapText(text: string, maxWidth: number, size: number, bold = false): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (textWidth(candidate, size, bold) <= maxWidth) { line = candidate; continue; }
      if (line) lines.push(line);
      line = '';
      let rest = word;
      while (textWidth(rest, size, bold) > maxWidth) {
        const chars = Array.from(rest);
        let take = 1;
        while (take < chars.length && textWidth(chars.slice(0, take + 1).join(''), size, bold) <= maxWidth) take++;
        lines.push(chars.slice(0, take).join(''));
        rest = chars.slice(take).join('');
      }
      line = rest;
    }
    lines.push(line);
  }
  return lines;
}

// Carta horizontal, en puntos.
const PAGE_W = 792, PAGE_H = 612, MARGIN = 32, FOOTER = 18;
const BODY = 7.5, LEADING = 9.5, PAD = 3, TITLE = 13, SECTION = 10;
const n = (value: number) => (Math.round(value * 100) / 100).toString();
const hex = (text: string) => encode(text).map(byte => byte.toString(16).toUpperCase().padStart(2, '0')).join('');

/** Decimal exacto con 2 cifras y separadores del idioma, con la misma regla que formatMoney (es-MX, en-GB, fr-FR)
 *  pero sin símbolo de moneda: la columna ya dice qué es. Sin pasar por float. */
function decimal(value: string, panelLocale: string) {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) return value;
  const locale = panelLocale === 'en' ? 'en-GB' : panelLocale === 'fr' ? 'fr-FR' : 'es-MX';
  const [, sign, whole, rawFraction = ''] = match;
  const grouped = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(BigInt(whole));
  const point = new Intl.NumberFormat(locale).formatToParts(1.5).find(part => part.type === 'decimal')?.value ?? '.';
  return `${sign}${grouped}${point}${(rawFraction + '00').slice(0, 2)}`;
}

function cellText(cell: Cell, locale: string): { text: string; number: boolean } {
  if (cell == null) return { text: '', number: false };
  if (typeof cell === 'object') return { text: decimal(cell.number, locale), number: true };
  return { text: String(cell), number: typeof cell === 'number' };
}

/**
 * Anchos finales en puntos: proporcionales a los del Excel, pero cada columna mide al menos su palabra más larga
 * (para que «2026-11-01» o «Impuestos» no se partan a la mitad). Lo que falta se toma de las columnas con holgura,
 * en proporción a su holgura. Si ni así cabe, se reparte en proporción a lo que cada una necesita.
 * Las filas de una sola celda (título, secciones) ocupan todo el ancho y no cuentan.
 */
function fitColumns(rows: Row[], relative: number[], usable: number, locale: string) {
  const total = relative.reduce((a, b) => a + b, 0);
  const widths = relative.map(width => width * usable / total);
  const table = rows.filter(row => row.cells.length > 1);
  const need = relative.map((_, i) => Math.min(usable * 0.3, 2 * PAD + Math.max(0, ...table.flatMap(row =>
    cellText(row.cells[i], locale).text.split(/\s+/).map(word => textWidth(word, BODY, Boolean(row.bold || row.header)))))));
  const deficit = widths.reduce((sum, width, i) => sum + Math.max(0, need[i] - width), 0);
  if (deficit <= 0) return widths;
  const slack = widths.map((width, i) => Math.max(0, width - need[i]));
  const totalSlack = slack.reduce((a, b) => a + b, 0);
  if (totalSlack < deficit) {
    const totalNeed = need.reduce((a, b) => a + b, 0);
    return need.map(width => width * usable / totalNeed);
  }
  return widths.map((width, i) => width < need[i] ? need[i] : width - slack[i] * deficit / totalSlack);
}

/**
 * Dibuja las filas del reporte como tabla. Convenciones de `rows` (las mismas que ya usan las hojas de Excel):
 * - fila de una sola celda: título si es la primera, encabezado de sección si no;
 * - fila vacía: separación;
 * - `header: true`: encabezado de tabla (fondo gris), se repite arriba de cada página nueva mientras siga la tabla;
 * - `bold`: subtotales y totales.
 * `widths`: anchos relativos por columna (los del Excel); se escalan al ancho útil de la página.
 */
export function buildPdf(title: string, rows: Row[], widths: number[], { locale }: { locale: string }): Uint8Array {
  const usable = PAGE_W - 2 * MARGIN;
  const columns = Math.max(widths.length, ...rows.map(row => row.cells.length));
  const relative = Array.from({ length: columns }, (_, i) => widths[i] ?? 10);
  const colW = fitColumns(rows, relative, usable, locale);
  const colX = colW.map((_, i) => MARGIN + colW.slice(0, i).reduce((a, b) => a + b, 0));

  const pages: string[][] = [];
  let ops: string[] = [];
  let y = 0;
  let header: Row | null = null;
  const bottom = MARGIN + FOOTER;
  const newPage = () => { ops = []; pages.push(ops); y = PAGE_H - MARGIN; };
  const text = (x: number, baseline: number, value: string, size: number, bold: boolean) =>
    ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${n(x)} ${n(baseline)} Td <${hex(value)}> Tj ET`);

  const layout = (row: Row) => {
    const bold = Boolean(row.bold || row.header);
    const cells = Array.from({ length: columns }, (_, i) => {
      const { text: value, number } = cellText(row.cells[i], locale);
      return { lines: value ? wrapText(value, colW[i] - 2 * PAD, BODY, bold) : [], number };
    });
    const height = Math.max(1, ...cells.map(cell => cell.lines.length)) * LEADING + 2 * PAD;
    return { bold, cells, height };
  };
  const drawRow = (row: Row) => {
    const { bold, cells, height } = layout(row);
    if (row.header) ops.push(`0.92 g ${n(MARGIN)} ${n(y - height)} ${n(usable)} ${n(height)} re f 0 g`);
    cells.forEach((cell, i) => cell.lines.forEach((line, k) => {
      const baseline = y - PAD - BODY * 0.8 - k * LEADING;
      const x = cell.number ? colX[i] + colW[i] - PAD - textWidth(line, BODY, bold) : colX[i] + PAD;
      text(x, baseline, line, BODY, bold);
    }));
    y -= height;
    ops.push(`${row.bold && !row.header ? '0.35' : '0.8'} G 0.4 w ${n(MARGIN)} ${n(y)} m ${n(MARGIN + usable)} ${n(y)} l S 0 G`);
  };

  newPage();
  rows.forEach((row, index) => {
    if (!row.cells.length) { y -= 6; return; }
    if (row.cells.length === 1) {
      header = null;
      const size = index === 0 ? TITLE : SECTION;
      const lines = wrapText(cellText(row.cells[0], locale).text, usable, size, true);
      const height = lines.length * size * 1.25 + 4;
      if (y - height - 3 * LEADING < bottom) newPage(); // un encabezado de sección no se queda solo al pie
      lines.forEach((line, k) => text(MARGIN, y - size - k * size * 1.25, line, size, true));
      y -= height;
      return;
    }
    const { height } = layout(row);
    const needs = row.header ? height + 2 * LEADING + 2 * PAD : height;
    if (y - needs < bottom) {
      newPage();
      if (header && !row.header) drawRow(header);
    }
    if (row.header) header = row;
    drawRow(row);
  });

  // Pie: marca y título a la izquierda, «N / total» a la derecha.
  pages.forEach((page, i) => {
    ops = page;
    const footer = `ALIA FOR RENT · ${title}`;
    text(MARGIN, MARGIN, footer, 7, false);
    const number = `${i + 1} / ${pages.length}`;
    text(PAGE_W - MARGIN - textWidth(number, 7), MARGIN, number, 7, false);
  });

  // Objetos: 1 catálogo, 2 páginas, 3-4 fuentes, 5 info, luego por página: página + contenido.
  const font = (name: string) => `<< /Type /Font /Subtype /Type1 /BaseFont /${name} /Encoding /WinAnsiEncoding >>`;
  const utf16 = (value: string) => `<FEFF${Array.from(value).map(char => {
    const code = char.codePointAt(0)!;
    const units = code > 0xffff ? [0xd800 + ((code - 0x10000) >> 10), 0xdc00 + ((code - 0x10000) & 0x3ff)] : [code];
    return units.map(unit => unit.toString(16).toUpperCase().padStart(4, '0')).join('');
  }).join('')}>`;
  const pageIds = pages.map((_, i) => 6 + i * 2);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    font('Helvetica'),
    font('Helvetica-Bold'),
    `<< /Title ${utf16(title)} /Producer (ALIA FOR RENT) >>`,
    ...pages.flatMap((page, i) => {
      const content = page.join('\n');
      return [
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageIds[i] + 1} 0 R >>`,
        `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
      ];
    }),
  ];
  // Todo el archivo es ASCII (texto en hex), así que la longitud en caracteres es la de bytes.
  let out = '%PDF-1.4\n';
  const offsets = objects.map((body, i) => { const at = out.length; out += `${i + 1} 0 obj\n${body}\nendobj\n`; return at; });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map(at => `${String(at).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}
