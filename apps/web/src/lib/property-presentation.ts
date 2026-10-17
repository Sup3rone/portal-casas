export const propertySectionLabels = {
  mapa: 'mapWarnings', destino: 'destino', amenidades: 'amenidades',
  habitaciones: 'habitaciones', lugar: 'enLugar', advertencias: 'advertencias',
  reserva: 'reservar', disponibilidad: 'disponibilidad',
} as const;
export type PropertySectionKey = keyof typeof propertySectionLabels;
export type SectionTitles = Partial<Record<PropertySectionKey, Record<'es' | 'en' | 'fr', string>>>;
export function sectionTitle(titles: unknown, section: PropertySectionKey, locale: string, fallback: string): string {
  if (!titles || typeof titles !== 'object') return fallback;
  const row = (titles as SectionTitles)[section];
  const value = row?.[locale as 'es' | 'en' | 'fr'];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
