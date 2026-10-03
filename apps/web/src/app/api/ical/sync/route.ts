import { NextResponse } from 'next/server';
import { db, icalFeeds, properties } from '@portal/db';
import * as ical from 'node-ical';
import { and, eq, sql } from 'drizzle-orm';
import { AccessError, accessFailure, managedProperties, requirePropertyManager } from '@/lib/property-access';

export async function POST() {
  try {
    const manager = await requirePropertyManager();
    const feeds = await db.select({ feed: icalFeeds }).from(icalFeeds)
      .innerJoin(properties, eq(icalFeeds.propertyId, properties.id))
      .where(managedProperties(manager));
    const feedRows = feeds.map(row => row.feed);
    if (feedRows.length === 0) {
      return NextResponse.json({ success: true, synced: 0, message: 'No hay feeds configurados' });
    }

    let totalSynced = 0;

    for (const feed of feedRows) {
      const events = await ical.fromURL(feed.url);
      if (!events || typeof events !== 'object') {
        console.warn(`Feed vacío: ${feed.id}`);
        continue;
      }

      const currentEventIds: string[] = [];

      for (const key in events) {
        const event = events[key];
        if (!event || event.type !== 'VEVENT') continue;

        const start = event.start;
        const end = event.end || event.start;
        const feedId = feed.id;
        const propertyId = feed.propertyId;
        const source = feed.source === 'airbnb' ? 'airbnb' : 'google';

        if (!start || !end) continue;

        // Revalidar dueño y relación del feed al insertar, incluso después del fetch remoto.
        const result = await db.execute(sql`
          insert into "Booking" ("id", "propertyId", "icalFeedId", "startDate", "endDate", "source")
          select ${crypto.randomUUID()}, ${properties.id}, ${icalFeeds.id},
            ${start.toISOString().slice(0, 10)}::date, ${end.toISOString().slice(0, 10)}::date, ${source}
          from ${properties} inner join ${icalFeeds} on ${eq(icalFeeds.propertyId, properties.id)}
          where ${and(eq(properties.id, propertyId), eq(icalFeeds.id, feedId), managedProperties(manager))}
          returning "id"
        `);
        if (!result.rows.length) throw new AccessError(404);

        currentEventIds.push(String(event.uid ?? `${feed.id}-${start.toISOString()}`));
      }
      console.log(`Feed ${feed.id}: sincronizados ${currentEventIds.length} eventos`);
      totalSynced += currentEventIds.length;
    }

    console.log("Skipping lastSyncedAt update (column not ready yet)");

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      message: `Sincronización completada: ${totalSynced} eventos`
    });
  } catch (error) {
    const denied = accessFailure(error);
    if (denied) return NextResponse.json({ error: denied.message }, { status: denied.status });
    console.error('Error en sync:', error);
    return NextResponse.json({ error: 'Error en sincronización' }, { status: 500 });
  }
}
