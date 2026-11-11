import 'server-only';
// Sincronización iCal reutilizable (lógica de T-4680, sin cambios de comportamiento):
//   1) upsert de los eventos vigentes por (icalFeedId, icalUid); 2) borrar los que ya no vienen.
//   Un feed caído o que no parsea como calendario NO se toca (nunca libera fechas por error).
// T-4739 añade: límite de tiempo por feed, estado por feed (lastAttemptAt/lastSyncedAt/lastError) y tres
// disparadores — botón del panel (gestor), cron diario (sistema) y refresco previo a una consulta pública.
import { db, icalFeeds, properties } from '@portal/db';
import { and, eq, isNull, lt, ne, or, sql, type SQL } from 'drizzle-orm';
import { feedEvents, isCalendar } from './ical-sync';
import { bookingSourceFor } from './ical-feeds';
import { AccessError, managedProperties, type PropertyManager } from './property-access';

type Feed = { id: string; propertyId: string; url: string; source: string };
export type FeedResult = { feedId: string; status: 'ok' | 'failed'; events: number; removed: number; error?: string };

export const FEED_TIMEOUT_MS = 8_000;
/** Consulta pública: no volver a descargar si se sincronizó hace menos de esto. */
export const INQUIRY_MAX_AGE_MS = 10 * 60_000;
/** Consulta pública: tope de espera total (la consulta nunca se bloquea por Airbnb). */
export const INQUIRY_BUDGET_MS = 4_000;

function withTimeout<T>(promise: Promise<T>, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([promise, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('TIMEOUT')), ms); })])
    .finally(() => clearTimeout(timer));
}

async function markFeed(feedId: string, ok: boolean, error: string | null) {
  try {
    const now = new Date();
    await db.update(icalFeeds).set(ok ? { lastAttemptAt: now, lastSyncedAt: now, lastError: null } : { lastAttemptAt: now, lastError: error })
      .where(eq(icalFeeds.id, feedId));
  } catch (statusError) { console.error(`iCal: no se pudo guardar el estado del feed ${feedId}:`, statusError); }
}

/**
 * Sincroniza UN feed. `scope` es la condición extra de permiso que se revalida dentro de cada escritura
 * (managedProperties del gestor, o `true` para el sistema). Lanza AccessError solo si el gestor perdió el permiso.
 */
export async function syncFeed(feed: Feed, scope: SQL, timeoutMs = FEED_TIMEOUT_MS): Promise<FeedResult> {
  let events;
  try {
    // Carga diferida: se resuelve en cada sync (los tests pueden sustituir node-ical después de cargar este módulo).
    const ical = await import('node-ical');
    const parsed = await withTimeout(ical.fromURL(feed.url), timeoutMs);
    if (!isCalendar(parsed)) throw new Error('NOT_A_CALENDAR');
    events = feedEvents(parsed);
  } catch (error) {
    const message = error instanceof Error && ['TIMEOUT', 'NOT_A_CALENDAR'].includes(error.message) ? error.message : 'FETCH_FAILED';
    console.warn(`iCal: feed ${feed.id} no se pudo leer (${message}); se conservan sus fechas`);
    await markFeed(feed.id, false, message);
    return { feedId: feed.id, status: 'failed', events: 0, removed: 0, error: message };
  }
  const source = bookingSourceFor(feed.source);
  const guard = and(eq(properties.id, feed.propertyId), eq(icalFeeds.id, feed.id), scope);
  for (const event of events) {
    // Revalidar dueño y relación del feed al escribir, incluso después del fetch remoto.
    const result = await db.execute(sql`
      insert into "Booking" ("id", "propertyId", "icalFeedId", "icalUid", "startDate", "endDate", "source")
      select ${crypto.randomUUID()}, ${properties.id}, ${icalFeeds.id}, ${event.uid},
        ${event.startDate}::date, ${event.endDate}::date, ${source}
      from ${properties} inner join ${icalFeeds} on ${eq(icalFeeds.propertyId, properties.id)}
      where ${guard}
      on conflict ("icalFeedId", "icalUid") where "icalFeedId" is not null
      do update set "startDate" = excluded."startDate", "endDate" = excluded."endDate", "source" = excluded."source"
      returning "id"
    `);
    if (!result.rows.length) throw new AccessError(404);
  }
  const keep = events.map(event => event.uid);
  const removed = await db.execute(sql`
    delete from "Booking"
    where "icalFeedId" = ${feed.id} and "propertyId" = ${feed.propertyId}
      and (${keep.length === 0 ? sql`1 = 1` : sql`"icalUid" is null or "icalUid" not in (${sql.join(keep.map(uid => sql`${uid}`), sql`, `)})`})
      and exists (select 1 from ${properties} inner join ${icalFeeds} on ${eq(icalFeeds.propertyId, properties.id)} where ${guard})
    returning "id"
  `);
  console.log(`Feed ${feed.id}: ${events.length} vigentes, ${removed.rows.length} retirados`);
  await markFeed(feed.id, true, null);
  return { feedId: feed.id, status: 'ok', events: events.length, removed: removed.rows.length };
}

const feedColumns = { id: icalFeeds.id, propertyId: icalFeeds.propertyId, url: icalFeeds.url, source: icalFeeds.source };

/** Varias a la vez (máx. `concurrency`) para no agotar el tiempo de la función con muchos feeds. */
async function syncMany(feeds: Feed[], scope: SQL, concurrency = 4, timeoutMs = FEED_TIMEOUT_MS) {
  const results: FeedResult[] = [];
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, feeds.length) }, async () => {
    while (next < feeds.length) { const feed = feeds[next++]; results.push(await syncFeed(feed, scope, timeoutMs)); }
  }));
  return {
    feeds: feeds.length, results,
    synced: results.reduce((n, r) => n + r.events, 0), removed: results.reduce((n, r) => n + r.removed, 0),
    failedFeeds: results.filter(r => r.status === 'failed').length,
  };
}

/** Botón «Sincronizar ahora» / calendario del panel: los feeds que gestiona quien pulsa. */
export async function syncManagedFeeds(manager: PropertyManager) {
  const rows = await db.select({ ...feedColumns, rentalType: properties.rentalType }).from(icalFeeds)
    .innerJoin(properties, eq(icalFeeds.propertyId, properties.id)).where(managedProperties(manager));
  const skippedAnnual = rows.filter(row => row.rentalType === 'anual').length;
  if (skippedAnnual) console.info(`iCal: omitidos ${skippedAnnual} feeds de propiedades anuales`);
  const feeds = rows.filter(row => row.rentalType !== 'anual');
  // Un solo recorrido (concurrencia 1) para conservar el comportamiento de T-4680 ante pérdida de permiso.
  return { ...(await syncMany(feeds, managedProperties(manager), 1)), skippedAnnual };
}

/** Cron diario (sistema): todos los feeds de propiedades no anuales. */
export async function syncAllFeeds() {
  const feeds = await db.select(feedColumns).from(icalFeeds).innerJoin(properties, eq(icalFeeds.propertyId, properties.id))
    .where(ne(properties.rentalType, 'anual'));
  return syncMany(feeds, sql`true`);
}

/**
 * Antes de guardar una consulta pública: refresca los calendarios de ESA propiedad si su última sincronización
 * tiene más de INQUIRY_MAX_AGE_MS. Espera como mucho INQUIRY_BUDGET_MS en total; nunca lanza. Si Airbnb tarda o
 * falla, la consulta sigue con las fechas que ya había (y el gestor confirma la reserva después).
 */
export async function refreshPropertyCalendars(propertyId: string, now = new Date()) {
  try {
    const feeds = await db.select(feedColumns).from(icalFeeds).innerJoin(properties, eq(icalFeeds.propertyId, properties.id))
      .where(and(eq(icalFeeds.propertyId, propertyId), eq(properties.published, true), ne(properties.rentalType, 'anual'),
        or(isNull(icalFeeds.lastSyncedAt), lt(icalFeeds.lastSyncedAt, new Date(now.getTime() - INQUIRY_MAX_AGE_MS)))));
    if (!feeds.length) return { refreshed: 0, failedFeeds: 0 };
    const run = syncMany(feeds, sql`true`, feeds.length, INQUIRY_BUDGET_MS);
    const summary = await withTimeout(run, INQUIRY_BUDGET_MS + 500);
    return { refreshed: summary.feeds - summary.failedFeeds, failedFeeds: summary.failedFeeds };
  } catch (error) {
    console.warn(`iCal: refresco previo a la consulta de ${propertyId} no completado (se usan las fechas guardadas):`, error instanceof Error ? error.message : error);
    return { refreshed: 0, failedFeeds: -1 };
  }
}
