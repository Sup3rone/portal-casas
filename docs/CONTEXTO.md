# Contexto — Portal Casas

- Monorepo pnpm: aplicación en `apps/web`, paquetes compartidos en `packages`.
- Web: Next.js 16 (App Router), React 19, TypeScript y Tailwind CSS 4.
- Internacionalización: next-intl 4, rutas `/es`, `/en` y `/fr`; español por defecto.
- Configuración en `apps/web/src/i18n/{routing,request,navigation}`; `src/proxy.ts` combina Auth.js con el middleware de next-intl.
- El layout `src/app/[locale]/layout.tsx` incluye `NextIntlClientProvider`, navegación y pie de página.
- Diccionarios en `apps/web/messages/{es,en,fr}.json`. Los componentes de servidor usan `getTranslations`; los de cliente, `useTranslations`.
- La home usa el namespace `home` y conserva el locale de la ruta al enviar la búsqueda a `/{locale}/casas`.
- Autenticación: Auth.js v5; datos: Neon PostgreSQL y Drizzle; correo: Resend.
- Desarrollo desde la raíz: `pnpm dev`. Consultar `docs/PROGRESO.md` para el estado funcional y `apps/web/AGENTS.md` para instrucciones de Next.js.
