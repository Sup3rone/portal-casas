'use client';

import { useRef, useState, type ComponentProps } from 'react';
import { Link } from '@/i18n/navigation';

// Touch previews first; the same native link navigates on the next tap.
export default function HomeFeaturedLink(props: ComponentProps<typeof Link>) {
  const [revealed, setRevealed] = useState(false);
  const pointerType = useRef('');
  return <Link {...props} data-revealed={revealed || undefined}
    onPointerDown={event => { pointerType.current = event.pointerType; }}
    onBlur={() => setRevealed(false)}
    onClick={event => {
      if (event.detail > 0 && pointerType.current === 'touch' && !revealed) {
        event.preventDefault();
        setRevealed(true);
      }
    }} />;
}
