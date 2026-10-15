// La clave histórica admite un ID o un array JSON de hasta cuatro IDs.
export function parseFeaturedSelection(value: string): string[] | null {
  const text = value.trim();
  if (!text) return [];
  let ids: unknown = [text];
  if (text.startsWith('[')) {
    try { ids = JSON.parse(text); } catch { return null; }
  }
  if (!Array.isArray(ids) || ids.length > 4 || ids.some(id => typeof id !== 'string' || !id.trim() || id.trim().length > 200)) return null;
  const normalized = ids.map((id: string) => id.trim());
  return new Set(normalized).size === normalized.length ? normalized : null;
}

export function serializeFeaturedSelection(ids: string[]): string {
  const selected = ids.map(id => id.trim()).filter(Boolean);
  return selected.length === 1 ? selected[0] : selected.length ? JSON.stringify(selected) : '';
}
