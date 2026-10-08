'use client';

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';

type Props = {
  delay?: number;
  distance?: number;
  as?: keyof HTMLElementTagNameMap;
  className?: string;
  children: ReactNode;
};

export default function Reveal({ delay = 0, distance = 48, as = 'div', className = '', children }: Props) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as ElementType;
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motion.matches || !('IntersectionObserver' in window)) { element.classList.add('reveal-visible'); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio > 0.15)) show();
    }, { threshold: [0.15, 0.16] });
    function show() {
      element!.classList.add('reveal-visible');
      observer.disconnect();
      motion.removeEventListener('change', motionChanged);
    }
    function motionChanged() { if (motion.matches) show(); }
    motion.addEventListener('change', motionChanged);
    observer.observe(element);
    return () => { observer.disconnect(); motion.removeEventListener('change', motionChanged); };
  }, [as]);

  return <Tag ref={ref} className={`reveal ${className}`.trim()}
    style={{ '--reveal-distance': `${distance}px`, '--reveal-delay': `${Math.max(0, delay)}ms` } as CSSProperties}>
    {children}
  </Tag>;
}
