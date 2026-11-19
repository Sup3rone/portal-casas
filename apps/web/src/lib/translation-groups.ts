// T-5072: qué campos del panel se traducen solos al guardar y con qué key se recuerda su estado (AutoTranslation).
// Lo usan los guardados (servidor) y las páginas del panel (etiqueta «traducido automáticamente»).
import type { TranslationGroup } from './auto-translation-plan';
import { pageFields, pageTextLimit, type PageContentPage, type PageContentValue } from './page-content';

type Text = string | null | undefined;
const group = (key: string, es: Text, en: Text, fr: Text, maxLength?: number, copySource = true): TranslationGroup => ({ key, es: es ?? '', en: en ?? '', fr: fr ?? '', maxLength, copySource });

export const propertyTranslationFields = { title: ['titleEs', 'titleEn', 'titleFr'], desc: ['descEs', 'descEn', 'descFr'] } as const;
type PropertyTexts = Partial<Record<'titleEs' | 'titleEn' | 'titleFr' | 'descEs' | 'descEn' | 'descFr', Text>>;
export const propertyGroups = (id: string, v: PropertyTexts) => [
  group(`property:${id}:title`, v.titleEs, v.titleEn, v.titleFr),
  group(`property:${id}:desc`, v.descEs, v.descEn, v.descFr),
];

type SectionTexts = { descriptionEs?: Text; descriptionEn?: Text; descriptionFr?: Text };
export const sectionGroup = (propertyId: string, section: string, v: SectionTexts) =>
  group(`section:${propertyId}:${section}`, v.descriptionEs, v.descriptionEn, v.descriptionFr);

type SiteTexts = Record<'about_title_es' | 'about_title_en' | 'about_title_fr' | 'about_es' | 'about_en' | 'about_fr', string>;
export const siteGroups = (v: SiteTexts) => [
  group('site:about_title', v.about_title_es, v.about_title_en, v.about_title_fr, 200),
  group('site:about', v.about_es, v.about_en, v.about_fr, 2000),
];

export const pageGroups = (page: PageContentPage, texts: PageContentValue['texts']) => pageFields(page).map(field =>
  group(`page:${page}:${field.key}`, texts.es[field.key], texts.en[field.key], texts.fr[field.key], pageTextLimit(field.role), false));

/** "property:<id>:title:en" → "titleEn" y similares: el nombre de campo que usa cada editor. */
export function fieldNameForKey(stateKey: string) {
  const parts = stateKey.split(':'), language = parts.pop()!, capital = language[0].toUpperCase() + language.slice(1);
  if (parts[0] === 'property') return `${parts[2]}${capital}`;
  if (parts[0] === 'section') return `description${capital}`;
  if (parts[0] === 'site') return `${parts[1]}_${language}`;
  return `${language}:${parts.slice(2).join(':')}`; // page: "<idioma>:<clave de messages>", como en el formulario
}
