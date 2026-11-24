# ALIA · App del vendedor (panel en el teléfono) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Para la terminal de Alia:** este plan se escribió desde la terminal de Motorcito leyendo `portal-casas` en solo lectura (rama `alia/T-5072_traduccion-al-guardar`, `06e9e4f6`, 23-nov-2026). Cópialo a `docs/superpowers/plans/2026-11-23-app-vendedor.md` del repo y confirma rutas y líneas contra el código antes de cada tarea: **el código manda**.

**Goal:** que quien enseña las casas pueda, desde el teléfono y delante del cliente, ver qué casa está libre en unas fechas, enseñarla, cotizar el precio exacto, mandar la cotización por WhatsApp y apartar las fechas, con el panel instalable como app (Android) y usable como web en iPhone.

**Architecture:** tres pantallas nuevas bajo `/[locale]/panel/vender`, construidas sobre la lógica que ya existe (`quoteStay`, el filtro de disponibilidad de `/casas`, `managedProperties`). La única lógica nueva vive en `lib/` con tests offline. Después, PWA (manifest + service worker que **no** cachea datos) y un APK de Android que es una **TWA** (Trusted Web Activity) apuntando a la PWA publicada. En iPhone se usa la PWA desde Safari.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind 4, Auth.js 5, Drizzle + Neon, next-intl (es/en/fr), Resend; tests `scripts/test-*.cjs` con el arnés `scripts/test-property-access.cjs` (SQLite en memoria); Bubblewrap para la TWA.

**Spec:** `~\Documents\alia-panel-movil-T-5198-2026-11-23.md` (§4b vendedor, §4c Rutinal) + PDF `~\Documents\ALIA-vendedor-telefono-T-5198-2026-11-23.pdf` + diseño https://claude.ai/artifact/PYhE1x1hZnJuQ4han2ueGt + respuestas de Gabriel (abajo).

## Decisiones de Gabriel (23-nov-2026, vía Emmanuel)

| # | Pregunta | Respuesta | Cómo se aplica |
|---|---|---|---|
| 1 | ¿Quién es el vendedor? | Los perfiles que ya existen | Sin rol nuevo. Entra quien hoy entra al panel (`requirePropertyManager`: `ADMIN` todas las casas, `COLLABORATOR` las suyas vía `managedProperties`) |
| 2 | ¿Se le muestra su comisión? | Se muestra todo igual que hoy; los perfiles que solo ven comisiones se usan como están | La cotización muestra la comisión **con la misma regla de visibilidad que ya usa el panel de reservas**; el interruptor «Modo cliente» la oculta en pantalla |
| 3 | ¿Precio de limpieza? | Fijo, más adelante o según la publicación | Campo opcional **por casa** (`cleaningPrice`, nulo = «por confirmar») |
| 4 | ¿Apartar crea consulta o bloquea? | Todo | Apartar = **crea la consulta Y bloquea el calendario**, en una sola operación atómica, con forma de liberarlo |
| 5 | ¿Android o iPhone? | Android como su app (Rutinal); iPhone como visor web | APK Android (TWA) + PWA en Safari para iPhone |
| 6 | ¿Contador? | Con los roles que tenemos | Sin rol nuevo; no hay fase de contador |
| — | Proceso | «Adelante con crear la app; ya funcionando, la audita» | Gabriel audita al final (Task 10) |

## Global Constraints

- **Cada tarea de abajo es una tarea en Motorcyto** (`alia-portal: …`) con las horas que estime Emmanuel, y su rama nace `alia/T-<folio>_<slug>`. Se mergea sola.
- `DATABASE_URL` de desarrollo = rama Neon **Respaldo**, nunca producción (`README.md`).
- Textos en **es/en/fr** (next-intl), como el resto del panel.
- Fechas civiles `YYYY-MM-DD`; una estancia ocupa **`[startDate, endDate)`**: la noche de salida no ocupa ni se cobra (regla de `stay-quote.ts` y de `CONTEXTO.md`).
- IVA **16 % sobre la renta** (`suggestedTaxes`, `booking-breakdown.ts`), igual que hoy.
- Permisos **en el servidor**: toda lectura y escritura pasa por `requirePropertyManager()` + `managedProperties(manager)`; ocultar un botón no es seguridad.
- La comisión y el `cleaningWhatsapp` **nunca** salen en el texto de WhatsApp ni en el modo cliente.
- El service worker **no** cachea `/panel/**` ni `/api/**`: un precio o una disponibilidad vieja es peor que «sin conexión».
- La llave de firma del APK **nunca** se versiona (lección de Rutinal): va en secretos de GitHub Actions.
- Verificación de cada tarea: su `scripts/test-*.cjs` + `pnpm --filter @portal/web exec tsc --noEmit --incremental false` + `pnpm lint` sin errores nuevos.

## Review Focus

1. **Salida el mismo día que otra llegada:** la casa debe salir **libre**. Hoy `/casas` compara `occupied."startDate" <= end` y la marca ocupada; la búsqueda del vendedor usa `< end` (Task 1 lo fija con un test, y reporta lo de `/casas` como hallazgo aparte).
2. **Una noche sin precio** (sin tarifa base ni temporada): el total es «Sin precio», nunca `$0` (`quoteStay` devuelve `total: null`; Tasks 1 y 3).
3. **Dos vendedores apartan la misma casa a la vez:** solo uno gana, el otro recibe «ya no está libre» (Task 6, candado por casa).
4. **Un `COLLABORATOR` abre por URL una casa ajena** (`/panel/vender/<id-ajeno>`, cotizar o apartar): 404, sin filtrar datos (Tasks 4-6).
5. **El texto de WhatsApp y el modo cliente** jamás incluyen comisión ni WhatsApp de limpieza, aunque el rol los vea (Task 5).

---

## Mapa de archivos

| Archivo | Responsabilidad | Task |
|---|---|---|
| `apps/web/src/lib/vendor-availability.ts` (nuevo) | Casas gestionadas libres en `[start,end)` + total cotizado | 1 |
| `apps/web/src/lib/vendor-quote.ts` (nuevo) | Desglose de una estancia: noches por tipo, renta, limpieza, IVA, total, comisión | 3 |
| `apps/web/src/lib/vendor-share.ts` (nuevo) | Texto de WhatsApp de la cotización (puro) | 5 |
| `apps/web/src/lib/vendor-hold.ts` (nuevo) | Apartar (bloqueo + consulta, atómico) y liberar | 6 |
| `apps/web/src/lib/inquiry-notice.ts` (nuevo) | Correo al admin y al dueño cuando entra una consulta | 7 |
| `packages/db/src/schema.ts` | `Property.cleaningPrice`, `BlockDate.messageId` | 2, 6 |
| `scripts/sql/property-cleaning-price.sql`, `scripts/sql/blockdate-hold.sql` (nuevos) | Migraciones manuales, con rollback comentado | 2, 6 |
| `apps/web/src/app/[locale]/panel/vender/**` (nuevo) | Las tres pantallas | 3, 4, 5 |
| `apps/web/src/app/[locale]/panel/layout.tsx` | Acceso «Vender» + barra inferior en móvil | 3 |
| `apps/web/src/app/manifest.ts`, `apps/web/public/sw.js`, iconos (nuevos) | PWA | 8 |
| `android/twa-manifest.json`, `.github/workflows/build-android.yml`, ruta `/.well-known/assetlinks.json` (nuevos) | APK TWA | 9 |
| `scripts/test-vendor-*.cjs` (nuevos) | Tests offline por tarea | todas |

---

### Task 1: Disponibilidad para el vendedor

**Files:**
- Create: `apps/web/src/lib/vendor-availability.ts`
- Test: `scripts/test-vendor-availability.cjs`

**Interfaces:**
- Consumes: `PropertyManager`, `managedProperties` (`lib/property-access.ts`); `quoteStay`, `StayPricing` (`lib/stay-quote.ts`); `propertySearch` (`lib/property-search.ts`) para validar filtros.
- Produces: `availableForVendor(filters: { start: string; end: string; guests?: number; state?: string; destinationCity?: string }, manager: PropertyManager): Promise<VendorCard[]>` con `VendorCard = { id: string; slug: string; title: string; bedrooms: number; bathrooms: number; maxGuests: number; published: boolean; cover: string | null; nights: number; total: number | null }`.

- [ ] **Step 1: Escribir el test que falla** — `scripts/test-vendor-availability.cjs`, con el arnés de `test-property-access.cjs` y casas sembradas en SQLite:
  - `salida el mismo día que otra llegada → libre`: reserva `2026-12-22..2026-12-25`, búsqueda `2026-12-18..2026-12-22` → la casa aparece.
  - `traslape de una noche → ocupada`: reserva `2026-12-21..2026-12-23` → no aparece; igual con un `BlockDate`.
  - `COLLABORATOR solo ve las suyas`; `ADMIN ve todas, incluida una no publicada con published=false`.
  - `rentalType 'anual' no aparece en búsqueda por noches`.
  - `huéspedes > maxGuests → no aparece`.
  - `noche sin precio → total null`; con base `weekday 1000 / weekend 1500` y `2026-12-18..2026-12-22` (vie, sáb, dom, lun) → `nights 4`, `total 5000`.
- [ ] **Step 2: Correr y ver que falla** — `node scripts/test-vendor-availability.cjs` → falla porque el módulo no existe.
- [ ] **Step 3: Implementar `availableForVendor`** — una consulta como la de `casas/page.tsx:35-66` pero con `managedProperties(manager)` en lugar de `published = true`, traslape **`occupied."startDate" < ${end}::date and occupied."endDate" > ${start}::date`** contra `Booking` y `BlockDate`, una foto de portada, y temporadas de las casas resultantes en **una** consulta (`inArray(seasonRates.propertyId, ids)`) para llamar a `quoteStay` por casa sin N+1.
- [ ] **Step 4: Correr y ver que pasa** — `node scripts/test-vendor-availability.cjs` → todo ✔.
- [ ] **Step 5: Commit** — `git add apps/web/src/lib/vendor-availability.ts scripts/test-vendor-availability.cjs` · `T-<folio> Vender: disponibilidad [start,end) por casas gestionadas`.
- [ ] **Step 6: Reportar** en la tarea y a Gabriel el `<=` de `/casas` (Review Focus 1). No se arregla aquí.

### Task 2: Precio de limpieza por casa

**Files:**
- Create: `scripts/sql/property-cleaning-price.sql`
- Modify: `packages/db/src/schema.ts` (tabla `properties`), el formulario de la casa en el panel (`qa-property-form.cjs` dice cuál), `lib/booking-quote.ts:20-23`, mensajes es/en/fr
- Test: `scripts/test-vendor-cleaning.cjs`

**Interfaces:**
- Produces: columna `properties.cleaningPrice: integer | null` (MXN, `>= 0`); `initialBreakdown(...)` devuelve además `cleaningCost: string | null` = `cleaningPrice` de la casa.

- [ ] **Step 1: Test que falla** — `initialBreakdown` con `cleaningPrice 800` → `cleaningCost '800.00'` y el IVA sigue siendo 16 % **solo sobre la renta**; con `null` → `cleaningCost null`; el formulario rechaza `-1` y acepta vacío.
- [ ] **Step 2: Ver que falla** — `node scripts/test-vendor-cleaning.cjs`.
- [ ] **Step 3: Migración** — `alter table "Property" add column "cleaningPrice" integer check ("cleaningPrice" is null or "cleaningPrice" >= 0);` con su rollback comentado, siguiendo el estilo de `scripts/sql/user-publication-permission.sql`. Campo en `schema.ts`, input opcional «Limpieza (MXN)» en el formulario y `initialBreakdown` lo usa.
- [ ] **Step 4: Ver que pasa** + `test-booking-breakdown.cjs` y `test-property-form`/`qa-property-form.cjs` siguen en verde.
- [ ] **Step 5: Aplicar en Respaldo**; en producción **lo aplica Gabriel** antes del merge. Commit con los archivos enumerados.

### Task 3: Pantalla 1 · ¿Qué está libre? + navegación móvil

**Files:**
- Create: `apps/web/src/app/[locale]/panel/vender/page.tsx`, `apps/web/src/components/panel/vendor/SearchForm.tsx`, `.../VendorCard.tsx`
- Modify: `apps/web/src/app/[locale]/panel/layout.tsx` (enlace «Vender» + barra inferior `md:hidden` con Vender · Calendario · Consultas · Más), mensajes es/en/fr
- Test: `scripts/test-vendor-page.cjs`

**Interfaces:**
- Consumes: `availableForVendor` (Task 1), `panelManager(locale)` (`lib/panel-server.ts`).
- Produces: URL `/[locale]/panel/vender?start=&end=&guests=&state=&destinationCity=`; cada tarjeta enlaza a `/[locale]/panel/vender/<id>?start=&end=&guests=`.

- [ ] **Step 1: Test que falla** — render offline de la página: sin sesión → redirect a `/{locale}` (como el resto del panel); con filtros válidos → «N casas libres» y una tarjeta por casa con su total formateado MXN; `total null` → «Sin precio»; fechas inválidas o pasadas (hoy en CDMX, `inquiryToday()`) → aviso y cero tarjetas.
- [ ] **Step 2: Ver que falla.**
- [ ] **Step 3: Implementar** según el diseño (artboard 1): formulario arriba (llegada, salida, huéspedes con − / +, destino), tarjetas con portada, recámaras · baños · cupo, chip «Libre» y total. Botones ≥ 44 px. La barra inferior reemplaza la fila de enlaces solo por debajo de `md`; en escritorio el panel no cambia.
- [ ] **Step 4: Ver que pasa** + capturas a 390 px en claro y oscuro (el panel usa `dark:`), adjuntas a la tarea.
- [ ] **Step 5: Commit.**

### Task 4: Pantalla 2 · La casa, para enseñarla

**Files:**
- Create: `apps/web/src/app/[locale]/panel/vender/[id]/page.tsx`, `apps/web/src/components/panel/vendor/MonthAvailability.tsx`
- Test: `scripts/test-vendor-property.cjs`

**Interfaces:**
- Consumes: `panelProperty(id, locale)` (`lib/panel-server.ts:20`, ya devuelve 404 si no es gestionada), `propertyBlocks`, reservas de la casa, `seasonRates`, `media`.
- Produces: `monthCells(year: number, month: number, occupied: { start: string; end: string }[], selected?: { start: string; end: string }): { day: number | null; state: 'free' | 'occupied' | 'selected' | 'checkout' }[]` (pura, exportada para el test).

- [ ] **Step 1: Test que falla** — `monthCells(2026, 12, [{start:'2026-12-05',end:'2026-12-09'}], {start:'2026-12-18',end:'2026-12-22'})`: el 1-dic es martes (primera celda vacía con semana lunes-primero), días 5-8 `occupied`, el 9 `free`, 18-21 `selected`, el 22 `checkout`. Y un `COLLABORATOR` con un id ajeno → 404.
- [ ] **Step 2: Ver que falla.**
- [ ] **Step 3: Implementar** según el artboard 2: galería deslizable (reusar `PropertyGallery`), chips de datos, calendario de un mes con lo ocupado **tachado** (no solo color), leyenda, tarifas base y aviso de la temporada que toque esas fechas. Botón «Cotizar <fechas>» → Task 5. Compartir ficha = `navigator.share` con el enlace **público** de la casa si está publicada.
- [ ] **Step 4: Ver que pasa** + capturas 390 px.
- [ ] **Step 5: Commit.**

### Task 5: Pantalla 3 · Cotización, modo cliente y WhatsApp

**Files:**
- Create: `apps/web/src/lib/vendor-quote.ts`, `apps/web/src/lib/vendor-share.ts`, `apps/web/src/app/[locale]/panel/vender/[id]/cotizar/page.tsx`, `apps/web/src/components/panel/vendor/ClientModeToggle.tsx`
- Test: `scripts/test-vendor-quote.cjs`

**Interfaces:**
- Consumes: `quoteStay`, `suggestedTaxes`, `cleaningPrice` (Task 2), la regla de visibilidad de comisión que ya usa `/panel/reservas` (localizarla en `booking-breakdown.ts`/`booking-details.ts`; **no** inventar otra).
- Produces:
  - `vendorQuote(propertyId: string, start: string, end: string, manager: PropertyManager): Promise<VendorQuote | null>` con `VendorQuote = { nights: number; weekdayNights: number; weekendNights: number; lines: { label: string; nights: number; price: number }[]; rent: number | null; cleaning: number | null; taxes: number | null; total: number | null; commission: { percent: number; amount: number } | null }`.
  - `quoteWhatsappText(q: VendorQuote, property: { title: string; publicUrl: string | null }, dates: { start: string; end: string }, locale: 'es' | 'en' | 'fr'): string`.

- [ ] **Step 1: Test que falla:**
  - `2026-12-18..2026-12-22`, base 1000/1500, `cleaningPrice 800` → `weekdayNights 2`, `weekendNights 2`, `rent 5000`, `taxes 800`, `cleaning 800`, `total 6600`.
  - Una temporada de prioridad mayor que cubre el 19-20 → esas noches usan la tarifa de temporada, y aparece como línea aparte.
  - `cleaningPrice null` → `cleaning null`, `total` = renta + IVA, y la pantalla dice «Limpieza: por confirmar».
  - Noche sin precio → `rent null`, `total null`.
  - `quoteWhatsappText` **no** contiene el monto ni la palabra de comisión en es/en/fr, ni el `cleaningWhatsapp`; sí contiene casa, fechas, noches y total (o «Sin precio»).
  - `commission` es `null` para un rol que hoy no la ve en reservas.
  - `vendorQuote` de un `COLLABORATOR` sobre una casa ajena → `null`, y la página `/cotizar` responde 404.
- [ ] **Step 2: Ver que falla.**
- [ ] **Step 3: Implementar** según el artboard 3. Modo cliente = estado del cliente (no URL ni cookie) que oculta el bloque «Solo para ti»; arranca **apagado** («se muestra todo igual»). WhatsApp = `https://wa.me/?text=` + `encodeURIComponent(quoteWhatsappText(...))`.
- [ ] **Step 4: Ver que pasa** + captura con modo cliente encendido y apagado.
- [ ] **Step 5: Commit.**

### Task 6: Apartar = consulta + bloqueo (atómico) y liberar

**Files:**
- Create: `apps/web/src/lib/vendor-hold.ts`, `apps/web/src/app/api/panel/vender/apartar/route.ts`, `apps/web/src/app/api/panel/vender/liberar/route.ts`, `scripts/sql/blockdate-hold.sql`
- Modify: `packages/db/src/schema.ts` (`blockDates.messageId`), calendario del panel (botón «Liberar» en bloques con `messageId`)
- Test: `scripts/test-vendor-hold.cjs`

**Interfaces:**
- Consumes: `managedProperties`, `consumeRateLimit` (`lib/rate-limit.ts`), `sendInquiryNotice` (Task 7, se conecta allí).
- Produces: `holdDates(input: { propertyId: string; start: string; end: string; guests: number; name: string; phone?: string; email?: string; note?: string }, manager: PropertyManager): Promise<{ messageId: string; blockId: string }>` (lanza `PanelValidationError('notAvailable')` si ya no está libre) y `releaseHold(blockId: string, manager: PropertyManager): Promise<void>`.

- [ ] **Step 1: Test que falla:**
  - apartar libre → crea **un** `Message` (con fechas, huéspedes, `userId` del vendedor) y **un** `BlockDate` con `messageId`;
  - apartar sobre un `Booking` o `BlockDate` que traslapa → `notAvailable` y **no** queda ni consulta ni bloqueo;
  - dos `holdDates` simultáneos del mismo rango (`Promise.all`) → exactamente uno gana;
  - `COLLABORATOR` sobre casa ajena → 404 sin escribir;
  - `releaseHold` borra el bloque y deja la consulta; sobre un bloque sin `messageId` (bloqueo manual) → 404.
- [ ] **Step 2: Ver que falla.**
- [ ] **Step 3: Implementar** — migración `alter table "BlockDate" add column "messageId" text;` (sin FK: las consultas se borran, como `referralMessageId`). `holdDates` es **una sola sentencia** con CTE que primero toma `pg_advisory_xact_lock(hashtext(propertyId))`, comprueba traslape `[start,end)` contra `Booking` y `BlockDate`, inserta el `Message` y el `BlockDate` y devuelve los dos ids. Sin filas → `notAvailable`. Verificar que la conexión de `@portal/db` (Neon HTTP) ejecuta la sentencia en una transacción implícita; si no, usar el cliente con transacción.
- [ ] **Step 4: Ver que pasa** + `test-inquiry.cjs` y `test-calendar-interaction.cjs` siguen en verde.
- [ ] **Step 5: Aplicar migración en Respaldo**; en prod la aplica Gabriel. Commit.

### Task 7: Aviso por correo al entrar una consulta

**Files:**
- Create: `apps/web/src/lib/inquiry-notice.ts`
- Modify: `apps/web/src/app/api/messages/route.ts` (después del insert), `lib/vendor-hold.ts`
- Test: `scripts/test-inquiry-notice.cjs` (con `globalThis.__testMailer`, como `test-account-emails.cjs`)

**Interfaces:**
- Produces: `sendInquiryNotice(messageId: string, origin: 'public' | 'vendor'): Promise<{ sent: string[] }>`: a los `ADMIN` activos y al dueño de la casa, sin duplicar si son la misma persona.

- [ ] **Step 1: Test que falla** — consulta pública → correo a admins + dueño con casa, fechas y enlace a `/panel/consultas`; apartado → asunto «Apartado por <vendedor>»; si Resend falla, **la consulta igual se guarda** y se registra el error (mismo patrón `try` que `booking-emails.ts:122-126`); nombre del huésped escapado.
- [ ] **Step 2: Ver que falla.** **Step 3: Implementar.** **Step 4: Ver que pasa** + `test-inquiry.cjs`. **Step 5: Commit.**

### Task 8: PWA instalable

**Files:**
- Create: `apps/web/src/app/manifest.ts`, `apps/web/public/sw.js`, `apps/web/public/icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (del emblema `public/brand/alia-spiral-emblem.png`), `apps/web/public/offline.html`, `apps/web/src/components/panel/RegisterServiceWorker.tsx`
- Modify: `apps/web/src/app/[locale]/panel/layout.tsx` (registrar el SW), `apps/web/src/proxy.ts` y `apps/web/vercel.json` (dejar pasar `/manifest.webmanifest`, `/sw.js`, `/offline.html` sin sesión; CSP `worker-src 'self'`, `manifest-src 'self'`)
- Test: `scripts/test-pwa.cjs`

**Interfaces:**
- Produces: manifest con `id: '/es/panel/vender'`, `start_url: '/es/panel/vender'`, `scope: '/'`, `display: 'standalone'`, iconos `any` + `maskable`; colores de la paleta `paper` del panel.

- [ ] **Step 1: Test que falla** — el manifest tiene esos campos e iconos 192/512 que existen en `public/`; `sw.js` (leído como texto y ejecutado con un `fetch` simulado): una petición a `/es/panel/...` o `/api/...` **nunca** se responde desde caché, sin red → `offline.html`; los estáticos (`/_next/static/**`, iconos) sí se cachean; el nombre del caché lleva versión.
- [ ] **Step 2: Ver que falla.** **Step 3: Implementar** (patrón de Rutinal `assets/web/sw.js` y de Motorcito `src/app/manifest.ts`, adaptado: red-solo para datos). **Step 4: Ver que pasa** + instalación probada en Chrome Android y en Safari iPhone («Compartir → Agregar a inicio»), con capturas. **Step 5: Commit.**

### Task 9: APK Android (TWA) e instrucciones para iPhone

**Files:**
- Create: `android/twa-manifest.json` (Bubblewrap), `.github/workflows/build-android.yml`, `apps/web/src/app/.well-known/assetlinks.json/route.ts`, `docs/APP-MOVIL.md`
- Test: `scripts/test-assetlinks.cjs`

**Interfaces:**
- Consumes: la PWA publicada (Task 8) en el dominio de producción.
- Produces: APK firmado como artefacto de Actions y release; `assetlinks.json` con `package_name` y el SHA-256 del certificado **leído de una variable de entorno**, no escrito en el código.

- [ ] **Step 1: Test que falla** — `/.well-known/assetlinks.json` responde JSON con `relation: ['delegate_permission/common.handle_all_urls']`, el paquete y la huella de `process.env.ANDROID_CERT_SHA256`; sin la variable → 404 (no publica una huella vacía).
- [ ] **Step 2: Ver que falla.** **Step 3: Implementar** — Bubblewrap apuntando a `/es/panel/vender`; workflow que compila en `workflow_dispatch` y en tags `app-v*`, firmando con `ANDROID_KEYSTORE_BASE64` + contraseñas en **secretos** (los crea Gabriel). `docs/APP-MOVIL.md`: cómo instalar en Android, cómo usar en iPhone desde Safari, y límites (en iPhone sin la app instalada no hay avisos).
- [ ] **Step 4: Ver que pasa** + APK instalado en un Android real abre el panel **sin barra de navegador** (señal de que `assetlinks` validó). **Step 5: Commit.**

### Task 10: Verificación de punta a punta y auditoría de Gabriel

- [ ] **Step 1:** Todos los `scripts/test-*.cjs` en verde (`for f in scripts/test-*.cjs; do node "$f" || exit 1; done`), `tsc` limpio, `pnpm lint` sin errores nuevos.
- [ ] **Step 2:** Recorrido en teléfono contra **Respaldo**, como `ADMIN` y como `COLLABORATOR`: buscar → ver casa → cotizar (modo cliente encendido y apagado) → WhatsApp → apartar → ver el bloqueo en el calendario y el correo → liberar. Capturas de cada paso.
- [ ] **Step 3:** Los cinco puntos del Review Focus, uno por uno, con su evidencia.
- [ ] **Step 4:** Entregar a Gabriel para su auditoría: PR(s), capturas, lo que **no** se probó y las dos migraciones que él aplica en prod (`property-cleaning-price.sql`, `blockdate-hold.sql`) **antes** del merge.

---

## Hallazgos fuera de alcance (reportar, no arreglar aquí)

- 🟠 `/casas` marca ocupada una casa cuando otra reserva empieza el día de salida (`casas/page.tsx`, comparación `<=`). La búsqueda pública esconde casas que sí están libres.
- 🟠 Rutinal (repo de Gabriel): el `WebView` expone el puente `Android` a páginas externas (`MainActivity.java`, `shouldOverrideUrlLoading` → `false`). Detalle en §4c del documento de T-5198.
