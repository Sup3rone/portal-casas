import type { MetadataRoute } from 'next';

/**
 * T-5213: manifest de la app instalada (PWA en Android/iPhone y base del APK TWA, Task 9). Next lo sirve en
 * `/manifest.webmanifest` y pone el <link rel="manifest"> solo; lleva punto, así que `proxy.ts` no lo toca.
 * Entra por `/es/app` (T-5210): marca este navegador como «la app» y abre el modo que toque (vendedor o sitio).
 * Colores: paleta `paper` del panel (`globals.css`).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/es/app',
    name: 'ALIA for Rent',
    short_name: 'ALIA',
    description: 'Casas libres, cotización y apartado desde el teléfono',
    start_url: '/es/app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F4F1EC',
    theme_color: '#F4F1EC',
    lang: 'es-MX',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
