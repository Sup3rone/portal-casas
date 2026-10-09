'use client';
import { useEffect, useRef, type ReactNode } from 'react';

export default function DetailFooterFlow({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    function update() {
      const rect = element!.getBoundingClientRect();
      element!.setAttribute('data-visible', String(rect.top <= window.innerHeight && rect.bottom >= 0));
    }
    update();
    if (typeof window.IntersectionObserver === 'function') {
      const observer = new IntersectionObserver(update, { threshold: 0 });
      observer.observe(element);
      return () => observer.disconnect();
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);
  return <div ref={root} className="detail-footer-flow">{children}</div>;
}
