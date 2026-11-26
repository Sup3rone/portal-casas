// T-5324: tema por temporada del sitio público (solo paleta de color). Lo cambian ADMIN y DESIGNER
// desde Panel → Contenido. Va en su propia clave de SiteContent para que, si el SQL aún no está
// aplicado, falle solo este selector y no el guardado del resto del contenido.
import 'server-only';
import { cache } from 'react';
import { db, siteContent } from '@portal/db';
import { eq, sql } from 'drizzle-orm';
import { AccessError, requireContentEditor } from './property-access';
import { PanelValidationError } from './panel-validation';

export const siteSeasons = ['normal', 'navidad', 'san-valentin'] as const;
export type SiteSeason = typeof siteSeasons[number];
export const SITE_SEASON_KEY = 'site_season';

export class SiteSeasonError extends PanelValidationError {
  constructor(public code: 'INVALID_SITE_SEASON' | 'SITE_SEASON_NOT_READY') { super('validation'); }
}

export function isSiteSeason(value: unknown): value is SiteSeason {
  return typeof value === 'string' && (siteSeasons as readonly string[]).includes(value);
}

/** Temporada vigente; cualquier fallo o valor raro cae en «normal» (el sitio nunca se rompe por el tema). */
export const readSiteSeason = cache(async (): Promise<SiteSeason> => {
  try {
    const [row] = await db.select({ value: siteContent.value }).from(siteContent).where(eq(siteContent.key, SITE_SEASON_KEY)).limit(1);
    return isSiteSeason(row?.value) ? row.value : 'normal';
  } catch { return 'normal'; }
});

export async function saveSiteSeason(input: unknown): Promise<SiteSeason> {
  const actor = await requireContentEditor();
  const season = input && typeof input === 'object' && !Array.isArray(input) ? (input as { season?: unknown }).season : undefined;
  if (!isSiteSeason(season) || Object.keys(input as object).length !== 1) throw new SiteSeasonError('INVALID_SITE_SEASON');
  try {
    // Se revalida ADMIN/DESIGNER dentro del statement, como saveSiteContent.
    const rows = await db.execute(sql`
      insert into "SiteContent" ("key", "value")
      select ${SITE_SEASON_KEY}::text, ${season}::text
      where exists (select 1 from "User" actor where actor.id = ${actor.id} and actor.role::text in ('ADMIN', 'DESIGNER'))
      on conflict ("key") do update set "value" = excluded."value"
      returning "key"
    `);
    if (!rows.rows.length) throw new AccessError(403);
  } catch (error) {
    // 23514 = check_violation: falta scripts/sql/site-content-season.sql.
    const code = (error as { code?: string; cause?: { code?: string } })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
    if (code === '23514') throw new SiteSeasonError('SITE_SEASON_NOT_READY');
    throw error;
  }
  return season;
}
