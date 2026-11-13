// T-4835: reglas de la animación de la primera carga, compartidas por layout.tsx (servidor) y SiteIntro (cliente).
// Viven fuera del archivo 'use client' porque el servidor recibiría referencias de cliente en lugar de strings.
export const SITE_INTRO_KEY = 'alia-intro';
export const SITE_INTRO_SEEN_CLASS = 'alia-intro-seen';
/** Va en el HTML antes de la animación: si ya se vio en esta pestaña, se oculta antes de pintar. */
export const SITE_INTRO_SKIP = `try{if(sessionStorage.getItem('${SITE_INTRO_KEY}'))document.documentElement.classList.add('${SITE_INTRO_SEEN_CLASS}')}catch(e){}`;
/** Rutas públicas con papel: /, /es, /es/casas, /es/casas/<slug>. El panel, login y Mi cuenta no la muestran. */
export const SITE_INTRO_PATH = /^\/(?:(?:es|en|fr)(?:\/|$))?(?:casas(?:\/[^/]+)?\/?)?$/;
