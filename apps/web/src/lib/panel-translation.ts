import 'server-only';
export class TranslationError extends Error {
  constructor(public code: string, public status: number) { super(code); }
}
const encoder = new TextEncoder();
export function translationChunks(text: string, maxBytes = 450) {
  const chunks: string[] = []; let chunk = '', bytes = 0;
  for (const token of text.match(/\s+|\S+/gu) || []) {
    const size = encoder.encode(token).length;
    if (size <= maxBytes) {
      if (bytes + size > maxBytes && chunk) { chunks.push(chunk); chunk = ''; bytes = 0; }
      chunk += token; bytes += size;
    } else {
      for (const character of token) {
        const length = encoder.encode(character).length;
        if (bytes + length > maxBytes && chunk) { chunks.push(chunk); chunk = ''; bytes = 0; }
        chunk += character; bytes += length;
      }
    }
  }
  if (chunk) chunks.push(chunk);
  return chunks;
}
function decode(text: string) {
  return text.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[0-9a-f]+);/gi, entity => {
    const known: Record<string,string> = { '&amp;':'&', '&quot;':'"', '&apos;':"'", '&lt;':'<', '&gt;':'>' };
    if (known[entity.toLowerCase()]) return known[entity.toLowerCase()];
    const hex = entity.toLowerCase().startsWith('&#x');
    const value = parseInt(entity.slice(hex ? 3 : 2, -1), hex ? 16 : 10);
    return value >= 0 && value <= 0x10ffff ? String.fromCodePoint(value) : entity;
  });
}
export async function translateText(text: string, source: string, target: string) {
  const signal = AbortSignal.timeout(20000), output: string[] = [];
  try {
    for (const chunk of translationChunks(text)) {
      if (!chunk.trim()) { output.push(chunk); continue; }
      const url = new URL('https://api.mymemory.translated.net/get');
      url.search = new URLSearchParams({ q: chunk.trim(), langpair: `${source}|${target}` }).toString();
      const response = await fetch(url, { cache: 'no-store', signal });
      const data = await response.json().catch(() => null);
      if (response.status === 429 || (data?.quotaFinished === true || data?.quotaFinished === 'true') || /used all available|quota|translation limit/i.test(String(data?.responseDetails || '') + String(data?.responseData?.translatedText || ''))) throw new TranslationError('TRANSLATION_QUOTA', 429);
      if (!response.ok || Number(data?.responseStatus) !== 200 || typeof data?.responseData?.translatedText !== 'string' || !data.responseData.translatedText.trim()) throw new TranslationError('TRANSLATION_FAILED', 502);
      output.push((chunk.match(/^\s*/u)?.[0] || '') + decode(data.responseData.translatedText.trim()) + (chunk.match(/\s*$/u)?.[0] || ''));
    }
    return output.join('');
  } catch (error) {
    if (error instanceof TranslationError) throw error;
    throw new TranslationError('TRANSLATION_FAILED', 502);
  }
}
// Protección básica por instancia; el proveedor sigue imponiendo su cuota por IP.
const requests = new Map<string, { start: number; count: number }>();
let day = '', characters = 0;
export function translationAllowance(userId: string, text: string, now = Date.now()) {
  for (const [id, value] of requests) if (now - value.start >= 60000) requests.delete(id);
  const current = requests.get(userId) || { start: now, count: 0 };
  if (current.count >= 4) throw new TranslationError('TRANSLATION_RATE_LIMIT', 429);
  current.count++; requests.set(userId, current);
  const date = new Date(now).toISOString().slice(0, 10);
  if (date !== day) { day = date; characters = 0; }
  const length = [...text].length;
  if (characters + length > 5000) throw new TranslationError('TRANSLATION_QUOTA', 429);
  characters += length;
}
