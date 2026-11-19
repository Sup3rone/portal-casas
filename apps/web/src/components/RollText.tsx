// T-4944: texto de botón cuyas letras «ruedan» al pasar el ratón o con foco de teclado: cada letra sube
// y la sustituye su copia (::after con data-char, globals.css). El texto real va en sr-only.
import type { CSSProperties } from 'react';

export default function RollText({ text }: { text: string }) {
  return <span className="roll-text">
    <span className="sr-only">{text}</span>
    <span aria-hidden="true" className="roll-chars">
      {Array.from(text).map((char, index) => <span key={index} className="roll-char" data-char={char}
        style={{ '--char-delay': `${Math.min(index, 24) * 18}ms` } as CSSProperties}>{char}</span>)}
    </span>
  </span>;
}
