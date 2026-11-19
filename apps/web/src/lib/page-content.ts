// T-4944: textos e imágenes de /nosotros y /unete editables desde Panel → Contenido → Páginas.
// Sin React ni BD (lo usan el editor, las páginas y los tests). Se guarda un JSON por página en SiteContent
// (page_about, page_join; SQL scripts/sql/site-content-pages.sql). Campo vacío = texto de messages/*.json.
// La estructura (qué preguntas hay, cuántos beneficios) es fija: solo se editan las palabras.

export const pageContentPages = ['about', 'join'] as const;
export type PageContentPage = typeof pageContentPages[number];
export const pageContentKeys = { about: 'page_about', join: 'page_join' } as const;
export const pageContentLocales = ['es', 'en', 'fr'] as const;
export type PageContentLocale = typeof pageContentLocales[number];

/** Rol del campo: da la etiqueta en el panel (panelPages.roles.*) y el largo máximo. */
export type PageFieldRole = 'eyebrow' | 'title' | 'help' | 'text' | 'button' | 'whatsappMessage' | 'optionTitle' | 'optionText' | 'option' | 'itemTitle' | 'itemText' | 'caption' | 'seoTitle' | 'seoDescription';
export type PageField = { key: string; role: PageFieldRole; n?: number };
export type PageGroup = { id: string; fields: PageField[] };
// closed (solo /unete): «no estamos disponibles»; la página muestra el aviso en vez del cuestionario.
export type PageContentValue = { texts: Record<PageContentLocale, Record<string, string>>; images: Record<string, string>; closed: boolean };

const longRoles = new Set<PageFieldRole>(['help', 'text', 'whatsappMessage', 'optionText', 'itemText', 'seoDescription']);
export const pageTextLimit = (role: PageFieldRole) => longRoles.has(role) ? 1000 : 200;

const items = ['one', 'two', 'three'] as const;
const pairs = (prefix: string, titleRole: PageFieldRole, textRole: PageFieldRole) => items.flatMap((item, index) => [
  { key: `${prefix}.${item}.title`, role: titleRole, n: index + 1 }, { key: `${prefix}.${item}.text`, role: textRole, n: index + 1 },
]);
// Sin número en la ubicación: sus primeras opciones son los estados publicados, que no se editan aquí.
const question = (id: string, options: string[], numberedOptions = true): PageGroup => ({ id: `question.${id}`, fields: [
  { key: `join.quiz.${id}.title`, role: 'title' }, { key: `join.quiz.${id}.help`, role: 'help' },
  ...options.map((option, index) => ({ key: `join.quiz.${id}.options.${option}`, role: 'option' as const, ...(numberedOptions ? { n: index + 1 } : {}) })),
] });
const done = (audience: 'owners' | 'referrers'): PageGroup => ({ id: `done.${audience}`, fields: [
  { key: `join.${audience}.doneTitle`, role: 'title' }, { key: `join.${audience}.doneText`, role: 'text' },
  ...pairs(`join.${audience}.benefits`, 'itemTitle', 'itemText'),
  { key: `join.${audience}.cta`, role: 'button' }, { key: `join.${audience}.whatsappMessage`, role: 'whatsappMessage' },
  ...(audience === 'referrers' ? [{ key: 'join.referrers.ctaRegister', role: 'button' as const }, { key: 'join.referrers.ctaRegisterHint', role: 'help' as const }] : []),
] });

export const pageContentGroups: Record<PageContentPage, PageGroup[]> = {
  about: [
    { id: 'hero', fields: [{ key: 'about.heroEyebrow', role: 'eyebrow' }, { key: 'about.heroTitleFallback', role: 'title' }] },
    { id: 'story', fields: [{ key: 'about.storyTitle', role: 'title' }, { key: 'about.storyFallback', role: 'text' }] },
    { id: 'team', fields: [{ key: 'about.teamTitle', role: 'title' }, { key: 'about.teamText', role: 'text' }] },
    { id: 'photos', fields: [{ key: 'about.photoOneCaption', role: 'caption', n: 1 }, { key: 'about.photoTwoCaption', role: 'caption', n: 2 }] },
    { id: 'values', fields: [{ key: 'about.valuesTitle', role: 'title' }, ...pairs('about.values', 'itemTitle', 'itemText')] },
    { id: 'contact', fields: [{ key: 'about.contactTitle', role: 'title' }, { key: 'about.whatsappLabel', role: 'button' }, { key: 'about.whatsappMessage', role: 'whatsappMessage' }] },
    { id: 'closing', fields: [{ key: 'about.ctaTitle', role: 'title' }, { key: 'about.ctaText', role: 'text' }, { key: 'about.ctaHomes', role: 'button' }, { key: 'about.ctaJoin', role: 'button' }] },
    { id: 'seo', fields: [{ key: 'seo.aboutTitle', role: 'seoTitle' }, { key: 'seo.aboutDescription', role: 'seoDescription' }] },
  ],
  join: [
    { id: 'start', fields: [
      { key: 'join.heroEyebrow', role: 'eyebrow' }, { key: 'join.quiz.audience.title', role: 'title' }, { key: 'join.quiz.audience.help', role: 'help' },
      { key: 'join.owners.cardTitle', role: 'optionTitle', n: 1 }, { key: 'join.owners.cardText', role: 'optionText', n: 1 },
      { key: 'join.referrers.cardTitle', role: 'optionTitle', n: 2 }, { key: 'join.referrers.cardText', role: 'optionText', n: 2 },
    ] },
    question('propertyType', ['house', 'apartment', 'other']),
    question('location', ['other'], false),
    question('rental', ['nightly', 'annual', 'both']),
    done('owners'),
    question('referAudience', ['guests', 'owners', 'both']),
    question('channel', ['social', 'whatsapp', 'person']),
    question('reach', ['few', 'some', 'many']),
    done('referrers'),
    { id: 'closed', fields: [{ key: 'join.closed.title', role: 'title' }, { key: 'join.closed.text', role: 'text' }, { key: 'join.closed.cta', role: 'button' }] },
    { id: 'seo', fields: [{ key: 'seo.joinTitle', role: 'seoTitle' }, { key: 'seo.joinDescription', role: 'seoDescription' }] },
  ],
};
/** Imágenes propias de cada página. Vacía: hero y side = la imagen de «Sobre nosotros» del panel;
 * las demás de /nosotros = la de cabecera (aboutImages). */
export const pageContentImages: Record<PageContentPage, string[]> = { about: ['hero', 'team', 'photoOne', 'photoTwo', 'closing'], join: ['side'] };

/** Imágenes de /nosotros ya resueltas: cada hueco vacío cae a la cabecera, y la cabecera a la del panel. */
export function aboutImages(images: Record<string, string>, fallback: string) {
  const hero = images.hero || fallback;
  return { hero, team: images.team || hero, photoOne: images.photoOne || hero, photoTwo: images.photoTwo || hero, closing: images.closing || hero };
}

export const pageFields = (page: PageContentPage) => pageContentGroups[page].flatMap(group => group.fields);
export const emptyPageContent = (): PageContentValue => ({ texts: { es: {}, en: {}, fr: {} }, images: {}, closed: false });
/** Páginas que se pueden cerrar con la casilla «No estamos disponibles». */
export const closablePages: readonly PageContentPage[] = ['join'];

export class PageContentError extends Error {
  constructor(public code: 'INVALID_PAGE_CONTENT' | 'PAGE_TEXT_TOO_LONG' | 'INVALID_PAGE_IMAGE' | 'PAGE_CONTENT_NOT_READY') { super('validation'); }
}

function plainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

/** Valida y normaliza lo que manda el panel. Solo campos conocidos; vacíos fuera; imágenes https sin credenciales. */
export function pageContentInput(page: PageContentPage, input: unknown): PageContentValue {
  if (!plainObject(input) || Object.keys(input).some(key => !['texts', 'images', 'closed'].includes(key))) throw new PageContentError('INVALID_PAGE_CONTENT');
  const closed = input.closed ?? false;
  if (typeof closed !== 'boolean' || (closed && !closablePages.includes(page))) throw new PageContentError('INVALID_PAGE_CONTENT');
  const texts = input.texts ?? {}, images = input.images ?? {};
  if (!plainObject(texts) || !plainObject(images) || Object.keys(texts).some(locale => !pageContentLocales.includes(locale as PageContentLocale))) throw new PageContentError('INVALID_PAGE_CONTENT');
  const roles = new Map(pageFields(page).map(field => [field.key, field.role]));
  const value = emptyPageContent();
  for (const locale of pageContentLocales) {
    const entries = texts[locale] ?? {};
    if (!plainObject(entries)) throw new PageContentError('INVALID_PAGE_CONTENT');
    for (const [key, raw] of Object.entries(entries)) {
      const role = roles.get(key);
      if (!role || typeof raw !== 'string') throw new PageContentError('INVALID_PAGE_CONTENT');
      const text = raw.trim();
      if (text.length > pageTextLimit(role)) throw new PageContentError('PAGE_TEXT_TOO_LONG');
      if (text) value.texts[locale][key] = text;
    }
  }
  for (const [name, raw] of Object.entries(images)) {
    if (!pageContentImages[page].includes(name) || typeof raw !== 'string') throw new PageContentError('INVALID_PAGE_CONTENT');
    const url = raw.trim();
    if (!url) continue;
    try {
      const parsed = new URL(url);
      if (url.length > 2048 || parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error();
    } catch { throw new PageContentError('INVALID_PAGE_IMAGE'); }
    value.images[name] = url;
  }
  value.closed = closed;
  return value;
}

/** Lo guardado en BD; si está vacío o dañado, todo vuelve a los textos por defecto (la página nunca se rompe). */
export function parsePageContent(page: PageContentPage, raw: string | null | undefined): PageContentValue {
  if (!raw) return emptyPageContent();
  try { return pageContentInput(page, JSON.parse(raw)); } catch { return emptyPageContent(); }
}

/** Sustituye {nombre}. Si el mensaje de WhatsApp editado no trae {summary}, las respuestas van al final. */
export function fillPageText(template: string, params: Record<string, string | number> = {}): string {
  let text = template.replace(/\{(\w+)\}/g, (match, name: string) => name in params ? String(params[name]) : match);
  if ('summary' in params && params.summary && !template.includes('{summary}')) text = `${text.replace(/[.\s]+$/, '')}. ${params.summary}.`;
  return text;
}

/** Postgres rechaza la clave nueva mientras no se aplique el SQL (CHECK SiteContent_key_check, código 23514). */
export function isMissingPageContentSql(error: unknown): boolean {
  for (let current = error, depth = 0; current && depth < 4; current = (current as { cause?: unknown }).cause, depth++) {
    const { code, message, constraint } = current as { code?: string; message?: string; constraint?: string };
    if (constraint === 'SiteContent_key_check' || (code === '23514' && /SiteContent/.test(message ?? '')) || /SiteContent_key_check/.test(message ?? '')) return true;
  }
  return false;
}
