// Preparación pura del contenido público; sin consultas ni fallback de idioma.
export const editorialOrder = ['destino', 'amenidades', 'habitaciones', 'lugar'] as const;
type Media = { id: string; propertyId: string; url: string; type: 'PHOTO' | 'VIDEO'; category: string; order: number };
type Section = { propertyId: string; section: string; descriptionEs: string | null; descriptionEn: string | null; descriptionFr: string | null; heroMediaId: string | null; photoMediaIds?: string[] | null };
export type EditorialSlide = { section: typeof editorialOrder[number]; description: string; hero?: { id: string; url: string }; photos: { id: string; url: string }[] };

export function sceneGeometry(heights: number[], viewport: number) {
  let start = 0;
  return heights.map(height => {
    const length = Math.max(1, viewport, height);
    const scene = { start, length, overflow: Math.max(0, height - viewport) };
    start += length;
    return scene;
  });
}

export function sceneProgress(distance: number, viewport: number, geometry: ReturnType<typeof sceneGeometry>, reduced: boolean) {
  const index = Math.max(0, geometry.findLastIndex(scene => distance >= scene.start));
  const scene = geometry[index];
  const phase = scene ? Math.max(0, Math.min(1, (distance - scene.start - scene.overflow) / Math.max(1, viewport))) : 0;
  const fade = reduced ? 0 : Math.max(0, Math.min(1, (phase - 0.75) / 0.25));
  return { index, fade, active: fade >= 0.5 ? Math.min(geometry.length - 1, index + 1) : index };
}

export function editorialPresentation(propertyId: string, locale: string, sections: Section[], media: Media[]): EditorialSlide[] {
  const field = locale === 'en' ? 'descriptionEn' : locale === 'fr' ? 'descriptionFr' : 'descriptionEs';
  const photos = media.filter(item => item.propertyId === propertyId && item.type === 'PHOTO')
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  return editorialOrder.flatMap(section => {
    const row = sections.find(item => item.propertyId === propertyId && item.section === section);
    const description = row?.[field]?.trim() || '';
    if (!row || (!description && !row.heroMediaId)) return [];
    const hero = photos.find(photo => photo.id === row.heroMediaId);
    const category = section === 'destino' ? 'principal' : section;
    const ordered = row.photoMediaIds?.length
      ? row.photoMediaIds.flatMap(id => { const photo = photos.find(item => item.id === id); return photo ? [photo] : []; })
      : photos.filter(photo => photo.category === category);
    return [{ section, description, hero: hero || ordered[0], photos: ordered.slice(0, 2).map(({ id, url }) => ({ id, url })) }];
  });
}

export function editorialProgress(distance: number, height: number, count: number, reduced: boolean) {
  const position = Math.max(0, Math.min(count - 1, distance / Math.max(1, height)));
  const index = Math.floor(position);
  const fade = reduced ? 0 : Math.max(0, Math.min(1, (position - index - 0.75) / 0.25));
  return { index, fade, active: fade >= 0.5 ? Math.min(count - 1, index + 1) : index };
}

export function editorialSwipe(start: { x: number; y: number }, end: { x: number; y: number }) {
  const dx = end.x - start.x, dy = end.y - start.y;
  return Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : -1) : 0;
}
