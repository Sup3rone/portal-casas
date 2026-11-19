// T-4944: título que entra palabra por palabra (cada palabra sube desde detrás de una máscara).
// Sin hooks: se pinta en el servidor. El lector de pantalla y los buscadores leen el texto entero (sr-only);
// las palabras animadas van aria-hidden. Arranca dentro de un <Reveal> (.reveal-visible) o, con paint,
// al primer pintado (lo visible sin scroll). Con reduced-motion se ve quieto (globals.css).
import { Fragment, type CSSProperties } from 'react';

export default function SplitWords({ text, paint = false, step = 70 }: { text: string; paint?: boolean; step?: number }) {
  const words = text.split(/\s+/).filter(Boolean);
  return <>
    <span className="sr-only">{text}</span>
    <span aria-hidden="true" className={`split-words${paint ? ' split-words-paint' : ''}`}>
      {words.map((word, index) => <Fragment key={index}>
        <span className="split-word"><span style={{ '--word-delay': `${Math.min(index, 12) * step}ms` } as CSSProperties}>{word}</span></span>
        {index < words.length - 1 ? ' ' : ''}
      </Fragment>)}
    </span>
  </>;
}
