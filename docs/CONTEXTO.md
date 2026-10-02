# Contexto — Portal Casas

- Monorepo pnpm: aplicación en `apps/web`, paquetes compartidos en `packages`.
- Web: Next.js 16 (App Router), React 19, TypeScript y Tailwind CSS 4.
- Internacionalización: next-intl 4, rutas `/es`, `/en` y `/fr`; español por defecto.
- Configuración en `apps/web/src/i18n/{routing,request,navigation}`; `src/proxy.ts` combina Auth.js con el middleware de next-intl.
- El layout `src/app/[locale]/layout.tsx` incluye `NextIntlClientProvider`, navegación y pie de página.
- Diccionarios en `apps/web/messages/{es,en,fr}.json`. Los componentes de servidor usan `getTranslations`; los de cliente, `useTranslations`.
- La home usa el namespace `home` y conserva el locale de la ruta al enviar la búsqueda a `/{locale}/casas`.
- En el detalle, `ReservationDatesProvider` comparte llegada/salida entre `AvailabilityCalendar` y `MessageForm` en ambos sentidos. Un primer clic inicia la llegada; un segundo posterior completa la salida; uno anterior o igual reinicia, y un clic tras completar el rango inicia otra selección.
- Las reservas ocupan `[startDate, endDate)` (la salida no ocupa ni se cobra). La selección resalta también la salida, pero no permite seleccionar días ocupados o pasados, ni siquiera como salida. Los rangos que cruzan reservas se rechazan conservando la llegada sin salida; las fechas manuales inválidas no se resaltan y bloquean el envío. La cotización existente se recalcula con las fechas compartidas.
- Autenticación: Auth.js v5; datos: Neon PostgreSQL y Drizzle; correo: Resend.
- Desarrollo desde la raíz: `pnpm dev`. Consultar `docs/PROGRESO.md` para el estado funcional y `apps/web/AGENTS.md` para instrucciones de Next.js.
- Carga de navegación: `loading.tsx` en `[locale]`, `casas` y `casas/[slug]` usa el skeleton compartido `PageLoading`. Next.js muestra el fallback mientras carga la ruta, manteniendo el layout interactivo. La entrada dura 200 ms, sin demoras artificiales, y respeta movimiento reducido. Las rutas ya precargadas pueden abrirse sin mostrar el skeleton; el fallback de `[locale]` también cubre sus otras rutas sin loading propio.
