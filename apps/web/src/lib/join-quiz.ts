// T-4944: lógica del cuestionario de /unete (sin React, para probarla offline).
// Una pantalla por pregunta; elegir una opción avanza. Las respuestas viven en el hash (#owners/house/Jalisco):
// el botón Atrás del navegador y un enlace directo a un paso funcionan sin estado del router.

export type Audience = 'owners' | 'referrers';
export type StepId = 'audience' | 'propertyType' | 'location' | 'rental' | 'referAudience' | 'channel' | 'reach';
export type Step = { id: StepId; options: string[] };

/** Opción «otro lugar» del paso de ubicación (los estados publicados van antes). */
export const OTHER_LOCATION = 'other';

const fixed: Record<Exclude<StepId, 'location'>, string[]> = {
  audience: ['owners', 'referrers'],
  propertyType: ['house', 'apartment', 'other'],
  rental: ['nightly', 'annual', 'both'],
  referAudience: ['guests', 'owners', 'both'],
  channel: ['social', 'whatsapp', 'person'],
  reach: ['few', 'some', 'many'],
};

/** Pasos del recorrido según la audiencia elegida. Sin estados publicados se omite la ubicación. */
export function stepsFor(audience: string | undefined, states: string[]): Step[] {
  const step = (id: StepId): Step => ({ id, options: id === 'location' ? [...states, OTHER_LOCATION] : fixed[id as Exclude<StepId, 'location'>] });
  if (audience === 'owners') return (['audience', 'propertyType', ...(states.length ? ['location' as const] : []), 'rental'] as StepId[]).map(step);
  if (audience === 'referrers') return (['audience', 'referAudience', 'channel', 'reach'] as StepId[]).map(step);
  return [step('audience')];
}

/** Se queda con el prefijo válido de las respuestas: un hash manipulado o viejo nunca rompe la página. */
export function validAnswers(answers: string[], states: string[]): string[] {
  const steps = stepsFor(answers[0], states);
  const valid: string[] = [];
  for (const [index, answer] of answers.entries()) {
    if (index >= steps.length || !steps[index].options.includes(answer)) break;
    valid.push(answer);
  }
  return valid;
}

export function parseHash(hash: string, states: string[]): string[] {
  let raw = hash.replace(/^#/, '');
  try { raw = decodeURIComponent(raw); } catch { return []; }
  return raw ? validAnswers(raw.split('/'), states) : [];
}

export function toHash(answers: string[]): string {
  return answers.length ? '#' + answers.map(encodeURIComponent).join('/') : '';
}

/** Total de pantallas de pregunta: antes de elegir audiencia se muestra el del recorrido más largo. */
export function totalSteps(answers: string[], states: string[]): number {
  return answers[0] ? stepsFor(answers[0], states).length : Math.max(stepsFor('owners', states).length, stepsFor('referrers', states).length);
}

export function isComplete(answers: string[], states: string[]): boolean {
  return answers.length > 0 && answers.length === stepsFor(answers[0], states).length;
}

/** Tecla de cada opción: A, B, C… (también 1, 2, 3… al pulsar). */
export function optionKey(index: number): string {
  return String.fromCharCode(65 + index);
}

export function optionIndexForKey(key: string, count: number): number {
  const upper = key.toUpperCase();
  const index = /^[1-9]$/.test(key) ? Number(key) - 1 : /^[A-Z]$/.test(upper) ? upper.charCodeAt(0) - 65 : -1;
  return index >= 0 && index < count ? index : -1;
}

/** Resumen para el mensaje de WhatsApp: «Tipo: Casa. Ubicación: Jalisco. Renta: Por año» (sin la audiencia). */
export function answerSummary(steps: Step[], answers: string[], label: (id: StepId, value: string) => string, short: (id: StepId) => string): string {
  return steps.slice(1).map((step, index) => `${short(step.id)}: ${label(step.id, answers[index + 1])}`).join('. ');
}
