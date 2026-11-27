// T-5417: generador PDF propio (lib/pdf.ts) de los reportes. Sin dependencias y offline. Verifica con un lector
// independiente del generador: estructura (cabecera, xref con offsets reales, trailer), páginas, texto en WinAnsi
// (acentos de es/fr, separadores de miles de fr, caracteres fuera de WinAnsi), encabezado repetido al cambiar de
// página y que ningún renglón ajustado se salga de su columna.
const assert = require('node:assert/strict');
const { load } = require('./test-property-access.cjs');

const pdf = load('apps/web/src/lib/pdf.ts');

/** Lector mínimo: valida xref y devuelve el texto de cada página (cadenas hex de los Tj, en cp1252). */
function readPdf(bytes) {
  const raw = Buffer.from(bytes).toString('latin1');
  assert.ok(raw.startsWith('%PDF-1.4\n'), 'cabecera %PDF-1.4');
  assert.ok(raw.trimEnd().endsWith('%%EOF'), 'termina en %%EOF');
  const startxref = Number(/startxref\s+(\d+)\s+%%EOF\s*$/.exec(raw)[1]);
  assert.equal(raw.slice(startxref, startxref + 4), 'xref', 'startxref apunta a la tabla xref');
  const [, first, count] = /^xref\n(\d+) (\d+)\n/.exec(raw.slice(startxref));
  const entries = raw.slice(startxref).split('\n').slice(2, 2 + Number(count));
  entries.forEach((line, i) => {
    if (i === 0) return assert.match(line, /^0000000000 65535 f ?$/);
    const offset = Number(line.slice(0, 10));
    assert.equal(raw.slice(offset, offset + `${Number(first) + i} 0 obj`.length), `${Number(first) + i} 0 obj`, `offset del objeto ${i}`);
  });
  const decoder = new TextDecoder('windows-1252');
  const pages = [];
  for (const [, body] of raw.matchAll(/stream\n([\s\S]*?)\nendstream/g)) {
    const words = [...body.matchAll(/<([0-9A-F]*)> Tj/g)].map(([, hex]) => decoder.decode(Buffer.from(hex, 'hex')));
    pages.push(words.join(' | '));
  }
  assert.equal((raw.match(/\/Type \/Page\b/g) ?? []).length, pages.length, 'una página por stream de contenido');
  return { raw, pages, text: pages.join('\n') };
}

const title = 'Gastos y mantenimientos — 2026-11';
const rows = [
  { bold: true, cells: [title] },
  { cells: [] },
  { bold: true, cells: ['Pagos'] },
  { bold: true, header: true, cells: ['Propiedad', 'Fecha', 'Tipo', 'Monto', 'Notas'] },
  { cells: ['Casa Bahía «Ñandú»', '2026-11-05', 'Électricité', { number: '1234.50' }, 'café, señal → mañana 😀'] },
  { bold: true, cells: ['Total', '', '', { number: '1234.50' }, ''] },
];
const widths = [32, 12, 16, 14, 30];

// 1. Estructura y texto (es): acentos y signos de WinAnsi intactos; lo que no cabe en WinAnsi sale como «?».
const es = readPdf(pdf.buildPdf(title, rows, widths, { locale: 'es' }));
assert.equal(es.pages.length, 1);
for (const piece of [title, 'Casa Bahía «Ñandú»', 'Électricité', '1,234.50', 'Total', 'ALIA FOR RENT']) assert.ok(es.text.includes(piece), `contiene ${piece}`);
assert.ok(es.text.includes('señal ? mañana ?'), 'flecha y emoji → «?» sin romper el archivo');
assert.match(es.raw, /\/Title <FEFF[0-9A-F]+>/, 'título del documento en UTF-16');
assert.deepEqual(Buffer.from(pdf.buildPdf(title, rows, widths, { locale: 'es' })), Buffer.from(pdf.buildPdf(title, rows, widths, { locale: 'es' })), 'determinista');

// 2. Francés: el separador de miles es un espacio fino (U+202F), que no existe en WinAnsi → espacio normal.
const fr = readPdf(pdf.buildPdf(title, rows, widths, { locale: 'fr' }));
assert.ok(fr.text.includes('1 234,50'), 'monto en formato fr');

// 3. Muchas filas: varias páginas, el encabezado de la tabla se repite arriba de cada una y la numeración es N / total.
const many = [rows[0], rows[3], ...Array.from({ length: 140 }, (_, i) => ({ cells: [`Casa ${i}`, '2026-11-01', 'Luz', { number: String(i) }, ''] }))];
const multi = readPdf(pdf.buildPdf(title, many, widths, { locale: 'es' }));
assert.ok(multi.pages.length >= 3, `varias páginas (${multi.pages.length})`);
multi.pages.forEach((page, i) => {
  assert.ok(page.includes('Propiedad | Fecha | Tipo | Monto | Notas'), `encabezado en la página ${i + 1}`);
  assert.ok(page.includes(`${i + 1} / ${multi.pages.length}`), `número de página ${i + 1}`);
});
assert.ok(multi.text.includes('Casa 139'), 'la última fila no se pierde');

// 4. Ajuste de texto: ningún renglón pasa del ancho; una palabra más larga que la columna se parte.
const long = 'Impermeabilizar la azotea completa del edificio principal y supercalifragilisticoespialidosamente largo';
for (const width of [40, 90, 200]) {
  const lines = pdf.wrapText(long, width, 7.5, false);
  assert.ok(lines.length > 1, `se parte en ${width}`);
  for (const line of lines) assert.ok(pdf.textWidth(line, 7.5, false) <= width + 0.001, `«${line}» cabe en ${width}`);
  assert.equal(lines.join('').replace(/\s/g, ''), long.replace(/\s/g, ''), 'no se pierde texto al partir');
}
// 5. Columnas angostas (las 13 del reporte de comisiones): ninguna palabra corta se parte a la mitad. Cada columna
//    mide al menos su palabra más larga y el espacio sale de las columnas anchas (propiedad, cruce, huésped).
const narrow = readPdf(pdf.buildPdf('Comisiones', [
  { bold: true, header: true, cells: ['Propiedad', 'Fechas', 'Salida', 'Noches (mes/total)', 'Cruce de mes', 'Huésped', 'Referido por', 'Renta', 'Aseo', 'Impuestos', 'Total', '% colaborador', 'Comisión'] },
  { cells: ['Aria Ocean — Departamento frente al mar', '2026-11-01', '2026-11-04', '3/3', 'Cruza al siguiente mes: 2 de 5 noches aquí', 'María José Hernández', 'Agencia Pacífico',
    { number: '175000.00' }, { number: '12600.00' }, { number: '30016.00' }, { number: '217616.00' }, { number: '10' }, { number: '17500.00' }] },
], [32, 12, 12, 9, 34, 24, 22, 14, 12, 12, 14, 10, 14], { locale: 'es' })).text.split(' | ');
for (const word of ['2026-11-01', '2026-11-04', 'Noches', 'Impuestos', 'colaborador', 'Comisión', '217,616.00']) assert.ok(narrow.some(piece => piece.split(' ').includes(word)), `«${word}» entero`);

assert.deepEqual([pdf.textWidth('b', 1000, false), pdf.textWidth('b', 1000, true)], [556, 611], 'métricas AFM de «b» regular y negrita');
assert.equal(pdf.textWidth('i', 1000, false), 222, 'ancho AFM de «i» en Helvetica');

console.log('test-report-pdf OK');
