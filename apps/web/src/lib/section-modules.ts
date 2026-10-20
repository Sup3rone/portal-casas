// Configuración independiente del contenido: null conserva la visibilidad histórica.
export const moduleNames = ['destino', 'amenidades', 'habitaciones', 'lugar', 'advertencias', 'mapa', 'reserva'] as const;
export type ModuleName = typeof moduleNames[number];
export function validSectionOrder(value: unknown): value is ModuleName[] {
  return Array.isArray(value) && value.length === moduleNames.length && new Set(value).size === moduleNames.length
    && value.every(name => moduleNames.includes(name)) && value.at(-1) === 'reserva';
}
export function sectionOrder(value: unknown): ModuleName[] { return validSectionOrder(value) ? [...value] : [...moduleNames]; }
export type SectionModules = Partial<Record<ModuleName, boolean>>;
export const emptySectionModules = () => Object.fromEntries(moduleNames.map(name => [name, name === 'reserva'])) as Record<ModuleName, boolean>;

type Property = { sectionsEnabled?: SectionModules | null; address?: string | null; city?: string | null; destinationCity?: string | null; lat?: number | null; lng?: number | null };
type Section = { section: string; descriptionEs: string | null; descriptionEn: string | null; descriptionFr: string | null; photoMediaIds?: string[] | null };
type Media = { id: string; category?: string; type: string };
export function sectionModules(property: Property, sections: Section[], media: Media[]): Record<ModuleName, boolean> {
  const result = emptySectionModules();
  for (const name of moduleNames) {
    const row = sections.find(row => row.section === name);
    const text = [row?.descriptionEs, row?.descriptionEn, row?.descriptionFr].some(value => Boolean(value?.trim()));
    const photos = name !== 'advertencias' && media.some(photo => row?.photoMediaIds?.length
      ? photo.type === 'PHOTO' && row.photoMediaIds.includes(photo.id)
      : photo.category === name);
    const data = name === 'mapa' ? property.lat != null && property.lng != null
      : text || photos || name === 'destino' && Boolean(property.address?.trim() || property.destinationCity?.trim() || property.city?.trim());
    result[name] = property.sectionsEnabled?.[name] ?? data;
  }
  result.reserva = true;
  return result;
}
