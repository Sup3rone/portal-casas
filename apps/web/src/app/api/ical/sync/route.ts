import { NextRequest, NextResponse } from 'next/server';
import { db, icalFeeds, bookings } from '@portal/db';
import * as ical from 'node-ical';
import { eq, inArray } from 'drizzle-orm';
import { createHash } from 'crypto';

// Token admin
function tokenValido(password: string | undefined): string {
  return createHash('sha256')
    .update(`${password}::portal-casas-salt`)
    .digest('hex');
}

export async function GET(req: NextRequest) {
  // Protegido: solo admin
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
      try {
        // Descargar y parsear el .ics — tipado como any por las typings quisquillosas de node-ical
        const events: any = await ical.fromURL(feed.url);

        if (!events || typeof events !== 'object') {
          console.warn(`Feed vacío o inválido: ${feed.id}`);
          continue;
        }

        const currentEventIds: string[] = [];

        for (const evt of Object.values(events) as any[]) {
          if (!evt || evt.type !== 'VEVENT' || !evt.start || !evt.end) continue;

          const startDate = evt.start instanceof Date
            ? evt.start.toISOString().slice(0, 10)
            : String(evt.start).slice(0, 10);
          const endDate = evt.end instanceof Date
            ? evt.end.toISOString().slice(0, 10)
            : String(evt.end).slice(0, 10);

          const uid = String(evt.uid || `${feed.id}_${startDate}_${endDate}`);
          currentEventIds.push(uid);

          await db.insert(bookings).values({
            id: uid,
            propertyId: feed.propertyId,
            icalFeedId: feed.id,
            startDate,
            endDate,
            source: feed.source,
            summary: evt.summary || null,
          }).onConflictDoNothing({ target: bookings.id });

          totalSynced++;
        }

        // Borrar reservas que ya no están en el feed (cancelaciones)
        const bookedIdsInDb = await db
          .select({ id: bookings.id })
          .from(bookings)
          .where(eq(bookings.icalFeedId, feed.id));

        const idsToRemove = bookedIdsInDb
          .map((b) => b.id)
          .filter((id) => !currentEventIds.includes(id));

        if (idsToRemove.length > 0) {
          await db.delete(bookings).where(inArray(bookings.id, idsToRemove));
        }

        console.log(`Feed ${feed.id}: sincronizado (${currentEventIds.length} eventos)`);
      } catch (err) {
        console.error(`Error procesando feed ${feed.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      message: `Sincronización completada: ${totalSynced} eventos procesados`
    });
  } catch (error) {
    console.error('Error en sync:', error);
    return NextResponse.json({ error: 'Error en sincronización' }, { status: 500 });
  }
}
