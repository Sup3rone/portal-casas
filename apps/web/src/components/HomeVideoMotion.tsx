'use client';
import { useEffect } from 'react';

// Controlar el video existente, sin reemplazarlo ni duplicarlo.
export default function HomeVideoMotion() {
  useEffect(() => {
    const video = document.getElementById('home-background-video') as HTMLVideoElement | null;
    if (!video) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    function update() {
      if (motion.matches) video!.pause();
      else {
        // Si la fuente fue descartada por media=reduce, volver a seleccionarla.
        if (video!.networkState === 3) video!.load();
        void video!.play().catch(() => {});
      }
    }
    motion.addEventListener('change', update);
    update();
    return () => { motion.removeEventListener('change', update); video.pause(); };
  }, []);
  return null;
}
