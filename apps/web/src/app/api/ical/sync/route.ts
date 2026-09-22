import { NextRequest, NextResponse } from 'next/server';
import { db, icalFeeds, bookings } from '@portal/db';
import * as ical from 'node-ical';
import { eq, inArray } from 'drizzle-orm';
import { createHash } from 'crypto';

function tokenValido(password: string | undefined): string {
  return createHash('sha256')
    .update(`${password}::portal-casas-salt`)
    .digest('hex');
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('admin_session')?.value;
  if (cookie !== tokenValido(process.env.ADMIN_PASSWORD)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const feedRows = await db.select().from(icalFeeds);
    if (feedRows.length === 0) {
      return NextResponse.json({ success: true, synced: 0, message: 'No hay feeds configurados' });
    }

    let totalSynced = 0;

    for (const feed of feedRows) {
      const events: any = await ical.fromURL(feed.url);
      if (!events || typeof events !== 'object') {
        console.warn(`Feed vacío: ${feed.id}`);
        continue;
      }

      const currentEventIds: string[] = [];

      for (const key in events) {
        const event = events[key];
        if (event.type !== 'VEVENT') continue;

        const start = (event as any).start;
        const end = (event as any).end || (event as any).start;
        const feedId = feed.id;
        const propertyId = feed.propertyId;
        const source = feed.source === 'airbnb' ? 'airbnb' : 'google';

        if (!start || !end) continue;

        await db.insert(bookings)
          .values({
            propertyId: propertyId,
            icalFeedId: feedId,
            startDate: start.toISOString().slice(0, 10),
            endDate: end.toISOString().slice(0, 10),
            source: source as "airbnb" | "google",
          })
          .onConflictDoNothing();

        currentEventIds.push();
      }
      console.log(`Feed ${feed.id}: sincronizados ${currentEventIds.length} eventos`);
      totalSynced += currentEventIds.length;
    }

    console.log("Skipping lastSyncedAt update (column not ready yet)");
    }

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      message: `Sincronización completada: ${totalSynced} eventos`
    });
  } catch (error) {
    console.error('Error en sync:', error);
    return NextResponse.json({ error: 'Error en sincronización' }, { status: 500 });
  }
}
