// T-5072: traducción automática al guardar en el panel, con DeepL (sustituye al botón «Traducir» y a MyMemory).
// Uso en cada guardado: const t = await autoTranslate(grupos) → escribir t.groups en BD → await t.commit().
// Sin DEEPL_API_KEY o si DeepL falla, se guarda igual: los idiomas vacíos llevan el español y se reintentan
// al volver a guardar. Sin la tabla AutoTranslation (SQL pendiente), solo se rellenan los idiomas vacíos.
import 'server-only';
import { inArray, sql } from 'drizzle-orm';
import { db, autoTranslations } from '@portal/db';
import { applyTranslations, planTranslations, protectPlaceholders, restorePlaceholders, stateKey, targetLanguages, autoTranslatedKeys,
  type TargetLanguage, type TranslationGroup, type TranslationState } from './auto-translation-plan';

export type { TranslationGroup, TranslationOutcome } from './auto-translation-plan';

const BATCH_TEXTS = 50, BATCH_CHARS = 60000; // DeepL: hasta 50 textos y 128 KiB por petición.

function missingTable(error: unknown) {
  for (let current = error, depth = 0; current && depth < 4; current = (current as { cause?: unknown }).cause, depth++) {
    const { code, message } = current as { code?: string; message?: string };
    if (code === '42P01' || /AutoTranslation/.test(message ?? '') && /does not exist|no existe|no such table/.test(message ?? '')) return true;
  }
  return false;
}

async function readStates(groups: TranslationGroup[]) {
  const keys = groups.flatMap(group => targetLanguages.map(language => stateKey(group.key, language)));
  const states = new Map<string, TranslationState>();
  if (!keys.length) return { states, ready: true };
  try {
    for (const row of await db.select().from(autoTranslations).where(inArray(autoTranslations.key, keys))) states.set(row.key, row);
    return { states, ready: true };
  } catch (error) {
    if (missingTable(error)) return { states, ready: false };
    throw error;
  }
}

async function deepl(texts: string[], target: TargetLanguage): Promise<string[]> {
  const key = process.env.DEEPL_API_KEY?.trim();
  if (!key) throw new Error('TRANSLATION_NOT_CONFIGURED');
  // Las claves gratuitas terminan en «:fx» y van a otro host.
  const host = key.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
  const response = await fetch(`${host}/v2/translate`, {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `DeepL-Auth-Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: texts.map(protectPlaceholders), source_lang: 'ES', target_lang: target === 'en' ? 'EN-US' : 'FR',
      tag_handling: 'xml', ignore_tags: ['keep'], preserve_formatting: true }),
  });
  const data = await response.json().catch(() => null) as { translations?: { text?: unknown }[] } | null;
  if (!response.ok || !Array.isArray(data?.translations) || data.translations.length !== texts.length) throw new Error(`TRANSLATION_FAILED_${response.status}`);
  return data.translations.map(item => {
    if (typeof item?.text !== 'string') throw new Error('TRANSLATION_FAILED');
    return restorePlaceholders(item.text);
  });
}

/** Traduce en lotes por idioma; un lote que falla deja sus textos en null (se guardan en español y se reintentan). */
async function translateAll(texts: string[], languages: TargetLanguage[]) {
  const results: (string | null)[] = texts.map(() => null);
  for (const target of targetLanguages) {
    const indexes = languages.flatMap((language, index) => language === target ? [index] : []);
    for (let start = 0; start < indexes.length;) {
      const batch: number[] = [];
      let chars = 0;
      while (start < indexes.length && batch.length < BATCH_TEXTS && (!batch.length || chars + texts[indexes[start]].length <= BATCH_CHARS)) {
        chars += texts[indexes[start]].length; batch.push(indexes[start++]);
      }
      try {
        const translated = await deepl(batch.map(index => texts[index]), target);
        batch.forEach((index, position) => { results[index] = translated[position]; });
      } catch (error) {
        console.error('Traducción automática: no se pudo traducir con DeepL:', error instanceof Error ? error.message : error);
      }
    }
  }
  return results;
}

export async function autoTranslate(groups: TranslationGroup[]) {
  const { states, ready } = await readStates(groups);
  const { jobs, clears } = planTranslations(groups, states);
  const results = jobs.length ? await translateAll(jobs.map(job => groups[job.group].es.trim()), jobs.map(job => job.language)) : [];
  const applied = applyTranslations(groups, jobs, results, clears);
  return {
    groups: applied.groups,
    outcome: applied.outcome,
    /** Guarda el estado; llamar solo después de escribir los textos. Si falla, el texto ya guardado manda. */
    async commit() {
      if (!ready || !applied.writes.size) return;
      const upserts = [...applied.writes].flatMap(([key, state]) => state ? [{ key, ...state, updatedAt: new Date() }] : []);
      const deletes = [...applied.writes].flatMap(([key, state]) => state ? [] : [key]);
      try {
        if (upserts.length) await db.insert(autoTranslations).values(upserts).onConflictDoUpdate({ target: autoTranslations.key,
          set: { sourceHash: sqlExcluded('sourceHash'), valueHash: sqlExcluded('valueHash'), updatedAt: sqlExcluded('updatedAt') } });
        if (deletes.length) await db.delete(autoTranslations).where(inArray(autoTranslations.key, deletes));
      } catch (error) {
        if (!missingTable(error)) console.error('Traducción automática: no se pudo guardar el estado:', error);
      }
    },
  };
}

/** Claves de estado ("…:en", "…:fr") cuyo texto actual es la traducción automática; para la etiqueta del panel. */
export async function readAutoTranslated(groups: TranslationGroup[]) {
  try { return new Set(autoTranslatedKeys(groups, (await readStates(groups)).states)); }
  catch (error) { console.error('Traducción automática: no se pudo leer el estado:', error); return new Set<string>(); }
}

function sqlExcluded(column: 'sourceHash' | 'valueHash' | 'updatedAt') {
  return sql.raw(`excluded."${column}"`);
}
