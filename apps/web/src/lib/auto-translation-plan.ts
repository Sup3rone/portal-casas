// T-5072: reglas de la traducción automática al guardar, sin red ni BD (las usan auto-translation.ts y los tests).
// Se escribe en español; en/fr se traducen solos si están vacíos o si siguen siendo la traducción automática
// (su texto coincide con el que se guardó). Si alguien edita en/fr a mano, ese campo ya no se toca.
import { createHash } from 'node:crypto';

export const targetLanguages = ['en', 'fr'] as const;
export type TargetLanguage = typeof targetLanguages[number];
/** Un campo traducible: key estable (p. ej. "property:<id>:title") y su texto en los tres idiomas. */
// copySource (por defecto true): si la traducción falla, un idioma vacío lleva el español. Las Páginas lo apagan:
// allí vacío = el texto por defecto de messages/*.json en ese idioma, mejor que el español.
export type TranslationGroup = { key: string; es: string; en: string; fr: string; maxLength?: number; copySource?: boolean };
export type TranslationState = { sourceHash: string; valueHash: string };
export type TranslationJob = { group: number; language: TargetLanguage };
/** none: nada que traducir; translated: todo traducido; pending: falló el proveedor y se reintenta al volver a guardar. */
export type TranslationOutcome = 'none' | 'translated' | 'pending';

/** sourceHash de un idioma copiado del español porque la traducción falló: nunca coincide, así se reintenta. */
export const PENDING_SOURCE = 'pending';
export const stateKey = (key: string, language: TargetLanguage) => `${key}:${language}`;
export const textHash = (text: string) => createHash('sha256').update(text).digest('hex');

/** El valor sigue siendo el automático: no se ha editado a mano desde que se guardó. */
export function isAutoValue(value: string, state: TranslationState | undefined) {
  return Boolean(state && value.trim() && textHash(value.trim()) === state.valueHash);
}

export function planTranslations(groups: TranslationGroup[], states: Map<string, TranslationState>) {
  const jobs: TranslationJob[] = [], clears: TranslationJob[] = [];
  groups.forEach((group, index) => {
    const source = group.es.trim();
    for (const language of targetLanguages) {
      const value = group[language].trim(), state = states.get(stateKey(group.key, language));
      if (value && !isAutoValue(value, state)) continue; // escrito a mano: se respeta
      if (!source) { if (value) clears.push({ group: index, language }); continue; } // sin español, fuera lo automático
      if (value && state!.sourceHash === textHash(source)) continue; // ya está al día
      jobs.push({ group: index, language });
    }
  });
  return { jobs, clears };
}

/** Aplica las traducciones (null = falló). Devuelve los grupos nuevos y las filas de estado a escribir (null = borrar). */
export function applyTranslations(groups: TranslationGroup[], jobs: TranslationJob[], results: (string | null)[], clears: TranslationJob[]) {
  const next = groups.map(group => ({ ...group }));
  const writes = new Map<string, TranslationState | null>();
  let pending = false;
  jobs.forEach((job, index) => {
    const group = next[job.group], source = group.es.trim(), key = stateKey(group.key, job.language);
    const result = results[index]?.trim();
    if (result && (!group.maxLength || result.length <= group.maxLength)) {
      group[job.language] = result;
      writes.set(key, { sourceHash: textHash(source), valueHash: textHash(result) });
      return;
    }
    pending = true;
    // Mejor el español que un idioma vacío; queda marcado como automático y pendiente.
    if (!group[job.language].trim() && group.copySource !== false) {
      group[job.language] = source;
      writes.set(key, { sourceHash: PENDING_SOURCE, valueHash: textHash(source) });
    }
  });
  for (const clear of clears) {
    next[clear.group][clear.language] = '';
    writes.set(stateKey(next[clear.group].key, clear.language), null);
  }
  const outcome: TranslationOutcome = pending ? 'pending' : jobs.length ? 'translated' : 'none';
  return { groups: next, writes, outcome };
}

/** Campos (por key de estado) que hoy muestran la traducción automática, para la etiqueta del panel. */
export function autoTranslatedKeys(groups: TranslationGroup[], states: Map<string, TranslationState>) {
  return groups.flatMap(group => targetLanguages.filter(language => isAutoValue(group[language], states.get(stateKey(group.key, language))))
    .map(language => stateKey(group.key, language)));
}

/** Protege {marcadores} (p. ej. {summary} en los mensajes de WhatsApp) para que el traductor no los toque. */
export function protectPlaceholders(text: string) {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(/\{(\w+)\}/g, '<keep>{$1}</keep>');
}
export function restorePlaceholders(text: string) {
  return text.replace(/<keep>(\{\w+\})<\/keep>/g, '$1').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
