'use client';
import Image, { type ImageProps } from 'next/image';
import { useEffect, useRef, useState } from 'react';

const transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
export default function DeferredDetailImage({ src, alt, eager = false, ...props }: Omit<ImageProps, 'src' | 'loading' | 'preload' | 'priority'> & { src: string; eager?: boolean }) {
  const ref = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(eager);
  useEffect(() => {
    const image = ref.current;
    if (!image || eager) return;
    const load = () => setReady(true);
    image.addEventListener('detail-image-load', load);
    if (typeof IntersectionObserver === 'undefined') { load(); return () => image.removeEventListener('detail-image-load', load); }
    const section = image.closest('[data-editorial-slide], [data-editorial-flow], [data-detail-section]') || image;
    // Dos pantallas en ambas direcciones; ready nunca se revierte al salir.
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { load(); observer.disconnect(); }
    }, { rootMargin: `${window.innerHeight * 2}px 0px`, threshold: 0.35 });
    observer.observe(section);
    return () => { observer.disconnect(); image.removeEventListener('detail-image-load', load); };
  }, [src, eager]);
  return <Image {...props} alt={alt} ref={ref} src={ready ? src : transparentPixel} data-deferred-src={src}
    loading={ready ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} />;
}
