import { NextResponse } from 'next/server';
import { accessFailure, requirePropertyManager } from '@/lib/property-access';
import { syncManagedFeeds } from '@/lib/ical-sync-runner';

// T-4680: sync idempotente. Cada feed se reconcilia por (icalFeedId, icalUid):
// 1) upsert de los eventos vigentes; 2) borrar los que ya no vienen (cancelados,
// retirados o filas antiguas sin UID). Si el paso 2 fallara, quedan días de más
// bloqueados (seguro) y el siguiente sync lo corrige; nunca se liberan fechas por error.
// T-4739: la lógica vive en lib/ical-sync-runner.ts (compartida con el cron diario y la consulta pública).
export async function POST() {
  try {
    const manager = await requirePropertyManager();
    const { feeds, synced: totalSynced, removed: totalRemoved, failedFeeds, skippedAnnual } = await syncManagedFeeds(manager);
    if (feeds === 0) {
      return NextResponse.json({ success: true, synced: 0, removed: 0, failedFeeds: 0, skippedAnnual, message: 'No hay feeds elegibles para sincronizar' });
    }
    if (failedFeeds === feeds) {
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
