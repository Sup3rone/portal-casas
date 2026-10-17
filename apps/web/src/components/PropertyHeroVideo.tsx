'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';

export default function PropertyHeroVideo({ src, poster }: { src: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false;
    function update() {
      video!.removeAttribute('data-playing');
      if (motion.matches) video!.pause();
      else void video!.play().catch(() => { if (!disposed) video!.removeAttribute('data-playing'); });
    }
    motion.addEventListener('change', update); update();
    return () => { disposed = true; motion.removeEventListener('change', update); video.pause(); };
  }, [src]);
  return <div className="property-hero-media" aria-hidden="true">
    {poster && <Image src={poster} alt="" fill unoptimized priority sizes="100vw" className="object-cover" />}
    <video ref={ref} autoPlay loop muted playsInline preload="metadata" poster={poster}
      onPlaying={event => event.currentTarget.setAttribute('data-playing', '')}
      onError={event => event.currentTarget.removeAttribute('data-playing')}>
      <source src={src} media="(prefers-reduced-motion: no-preference)" />
    </video>
    <div className="property-hero-scrim" />
  </div>;
}
