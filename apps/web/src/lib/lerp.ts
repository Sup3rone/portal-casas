// T-4682: interpolación lineal para animaciones suaves (sin librerías).

/** Punto entre a y b: t=0 → a, t=1 → b. */
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * Factor de lerp independiente de los FPS: `factor` es la fracción que se avanza
 * en un fotograma de 60 Hz; con más o menos tiempo entre fotogramas se compensa.
 */
export function frameFactor(factor: number, elapsedMs: number) {
  const frames = Math.min(Math.max(elapsedMs, 0), 100) / (1000 / 60);
  return 1 - Math.pow(1 - factor, frames);
}

/** Acerca `current` a `target`; si ya está a menos de `epsilon`, llega exacto (fin de animación). */
export function approach(current: number, target: number, t: number, epsilon = 0.05) {
  const next = lerp(current, target, t);
  return Math.abs(target - next) < epsilon ? target : next;
}
