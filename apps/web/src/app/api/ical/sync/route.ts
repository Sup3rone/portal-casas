import { NextResponse } from 'next/server';
import { db, icalFeeds, properties } from '@portal/db';
import * as ical from 'node-ical';
import { and, eq, sql } from 'drizzle-orm';
import { AccessError, accessFailure, managedProperties, requirePropertyManager } from '@/lib/property-access';
import { feedEvents, isCalendar } from '@/lib/ical-sync';

// T-4680: sync idempotente. Cada feed se reconcilia por (icalFeedId, icalUid):
// 1) upsert de los eventos vigentes; 2) borrar los que ya no vienen (cancelados,
// retirados o filas antiguas sin UID). Si el paso 2 fallara, quedan días de más
// bloqueados (seguro) y el siguiente sync lo corrige; nunca se liberan fechas por error.
export async function POST() {
  try {
    const manager = await requirePropertyManager();
    const feeds = await db.select({ feed: icalFeeds, rentalType: properties.rentalType }).from(icalFeeds)
      .innerJoin(properties, eq(icalFeeds.propertyId, properties.id))
      .where(managedProperties(manager));
    const skippedAnnual = feeds.filter(row => row.rentalType === 'anual').length;
    const feedRows = feeds.filter(row => row.rentalType !== 'anual').map(row => row.feed);
    if (skippedAnnual) console.info(`iCal: omitidos ${skippedAnnual} feeds de propiedades anuales`);
    if (feedRows.length === 0) {
      return NextResponse.json({ success: true, synced: 0, removed: 0, failedFeeds: 0, skippedAnnual, message: 'No hay feeds elegibles para sincronizar' });
    }

    let totalSynced = 0, totalRemoved = 0, failedFeeds = 0;

    for (const feed of feedRows) {
      let events;
      try {
        const parsed = await ical.fromURL(feed.url);
        // Un feed caído o una página de error no debe vaciar el calendario: no se toca nada.
        if (!isCalendar(parsed)) throw new Error('not a calendar');
        events = feedEvents(parsed);
      } catch {
        failedFeeds++;
        console.warn(`iCal: feed ${feed.id} no se pudo leer; se conservan sus fechas`);
        continue;
      }
      const source = feed.source === 'airbnb' ? 'airbnb' : 'google';
      const guard = and(eq(properties.id, feed.propertyId), eq(icalFeeds.id, feed.id), managedProperties(manager));

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
      totalSynced += events.length; totalRemoved += removed.rows.length;
    }

    if (failedFeeds === feedRows.length) {
      return NextResponse.json({ error: 'No se pudo leer ningún feed', failedFeeds, skippedAnnual }, { status: 502 });
    }
    return NextResponse.json({
      success: true,
      synced: totalSynced,
      removed: totalRemoved,
      failedFeeds,
      skippedAnnual,
      message: `Sincronización completada: ${totalSynced} eventos vigentes, ${totalRemoved} retirados${failedFeeds ? `, ${failedFeeds} feeds sin leer` : ''}`,
    });
  } catch (error) {
    const denied = accessFailure(error);
    if (denied) return NextResponse.json({ error: denied.message }, { status: denied.status });
    console.error('Error en sync:', error);
    return NextResponse.json({ error: 'Error en sincronización' }, { status: 500 });
  }
}
