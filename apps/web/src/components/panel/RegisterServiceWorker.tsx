'use client';
import { useEffect } from 'react';

/**
 * T-5213: registra /sw.js (alcance «/») al entrar al panel. Solo en producción: en desarrollo los chunks no llevan
 * hash y el caché serviría código viejo. Si el registro falla, el panel sigue igual (la PWA es un extra).
 */
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  }, []);
  return null;
}
