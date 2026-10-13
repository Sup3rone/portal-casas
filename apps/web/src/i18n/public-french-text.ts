// No inventar contenido cuando el campo francés contiene texto de prueba.
export function publicFrenchText(value: string | null | undefined) {
  const text = value?.trim() || '';
  return /\b(?:lorem\s+ipsum|test\s+text|texte\s+de\s+test|texto\s+de\s+prueba|placeholder)\b/iu.test(text) ? '' : text;
}
