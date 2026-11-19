// T-4944: lectura y guardado de los textos de /nosotros y /unete (claves page_about y page_join de SiteContent).
// Va aparte de saveSiteContent a propósito: aquel reescribe todas sus claves en cada guardado y pisaría estas.
import 'server-only';
import { cache } from 'react';
import { eq, sql } from 'drizzle-orm';
import { db, siteContent } from '@portal/db';
import { requireAdmin, AccessError } from './property-access';
import { autoTranslate } from './auto-translation';
import { pageGroups } from './translation-groups';
import { PageContentError, isMissingPageContentSql, pageContentInput, pageContentKeys, pageFields, parsePageContent, type PageContentLocale, type PageContentPage } from './page-content';

export const readPageContent = cache(async (page: PageContentPage) => {
  const [row] = await db.select({ value: siteContent.value }).from(siteContent).where(eq(siteContent.key, pageContentKeys[page])).limit(1);
  return parsePageContent(page, row?.value);
});

/** Textos editados de un idioma, por clave completa de messages (about.ctaTitle, seo.joinTitle…). */
export async function pageTexts(page: PageContentPage, locale: string) {
  const content = await readPageContent(page);
  return { texts: content.texts[(['es', 'en', 'fr'].includes(locale) ? locale : 'es') as PageContentLocale], images: content.images, closed: content.closed };
}

export async function savePageContent(page: PageContentPage, input: unknown) {
  const actor = await requireAdmin();
  const value = pageContentInput(page, input);
  // T-5072: cada texto propio en español se traduce solo a en/fr (si están vacíos o siguen siendo automáticos).
  const fields = pageFields(page);
  const translation = await autoTranslate(pageGroups(page, value.texts));
  translation.groups.forEach((group, index) => {
    for (const language of ['en', 'fr'] as const) {
      if (group[language]) value.texts[language][fields[index].key] = group[language];
      else delete value.texts[language][fields[index].key];
    }
  });
  try {
    // Revalidar ADMIN dentro del statement, como saveSiteContent.
    const rows = await db.execute(sql`
      insert into "SiteContent" ("key", "value")
      select ${pageContentKeys[page]}::text, ${JSON.stringify(value)}::text
      where exists (select 1 from "User" actor where actor.id = ${actor.id} and actor.role::text = 'ADMIN')
      on conflict ("key") do update set "value" = excluded."value"
      returning "key"
    `);
    if (!rows.rows.length) throw new AccessError(403);
  } catch (error) {
    if (isMissingPageContentSql(error)) throw new PageContentError('PAGE_CONTENT_NOT_READY');
    throw error;
  }
  await translation.commit();
  return { value, translation: translation.outcome };
}
