import 'server-only';
import { cache } from 'react';
import { db, properties } from '@portal/db';
import { eq } from 'drizzle-orm';
import { isDestinationValue } from './destinations';

export type PublishedDestinationGroup = { state: string; cities: string[] };

// Igual que readPublishedProperty: deduplicación por render, sin caché entre visitas.
export const readPublishedDestinations = cache(async (): Promise<PublishedDestinationGroup[]> => {
  const rows = await db.select({ state: properties.state, destinationCity: properties.destinationCity })
    .from(properties).where(eq(properties.published, true)).groupBy(properties.state, properties.destinationCity);
  return groupDestinations(rows);
});

// T-5201: agrupación compartida con los destinos de las casas que gestiona el vendedor (vendor-availability.ts).
export function groupDestinations(rows: { state: string | null; destinationCity: string | null }[]): PublishedDestinationGroup[] {
  const groups = new Map<string, string[]>();
  for (const row of rows) {
    if (!isDestinationValue(row)) continue;
    const cities = groups.get(row.state) || [];
    cities.push(row.destinationCity);
    groups.set(row.state, cities);
  }
  const compare = (a: string, b: string) => a.localeCompare(b, 'es');
  return [...groups].sort(([a], [b]) => compare(a, b))
    .map(([state, cities]) => ({ state, cities: cities.sort(compare) }));
}
