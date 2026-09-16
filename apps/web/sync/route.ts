import { NextRequest, NextResponse } from 'next/server';
import { db, icalFeeds, bookings } from '@portal/db';
import ical from 'node-ical';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { createHash } from 'crypto';

// Token admin (misma lógica del login para proteger el sync)
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
    const now = new Date();

    for (const feed of feedRows) {
      try {
        // Descargar y parsear el .ics
        const events = await ical.fromURL(feed.url);

        if (!events || typeof events !== 'object') {
          console.warn(`Feed vacío o inválido: ${feed.id}`);
          continue;
        }

        // Buscar solo eventos tipo VEVENT (eventos de calendario reales)
        const eventos = Object.values(events).filter(
          (item): item is ical.EventObject =>
            item && typeof item === 'object' && 'type' in item && item.type === 'VEVENT'
        );

        // IDs de eventos actuales para este feed
        const currentEventIds: string[] = [];
        let syncedCount = 0;

        for (const evt of eventos) {
          if (!evt.start || !evt.end) continue;

          const startDate = new Date(evt.start).toISOString().slice(0, 10); // YYYY-MM-DD
          const endDate = new Date(evt.end).toISOString().slice(0, 10);

          // Eventualmente usar el UID del evento como ID único para no duplicar
          const uid = evt.uid || `${feed.id}_${startDate}_${endDate}`;
          currentEventIds.push(uid);

          await db.insert(bookings).values({
            id: uid,
            propertyId: feed.propertyId,
            icalFeedId: feed.id,
            startDate,
            endDate,
            source: feed.source,
            summary: evt.summary ?? null,
          }).onConflictDoNothing({ target: bookings.id });

          syncedCount++;
          totalSynced++;
        }

        // Borrar eventos antiguos que ya no están en el feed (cancelaciones)
        const bookedIdsInDb = await db
          .select({ id: bookings.id })
          .from(bookings)
          .where(eq(bookings.icalFeedId, feed.id));

        const idsToRemove = bookedIdsInDb
          .map(b => b.id)
          .filter(id => !currentEventIds.includes(id));

        if (idsToRemove.length > 0) {
          await db.delete(bookings)
            .where(inArray(bookings.id, idsToRemove) as any);
          console.log(`Eliminadas ${idsToRemove.length} cancelaciones en feed ${feed.id}`);
        }

        console.log(`Sincronizados ${syncedCount} eventos del feed ${feed.id}`);
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
