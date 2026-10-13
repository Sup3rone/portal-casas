export const draftLanguages = ['es', 'en', 'fr'] as const;
export type DraftLanguage = typeof draftLanguages[number];
export type TranslationControls = Record<DraftLanguage, { value: string; maxLength?: number }>;
export async function translateFields(source: DraftLanguage, controls: TranslationControls, request: (text: string, source: DraftLanguage, target: DraftLanguage) => Promise<string>) {
  const text = controls[source].value;
  if (!text.trim()) throw new Error('emptySource');
  const targets = draftLanguages.filter(language => language !== source && !controls[language].value.trim());
  // No aplicar nada hasta tener todos los resultados; un fallo conserva el formulario.
  const results = await Promise.all(targets.map(async language => ({ language, text: await request(text, source, language) })));
  if (controls[source].value !== text) throw new Error('sourceChanged');
  for (const result of results) {
    const limit = controls[result.language].maxLength;
    if (!result.text.trim()) throw new Error('error');
    if (limit && limit > 0 && result.text.length > limit) throw new Error('tooLong');
  }
  const filled: DraftLanguage[] = [], skipped: DraftLanguage[] = [];
  for (const language of draftLanguages) {
    if (language === source) continue;
    const result = results.find(item => item.language === language);
    // Proteger también lo escrito mientras esperaba la petición.
    if (!result || controls[language].value.trim()) { skipped.push(language); continue; }
    controls[language].value = result.text; filled.push(language);
  }
  return { filled, skipped };
}
