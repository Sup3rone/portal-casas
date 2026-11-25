// T-5309: marco común de TODOS los correos del portal (lo aplica sendEmail en lib/mailer.ts). Fondo crema, logo, tarjeta
// blanca centrada y pie con el sitio. HTML de correo «a la antigua» (tablas y estilos en línea) para que se vea igual en
// Gmail, Outlook, Proton y el teléfono. Los colores son los del sitio (globals.css: --paper-bg, --brand-brown).
import { siteUrl } from './seo';

export const EMAIL_COLORS = { paper: '#F4F1EC', card: '#ffffff', text: '#29251f', muted: '#6b6259', brand: '#654838', line: '#e6ded3' } as const;
const FONT = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MARK = '<!-- alia-email-layout -->';

const esc = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

/** Sitio público para el logo y el pie. En local (localhost) no hay logo: el correo no puede cargar una imagen local. */
function publicSite() {
  try {
    const url = siteUrl();
    return /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(url.hostname) ? null : url;
  } catch { return null; }
}

/** Botón «a prueba de Outlook» (tabla + enlace con relleno). `href` y `label` se escapan aquí. */
export function emailButton(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0"><tr>`
    + `<td style="border-radius:8px;background:${EMAIL_COLORS.brand}" bgcolor="${EMAIL_COLORS.brand}">`
    + `<a href="${esc(href)}" style="display:inline-block;padding:12px 24px;border-radius:8px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none">${esc(label)}</a>`
    + `</td></tr></table>`;
}

/**
 * Envuelve el contenido de un correo (HTML ya escapado por quien lo arma) en el marco común. Idempotente: si el HTML
 * ya trae el marco, se devuelve tal cual. `preheader`: texto que algunos buzones muestran junto al asunto.
 */
export function emailLayout(inner: string, options: { preheader?: string } = {}) {
  if (inner.includes(MARK)) return inner;
  const site = publicSite();
  const logo = site
    ? `<img src="${esc(new URL('/brand/alia-email-logo.png', site).toString())}" width="40" height="40" alt="" style="display:block;border:0;width:40px;height:40px">`
    : '';
  const brand = `<span style="font-family:Georgia, 'Times New Roman', serif;font-size:20px;letter-spacing:.5px;color:${EMAIL_COLORS.brand}">ALIA for Rent</span>`;
  const header = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>`
    + (logo ? `<td style="padding-right:10px;vertical-align:middle">${logo}</td>` : '')
    + `<td style="vertical-align:middle">${site ? `<a href="${esc(site.origin)}" style="text-decoration:none">${brand}</a>` : brand}</td></tr></table>`;
  const footerSite = site ? ` · <a href="${esc(site.origin)}" style="color:${EMAIL_COLORS.muted};text-decoration:underline">${esc(site.host)}</a>` : '';
  const preheader = options.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(options.preheader)}</div>` : '';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">`
    + `<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>ALIA for Rent</title></head>`
    + `<body style="margin:0;padding:0;background:${EMAIL_COLORS.paper}">${MARK}${preheader}`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${EMAIL_COLORS.paper}" style="background:${EMAIL_COLORS.paper}"><tr><td align="center" style="padding:28px 12px">`
    + `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">`
    + `<tr><td align="center" style="padding:0 0 20px">${header}</td></tr>`
    + `<tr><td bgcolor="${EMAIL_COLORS.card}" style="background:${EMAIL_COLORS.card};border:1px solid ${EMAIL_COLORS.line};border-top:4px solid ${EMAIL_COLORS.brand};border-radius:12px;padding:28px 28px 24px;font-family:${FONT};font-size:15px;line-height:1.55;color:${EMAIL_COLORS.text}">${inner}</td></tr>`
    + `<tr><td align="center" style="padding:20px 8px 0;font-family:${FONT};font-size:12px;line-height:1.5;color:${EMAIL_COLORS.muted}">`
    + `ALIA for Rent${footerSite}<br>Correo automático del portal.</td></tr>`
    + `</table></td></tr></table></body></html>`;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };
/**
 * Versión de texto plano del correo (parte text/plain). Los filtros de spam castigan los correos solo-HTML.
 * Enlaces como «texto: url», listas con viñeta, párrafos separados; sin el texto oculto ni el <head>.
 */
export function emailText(html: string) {
  return html
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<div style="display:none[\s\S]*?<\/div>/gi, '')
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href: string, label: string) => {
      const text = label.replace(/<[^>]+>/g, '').trim();
      const url = href.replace(/&amp;/g, '&');
      return text && text !== url && text !== new URL(url, 'https://x.invalid').host ? `${text}: ${url}` : url;
    })
    .replace(/<li\b[^>]*>/gi, '\n• ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h[1-6]|tr|li|ul|table|div)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, name: string) => ENTITIES[name])
    .split('\n').map(line => line.replace(/[ \t]+/g, ' ').trim()).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
