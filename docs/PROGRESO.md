# Progreso del Proyecto - Portal-Casas

## Cierre de auditoría 2026-10-13 — Todos los P1 completados

- SEO: metadata localizada es/en/fr, canonical, hreflang, OG/Twitter; og-default.jpg (1200×630,60.7KB) con fallback absoluto vía PUBLIC_SITE_URL; sitemap.xml solo propiedades publicadas, además de home/listado; robots.txt excluye panel; páginas auth noindex.
- Textos de prueba /fr: about_fr y narrativas de Del Canto ocultos. No se borraron de BD; al llenar contenido real desde el panel se muestra normalmente.
- Mapa: pointer-events activo; habilitado para interacción desde el primer toque. QA manual de gestos/zoom pendiente según registro previo.
- Performance imágenes: anticipación bidireccional de dos pantallas y próximas dos secciones (dentro del objetivo2–3), fondos visitados retenidos, primera imagen eager y dimensiones explícitas en cards. unoptimized se conserva hasta validar optimizer Vercel en producción.
- Rate limiting: lib/rate-limit.ts por IP, memoria por instancia documentada; login10/15min, registro5/h, recuperación3/h, consultas5/15min. HTTP429 + Retry-After + mensajes localizados en transporte nuevo; formularios conservan campos. Traducción mantiene su limitador. Sin JS las Server Actions siguen limitadas, con la limitación HTTP documentada.
- Diseño: vidrio centralizado en --glass-bg, --glass-text y --glass-blur. Decisión vigente al cierre: variante OSCURA; revertir a blanca mediante tokens. Nota de implementación: el CSS aún conserva la blanca35% de comparación solicitada antes; aplicar la oscura requiere una tarea posterior, no se cambia código aquí.
- Detalle: cinco lecturas relacionadas en Promise.all tras obtener propiedad; metadata/render conservados.
- Analytics: @vercel/analytics2.0.1 global; query_submitted y whatsapp_clicked instrumentados (Pro/Enterprise para reportarlos; Hobby solo tráfico básico). Pendiente Emma: activar Web Analytics en dashboard y deployment autorizado; si activa después, requiere siguiente deployment.
- Cierre de implementación P1; no equivale a deploy ni a aprobación del QA de producción. Validación de esta jornada: TypeScript limpio, ESLint0errores/6warnings heredados y38scripts offline pasan; se reejecutan los tests en este cierre documental.

## Deuda técnica abierta (P2)

1. UX panel: mensajes de error específicos y controles táctiles ≥44px.
2. Headers de seguridad y CSP compatible con Maps/Blob/video.
3. Migrar pnpm.overrides a pnpm-workspace.yaml.
4. Marcadores de conflicto en CONTEXTO.md: RESUELTOS en esta tarea; sale de deuda abierta, se conserva este punto para trazabilidad.
5. Fullpage del detalle: PAUSADO; estado vigente y riesgos registrados en DETALLE-SCROLL-SNAP.md, sin desactivar código existente.
6. Medir LCP/INP/CLS en producción cuando haya tráfico real.


## Web Analytics y conversiones — 13 Oct 2026

Única dependencia añadida: @vercel/analytics2.0.1 en apps/web/package.json y pnpm-lock.yaml (sin actualizaciones ajenas). SiteAnalytics.tsx monta Analytics de @vercel/analytics/next desde layout locale para pageviews/navegación. beforeSend elimina query/hash de las URLs para no enviar tokens de recuperación ni parámetros personales. No se añaden cookies ni banner; referencia de privacidad: https://vercel.com/docs/analytics/privacy-policy. No se envían nombres, emails, teléfonos, mensajes ni fechas del formulario en eventos.

Eventos ingleses definitivos: query_submitted {property:slug} solo tras respuesta exitosa de /api/messages; validación/rechazos400/429/500 no cuentan. whatsapp_clicked {property:slug} al activar el enlace wa.me del detalle, mide interés/clic y NO envío de mensaje ni reserva confirmada. Page.tsx solo pasa slug y sustituye el anchor por el mismo anchor cliente instrumentado: condiciones/URL/texto/clases intactos. Analytics no interrumpe consulta ni enlace si track falla. No se instrumentan WhatsApp global del footer ni otras interacciones.

Activación manual Emma: dashboard Vercel → Analytics/Web Analytics en sidebar → seleccionar proyecto portal-casas → Enable en encabezado. La habilitación añade rutas de intake tras el siguiente deployment: habilitar antes del deploy autorizado o hacer un nuevo deploy autorizado si se habilitó después. No se ejecuta deploy/activación ni se usan credenciales aquí. Eventos personalizados requieren Pro/Enterprise según https://vercel.com/docs/analytics/custom-events; Hobby no permite dar por disponible el dashboard de conversiones. No se cambia plan ni se autoriza gasto. Tráfico básico disponible por Web Analytics; revisar cuota del plan.

QA local: pnpm dev; home/es en navegador sin errores; script observado https://va.vercel-scripts.com/v1/script.debug.js con async=true y defer=true. Consola confirma development/debug y que no envía eventos al servidor. Defer evita bloqueo del parser; no equivale a una medición de LCP: comparar Performance en producción si se requiere asegurar ausencia de regresión. Prueba offline extendida de MessageForm: no track antes de confirmación ni en400/429/500; track solo slug tras201; clic WhatsApp y eliminación de token/query verificados.

QA producción pendiente tras deploy/Enable: abrir home/listado/detalles y comprobar visitas/URLs localizadas en dashboard. Enviar UNA consulta válida de prueba en propiedad acordada y activar WhatsApp; confirmar query_submitted y whatsapp_clicked con property=slug (sin campos personales). Network: intake de Vercel separado de /api/messages; rate-limit.ts solo limita endpoints/actions propios, no Analytics. SDKv2 puede usar rutas de intake aleatorias además de /_vercel/insights: no asumir una URL fija. La coexistencia está comprobada en código/test429; recepción real en Vercel y LCP quedan pendientes. Repetir en es/en/fr, móvil; no se han enviado consultas/correos de prueba reales en esta tarea.


## Lecturas paralelas del detalle — 13 Oct 2026

Antes, PropertyPage esperaba params → traducciones → readPublishedProperty(slug) → Media (order asc) → PropertySection → Booking (startDate asc) → propertyBlocks/BlockDate → SeasonRate. Ahora espera params y propiedad publicada primero (notFound si no existe), luego Promise.all para Media, PropertySection, Booking, BlockDate, SeasonRate y traducciones. No hay escrituras ni dependencia entre esas cinco lecturas: todas filtran por el mismo property.id. Composición editorial/advertencias y pricing se calculan después; bloqueos se agregan a reservas en el mismo orden anterior. Si una lectura falla, Promise.all rechaza y la página sigue fallando, sin catch silencioso.

Metadata intacta: readPublishedProperty sigue compartida mediante React.cache durante render; generateMetadata espera propiedad y después propertySeoPhoto (depende del id), sin cambios de consulta/selección OG. generateStaticParams intacta. Lecturas internas de componentes como Footer no se modifican. await params se conserva por la API de Next; no se añade ninguna espera para property.

Test-editorial-presentation extiende la capa de datos existente con40ms de latencia artificial por lectura y verifica5lecturas solapadas, además de su render previo con datos escasos/completos en es/en/fr. Medición informal OFFLINE:262ms para5lecturas secuenciales frente a57ms para PropertyPage paralela; incluye overhead local y datos SQLite de prueba, no representa TTFB/Neon/producción. No se ha conectado ni medido BD real. No hay console.time/log nuevo en la app.

QA real pendiente: pnpm dev; abrir una casa con pocos datos y otra completa; comprobar fotos/editoriales, mapa, fechas/formulario y view-source (title, canonical, OG idénticos). DevTools Network: registrar Waiting/TTFB del documento con caché desactivada y servidor caliente en varias visitas; comparar con el commit anterior usando el mismo entorno y propiedades, sin desplegar. No se promete una reducción concreta en producción: latencia y concurrencia de BD pueden variar.


### Variante blanca de comparación — 13 Oct 2026
- Únicamente valores del token del detalle: --glass-bg:rgba(255,255,255,0.35), --glass-text:#1a1a1a; --glass-blur sigue en10px. Sin cambios de reglas, bordes, tamaños, componentes ni otros tokens. Variante temporal para decisión visual de la clienta frente al oscuro anterior (negro60% y texto blanco); no se afirma contraste garantizado sobre todas las fotografías. Revisar con recarga del detalle, fotos claras/oscuras y ambos temas.

### Vidrio oscuro centralizado del detalle — 13 Oct 2026
- Solo colores CSS: globals.css define en .detail-snap-container --glass-bg:rgba(0,0,0,0.6), --glass-text:#fff, --glass-blur:10px; editoriales/fotos, advertencias, tarjetas del mosaico y reserva consumen esos tokens. EditorialPresentation.module.css elimina sus overrides blancos. Inputs oscuros, texto/placeholder claros, bordes/foco legibles y esquema nativo dark independiente del tema general; estados verde/rojo/selección del calendario conservados. Sin cambios de layout, fondos, componentes, animaciones ni negocio.
- Contraste teórico conservador blanco sobre negro60% compuesto sobre blanco:5.74:1. QA manual pendiente sobre fotos claras/oscuras, es/en/fr,375px, ambos temas, reduced-motion; escribir en inputs, revisar fechas y estados del calendario. No se afirma certificación WCAG de toda la página por este cálculo.
- Reversión centralizada: cambiar --glass-bg a rgba(255,255,255,0.25) recupera el fondo claro. Para recuperar también el texto negro y controles claros hay que cambiar --glass-text:#000, --glass-color-scheme:light y --glass-error:var(--color-red-800) en el MISMO bloque de tokens. Cambiar únicamente el fondo dejando texto blanco no garantiza legibilidad; no hace falta buscar reglas en varios archivos. La transparencia del vidrio blanco puede requerir revisión sobre fotos claras.
- Se actualizan dos expectativas de test-detail-scroll que exigían los colores anteriores; se conservan pruebas de estructura/funcionalidad.


## Limitador básico de flujos públicos — 13 Oct 2026

Validación offline: TypeScript web limpio; pnpm lint0errores/6warnings heredados; 38scripts test-*.cjs pasan. test-rate-limit cubre todos los umbrales, IP/flujo, expiración, idioma, Retry-After y endpoints públicos sin BD. QA con login/cookies/email reales y móvil pendiente de Emma.

lib/rate-limit.ts centraliza ventanas fijas por IP (primer valor x-forwarded-for): login10/15min, registro5/hora, recuperación3/hora, consultas5/15min. Sin servicios, dependencias ni migraciones. Map por instancia; limpieza de entradas expiradas cada minuto al recibir tráfico. Vercel puede distribuir peticiones entre funciones/instancias y reinicia memoria en despliegues: protección básica, NO cuota global garantizada. Si crece el sitio, evaluar almacenamiento compartido. Se confía en el header del proxy Vercel; fuera de él debe sanearlo el proxy y sin header se comparte el bucket unknown.

Acciones login/registro/recuperación comprueban el limitador antes de validar/leer/escribir/enviar. Con autorización expresa se añade api/public-auth/[flow] como transporte POST multipart con Origin de mismo origen obligatorio. Invoca las mismas actions y devuelve429 RATE_LIMITED con mensaje es/en/fr y Retry-After; redirecciones exitosas/errores existentes se devuelven al cliente sin cambiar lógica de negocio. AuthForm conserva campos escritos en429 y errores de red. Olvide-password reutiliza AuthForm con sus clases originales. Sin JS las actions siguen limitadas, pero el transporte nativo de Server Actions no puede emitir429/Retry-After ni presentar ese error igual: el contrato HTTP429 corresponde al transporte nuevo con JS.

API Auth.js limita solo POST callback/credentials, no lecturas de sesión; login admin antiguo también limita. Consultas /api/messages limita antes de validar/BD; MessageForm muestra el mensaje429 sin resetear sus campos. No hay correo WhatsApp interno separado en este flujo (wa.me es enlace externo). Traducción conserva translationAllowance por usuario: no se modifica ni duplica. Navegación/búsqueda/panel autenticado no se limitan.

Prueba local SIN BD: en PowerShell ejecutar 11 veces curl.exe -i -X POST http://localhost:3000/api/public-auth/login -H "Origin: http://localhost:3000" -H "x-forwarded-for: 192.0.2.88" -F "locale=fr" -F "email=" -F "password=". Los primeros devuelven redirect de credenciales inválidas; el11 devuelve429, Retry-After y mensaje francés. No usar credenciales reales para esta prueba. Repetir con register/recovery y campos vacíos: umbrales5/3; consultas POST JSON vacío umbral5. Para recuperar disponibilidad esperar la ventana real (15min/1h); test-rate-limit usa reloj simulado para verificar expiración sin esperas. En producción no se puede asumir que todas las llamadas lleguen a la misma instancia ni falsificar el header como prueba fiable.

QA manual pendiente: login/registro/recuperación normal y éxito con cookies; provocar429 y confirmar que los campos se conservan y mensaje es/en/fr; consulta válida única funciona como antes; móvil375px. No se ejecutan pruebas de usuarios/emails ni Neon desde esta tarea.


### Anticipación bidireccional de fondos — 13 Oct 2026
- Diagnóstico: DeferredDetailImage no revierte ready ni desmonta la imagen al salir del viewport; el Map del fundido ya retiene referencias fuertes a todos los fondos preparados durante la vida del detalle. No había descarte explícito de fondos visitados; el margen de una pantalla limitaba la preparación anticipada.
- DeferredDetailImage amplía rootMargin a dos alturas de viewport en ambos sentidos y threshold a 0.35. EditorialPresentation conserva la preparación inicial de dos fondos y prepara las próximas dos secciones al activar la actual. Los visitados permanecen montados/referenciados hasta desmontar el detalle; no cambia el fundido, eager inicial, SEO ni componentes interactivos.
- Test del fundido verifica anticipación de dos secciones y regreso sin nuevas decodificaciones; prueba de galería/SSR diferido pasa. QA manual pendiente: pnpm dev, Network con throttling y caché habilitada para medir regreso real; bajar hasta reserva y subir rápidamente hasta mosaico, luego bajar rápido. Repetir a375px. Comparar solicitudes iniciales con las que se agregan al avanzar; no deben precargarse todos los fondos lejanos. Disable cache sirve para observar la primera carga, no para evaluar reutilización de caché HTTP.
- Supuestos: se eligen dos pantallas/dos secciones para limitar memoria/red. La app retiene referencias pero no puede garantizar que el navegador conserve bitmaps decodificados bajo presión de memoria. Sin IntersectionObserver se conserva el fallback de compatibilidad. Mejoría perceptible pendiente de QA visual/red real.


### Carga progresiva de imágenes — 13 Oct 2026
- Validación: TypeScript web limpio, pnpm lint 0 errores/6 warnings heredados; los 37 scripts offline pasan (36 en el recorrido completo y galería reejecutada tras ajustar la expectativa que incluye VIDEO). Pruebas ampliadas para carga SSR diferida, prioridad del mosaico y preparación de fondos actual/siguiente.
- Cards lazy salvo primera card; dimensiones explícitas. Mosaico primera imagen eager/high y resto lazy. Fondos y fotos editoriales diferidos a una pantalla de anticipación; controlador prepara solo primeros dos y actual/siguiente, esperando decode para fundir sin ocultar originales.
- Sin cambios de diseño, carrusel, SEO, subida, BD ni dependencias. unoptimized conservado hasta verificar optimizer en producción. QA Network/Performance/375px/temas pendiente de Emma; procedimiento en CONTEXTO.md.


### Mapa interactivo desde el primer toque — 13 Oct 2026
- LocationMap.tsx aplica pointerEvents:auto al iframe, anulando las2reglas globales none del detalle/fullpage sin modificar globals.css ni el motor. Añade tabIndex0 y outline de foco interior visible (claro/oscuro). URL, dimensiones, compartir y coordenadas intactos.
- Revisado el contenedor: no overlay invisible cubriendo el mapa; botón compartir ocupa su esquina. Navegador local FR: pointer-events computado auto sin foco; elementFromPoint en centro devuelve IFRAME. Scroll fuera del mapa avanzó3989→4610 y navbar se ocultó; ↑ respondió. Galería/share y detail-scroll pasan; comprobación offline del iframe confirma eventos/foco; TypeScript limpio, lint0errores/6warnings heredados.
- Limitación QA: automatización rechazó drag por coordenadas fraccionarias del iframe; no se afirma validación de pan/zoom/touch. Emma debe probar primer click/drag/wheel, touch/pinch en375px, Tab/foco, scroll fuera del mapa, lightbox/Escape, navbar e ↑. Dentro del iframe los gestos/zoom cooperativo pertenecen a Google; CSS de la app ya no bloquea eventos. No se fuerza una política de rueda en contenido cross-origin ni se instala API/key nueva.
- Cambio únicamente en LocationMap y este registro; sin BD/backend/editoriales/fullpage/calendario/formulario/navbar ni estilos globales. Cambios previos del workspace conservados.

### Limpieza de textos públicos FR — 13 Oct 2026
- Recorridos manualmente /fr, /fr/casas y los2detalles publicados: del-canto-vallarta y arian-ocean-vallarta. Diccionario fr revisado sin Lorem/Test text/placeholders en valores; listado/Arian ya correctos, sin cambios allí.
- Origen real: datos guardados, no fallbacks hardcodeados. SiteContent.about_fr «Texte de test sur nous» → texto oculto en home. Del Canto PropertySection.descriptionFr: destino «Test text about destiny in this apartment» y amenidades/habitaciones/lugar/advertencias «Texte de test sur le destin dans ce département» → narrativas ocultas. Los equivalentes españoles también son prueba, por lo que no se inventa una traducción factual.
- i18n/public-french-text.ts filtra únicamente las expresiones de prueba identificables (incluye Lorem ipsum/Texto de prueba/Placeholder) en contenido mostrado en FR; no detecta idiomas arbitrariamente ni borra datos. Home/detalle aplican el filtro a about/narrativas/advertencias/descripciones; destacada FR sin descripción real no usa fallback español. Fotos reales se conservan; secciones solo con texto inválido y sin fotos se omiten por el filtro existente, sin caja/espacio vacío.
- Sin cambios de estilo/layout, SEO, backend/APIs, BD, panel, es/en ni diccionarios. Al guardar contenido francés real mediante el panel existente reaparece automáticamente. Nombres propios/direcciones permanecen tal cual.
- Nuevo test-public-french-text: placeholders, texto real, ausencia de cuadros vacíos, fotos, es/en intactos y sin fallback ES; usa SQLite en memoria. QA local posterior: home/Del Canto sin placeholders,0narrativas de prueba en DOM; listado correcto y Arian con descripción francesa real. No hubo guardados ni envíos.
- Cómo probar: pnpm dev → /fr (sin «Texte de test sur nous», redes/destacada intactas) → /fr/casas → ambos detalles. En Del Canto no deben aparecer las5narrativas de prueba; fotos/mapa/reserva siguen presentes. Revisar /es y /en sin cambios. El contenido almacenado permanece pendiente de sustituir editorialmente por la clienta; ocultar no lo elimina de la BD ni de su editor.

### Imagen social por defecto — 13 Oct 2026
- Foto existente reutilizada y ajustada sin IA con autorización: public/og-default.jpg1200×630,60658bytes. Lista, no pendiente de subir una imagen nueva.
- Fallback OG/Twitter absoluto con PUBLIC_SITE_URL en layout y pageMetadata: home/listado/detalle sin fotos. Portada propia y URLs Blob se conservan.
- test-seo cubre fallback/base/portada y dimensiones/peso reales. Sin cambios visuales/BD/deploy; previews y código fuente en producción pendientes de Emma. CONTEXTO mantiene señalados sus marcadores de conflicto preexistentes.
- Validación:36scripts offline pasan, TypeScript limpio, ESLint0errores/6warnings heredados.

Última actualización: 13 Oct 2026

### SEO técnico — 13 Oct 2026
- Metadata localizada home/listado/detalle, plantilla Portal Casas, canonical/hreflang es/en/fr+x-default, OG/Twitter con primera portada PHOTO y fallback; sin foto se omite imagen.
- Sitemap dinámico solo publicadas×3 + home/listado×3; robots excluye API/privadas por locale; noindex en panel/admin/cuenta/autenticación. Sin cambios de permisos ni componentes visuales.
- PUBLIC_SITE_URL en .env.example; Emma configura dominio HTTPS real en Vercel. Metadata bloqueante en HTML inicial mediante htmlLimitedBots; posible aumento TTFB documentado.
-31scripts offline pasan, TypeScript web limpio, lint0errores/8warnings heredados. Nuevo test-seo; sin Neon/migraciones/commit/deploy.
- Pendiente: QA de HTML crudo/sitemap/robots/previews por Emma. lastModified omitido porque Property no tiene updatedAt; JSON-LD bonus diferido hasta definir clasificación/tarifas anuales. Detalle en CONTEXTO.md.

---

## ✅ Completado

### 1. Internacionalización (i18n) - Página de Inicio
**Fecha:** 02 Oct 2026
**Archivos modificados:** `apps/web/src/app/[locale]/page.tsx` + diccionarios (`es.json`, `en.json`, `fr.json`)
**Cambios:**
- Todos los textos fijos en español reemplazados por claves `t('clave')`.
- Formulario de búsqueda ya no forza `/es/casas`; mantiene el locale elegido.
- 7 claves nuevas agregadas en los tres idiomas.
**Validación:** TypeScript ✓ | ESLint ✓ (3 advertencias preexistentes)

### 2. Conexión Calendario ↔ Formulario de Reserva
**Fecha:** 02 Oct 2026
**Archivos creados/modificados:**
- `ReservationDatesProvider.tsx` (estado compartido)
- `reservationDates.ts` (reglas de selección)
- `AvailabilityCalendar.tsx` (selección de rango)
- `MessageForm.tsx` (inputs sincronizados)
- `page.tsx` (conexión de componentes)
**Funcionalidad:**
- Primer clic en fecha disponible → LLEGADA (check-in).
- Segundo clic en fecha posterior → SALIDA (check-out).
- Clic en fecha anterior reinicia selección.
- Fechas ocupadas bloquean o invalidan la selección.
- Precio total recalculado automáticamente.
- Sincronización bidireccional (editar inputs actualiza calendario).
**Validación:** TypeScript ✓ | 17 pruebas de selección ✓ | ESLint ✓

### 3. Contraste Visual del Rango Seleccionado
**Fecha:** 02 Oct 2026
**Archivos modificados:** `AvailabilityCalendar.tsx` (estilos)
**Cambios:**
- Día de rango seleccionado: tono verde MÁS OSCURO vs. día disponible.
- Texto blanco sobre fondo oscuro para legibilidad.
- Mantenida estética de bordes redondeados y tamaño de celda.
**Validación pendiente:** Prueba visual en navegador

### 4. Glassmorphism en Página de Inicio
**Fecha:** 02 Oct 2026
**Archivos modificados:** Estilos de paneles principales en la home
**Cambios:**
- Fondo translúcido + desenfoque (`backdrop-filter: blur()`) aplicado.
- Coherencia con página de detalle de casas.
- Legibilidad mantenida sobre fondo desenfocado.
**Validación:** "Se ve bien" ✓ (confirmación manual)

---

## ⏳ En Proceso

### 5. Eliminación Barra de Progreso Redundante
**Fecha:** 02 Oct 2026
**Objetivo:** Quitar barra verde superior, mantener solo skeletons.
**Estado:** Prompt listo, pendiente de ejecución.

### 6. Internacionalización Completa - Página de Detalle de Casa
**Fecha:** 02 Oct 2026
**Archivos afectados:** `apps/web/src/app/[locale]/casas/[slug]/` (+ componentes hijos)
**Texto identificado:**
- Sección detalle, amenidades, formulario, calendario, controles de fotos, mapa.
- Menú y footer compartidos también tienen texto en español.
- Títulos/descripciones de casas: ya salen de BD por idioma ✓
**Enfoque:**
- Usar `Intl` para meses/días del calendario.
- Inputs `type="date"` mantienen formato día/mes/año según locale del navegador.
**Estado:** Agent trabajando (inventario de textos en curso)

---

## 🔜 Pendiente de Planificación

| Prioridad | Tema | Notas |
|-----------|------|-------|
| High | Validación de formulario de consulta | Email válido, fechas futuras posibles, huéspedes > 0 |
| Medium | Responsive calendario en móvil | Columnas apretujadas en pantallas pequeñas |
| Low | Meta título y descripción multilingüe | SEO tags por idioma |

---

## 📝 Decisiones Técnicas

1. **Fecha dd/mm/aaaa:** se mantiene formato en todos los idiomas (no regionalizado).
2. **Skeletons > Barra de progreso:** preferido por estética limpia.
3. **Provider compartido:** `ReservationDatesProvider` para estado de reservas.
4. **i18n en `Intl`:** días/meses del calendario usando `Intl.DateTimeFormat` con el locale activo.

---

## 🐛 Bugs Conocidos / Notas

- Navbar compartido: "PROPIEDADES" sigue en español en `Navbar.tsx:30`.
- Algunas rutas precargadas pueden abrir sin mostrar loading.
- Advertencias ESLint preexistentes (3) no fueron alteradas.

---

## 📊 Métricas de este Sprint (02 Oct 2026)

| Tipo | Cantidad |
|------|----------|
| Archivos modificados | ~19 archivos |
| Líneas agregadas | +500 aprox. |
| Líneas eliminadas | -90 aprox. |
| Tests pasados | 17 |
| Errores TS/ESLint | 0 nuevos |

---

### 7. Fase 1 — Rol colaborador y propiedad con dueño
**Estado:** Completada y validada en Respaldo según confirmación del usuario.
- Autorización Auth.js/rol vigente y filtros por dueño en el servidor.
- Colaborador: 200 propia / 404 ajena; admin: 200 en ambas.
- Se conserva la prueba de login/cookie/sesión sin red en `scripts/test-auth-session.cjs`.

### 8. Fase 2 — Panel del colaborador
**Fecha:** 05 Oct 2026
**Estado:** Implementado y validado con pruebas automatizadas sin red; pendiente checklist manual en navegador contra Respaldo.
- Panel privado es/en/fr: propiedades propias, creación, edición, temporadas, imágenes por URL, disponibilidad y consultas/reservas filtradas.
- Toda creación asigna dueño desde sesión y nace en borrador; publicación solo por admin. Despublicación disponible; sin borrado físico de propiedades.
- Reutiliza AvailabilityCalendar/ReservationDatesProvider y SectionSlider, sin modificar sus archivos ni el flujo público.
- Nuevas APIs verifican rol y dueño antes de tocar datos y dentro del SQL. Recursos ajenos: 404.
- Sin migraciones, despliegues ni escrituras de prueba en Neon/main.
- Validación: tests de APIs/permisos y render SSR es/en/fr, regresiones Fase 1/Auth.js, TypeScript y ESLint de los archivos de Fase 2.
- Checklist pendiente: prueba visual móvil/escritorio, edición real y aprobación/publicación por admin en Respaldo.
- Decisiones S1–S4, inventario de archivos y mapa de rutas: `docs/FASE2-PANEL.md`.

### 9. Lote de limpieza — correcciones menores acumuladas
**Fecha:** 05 Oct 2026
**Estado:** Los cuatro pendientes resueltos en código; comprobación del idioma en BD Respaldo pendiente de ejecución manual.
- [x] Footer es/en/fr localizado y error ESLint del enlace corregido; navegación comprobada en navegador en en/fr.
- [x] Galería: dots limitados al ancho disponible y con wrapping. Comprobados 55 puntos: tres filas a 360px, una a 1440px, sin overflow y con selección del último punto funcionando.
- [x] CategorySection: investigación previa confirmó regresión (map eliminado en 36db0df1). Listado restaurado con estilos anteriores, sin borrar props/datos ni alterar su ocultación sin fotos.
- [x] Consultas: el formulario envía lang desde el locale activo; API y esquema existentes se conservan. Persistencia es/en/fr verificada en memoria.
- Validación: TypeScript, ESLint de los componentes (0 errores; advertencia previa de img en slider), tests de consultas y render del panel es/en/fr.
- Sin migraciones, conexión directa a Neon, borrados ni cambios de validación/calendario/panel.
- Inventario, diagnóstico y pruebas manuales: `docs/LIMPIEZA-MENOR.md`.

### 10. Detalle — mosaico/lightbox y compartir desde el mapa
**Fecha:** 05 Oct 2026
**Estado:** Implementado; pruebas automatizadas y de navegador realizadas. Envío nativo a una app móvil y reproducción de videos pendientes de comprobación manual.
- PropertyGallery sustituye el hero de detalle; SectionSlider se conserva en categorías, CategoryGrid y panel.
- Mosaico de 2/3/4 columnas con 8 miniaturas y acceso a todos los medios mediante lightbox; dialog, teclado, foco, cierre, scroll y animación accesibles.
- Botón del mapa comparte título y URL con locale; fallback de copia y feedback es/en/fr. Cancelación nativa probada sin enviar datos a otra app.
- Es/en/fr comprobados a 360, 375, 768 y 1440px sin scroll horizontal; imágenes verticales y horizontales mantienen proporción.
- TypeScript, ESLint (solo warnings previos de datos sin uso en la página), test-gallery-share y regresiones de consultas/panel pasan.
- Sin librerías, backend, migraciones ni cambios en calendario/formulario/validación. Checklist y decisión en `docs/GALERIA-COMPARTIR.md`.

## Actualización — 6 de octubre 2026

### ✅ COMPLETADO Y DEPLOYADO EN PRODUCCIÓN
- i18n completo home/detalle/panel (es/en/fr)
- Calendario ↔ formulario de reserva bidireccional con precio dinámico
- Glassmorphism, skeletons con shimmer (barra verde eliminada)
- Fase 1: rol COLLABORATOR + ownerId + property-access.ts (matriz 200/404 validada)
- Fase 2: panel del colaborador (crear/editar propiedades, temporadas, imágenes, bloques, consultas propias)
- Deploy a producción: migración en main de Neon ANTES del código (checkpoint creado)
- Validación formulario de consulta: cliente + servidor (inquiry-validation.ts), 400 con code/fields
- Responsive de reserva: celdas 41-43px, flechas/inputs 44px, sin scroll horizontal (ver RESPONSIVE-RESERVA.md)
- Lote de limpieza: footer locale, dots galería, CategorySection restaurada (regresión commit 36db0df1), lang de consultas (ver LIMPIEZA-MENOR.md)
- Galería en mosaico + lightbox accesible + botón compartir mapa (Web Share API + fallback copiar) (ver GALERIA-COMPARTIR.md)

### 📋 PENDIENTES
- **Fase 3 — Invitaciones/gestión usuarios: BLOQUEADA esperando las 4 respuestas del cliente**
  (calendarios/Airbnb, manejo de mensajes, aprobación de publicación, reglas de precio)
- Columna huéspedes en Message (se valida, no se persiste) — requiere migración BD
- lastSyncedAt/iCal: columna de sincronización sin terminar — investigar
- Advertencia <img> en detalle (ESLint) — cosmética
- Pruebas pendientes en dispositivo real: compartir nativo en móvil, Safari/iOS, reproducción de videos en lightbox
- Cuenta meniblu@hotmail.com quedó COLLABORATOR en producción — cuenta de pruebas documentada
- Supuestos vigentes: "hoy" = America/Mexico_City en validación; mosaico diseñado para ≤8 miniaturas

### 🔑 INFRAESTRUCTURA ACTUAL
- Producción: código nuevo + main de Neon migrado (Vercel)
- Desarrollo local: branch Neon "Respaldo" (todo el testing aquí)
- Regla de deploy: migración en main ANTES de desplegar código, siempre con checkpoint previo
- Usuarios: admin susudone@proton.me; colaborador prueba meniblu@hotmail.com
- Convención de trabajo con el agente: prompts cerrados, reportes EN TEXTO (no capturas), auditoría manual tras cada entrega, verificar que NO toque main de Neon

## Actualización — 9 de octubre 2026

### Compresión automática de fotos (cliente)

- Implementada sin librerías en photo-upload.ts/ResourceEditor: umbral >1MB, JPEG .82, lado mayor 1920px sin upscale, orientación from-image, fallback al original y nombre .jpg saneado. Peso final validado con límite C1 vigente 4MB; servidor/Blob intactos.
- Nuevos mensajes de optimización/pesos es/en/fr; test-image-compression cubre canvas/decode/umbrales/fallback. Subida y cambio de propiedad mantienen permisos, categorías/orden y abort. QA real de cámara/verticales y calidad en Respaldo pendiente, sin operaciones Neon/Blob aquí.

### Home: búsqueda y Sobre nosotros/redes

- Corregido listado: consume guests/start/end, capacidad >= huéspedes y disponibilidad Booking/BlockDate en servidor; vacío/aviso y limpiar filtros es/en/fr. El buscador existente no ofrece destino.
- Implementado SiteContent key/value y editor exclusivo ADMIN /panel/contenido (GET/PUT /api/panel/site-content), narrativas es/en/fr de 2000 caracteres y redes HTTPS. Home muestra contenido guardado bajo el hero con Reveal y SVG locales; valores vacíos lo ocultan.
- SQL scripts/sql/site-content.sql PROPUESTO, NO EJECUTADO. Pendiente aplicación manual por Emma: Respaldo → validación → restore point/main antes del deploy autorizado. Tabla requerida por home; no desplegar sin ella.
- Tests offline nuevos: test-property-search.cjs y test-site-content.cjs; validación visual/BD real pendiente. Detalle, reservas y panel de propiedades intactos.

### Correcciones menores/medianas de auditoría

- Implementados los nueve puntos autorizados: config Drizzle sin safe, label email traducido, error de contraseña corta visible con token válido, lang inválido 400 INVALID_LANG, modal con salida estrictamente posterior, Date inválido 400 INVALID_DATES, reduced-motion sin reset de scroll, login por locale y .env.example sin secretos.
- Pruebas offline específicas: test-audit-fixes.cjs y extensiones de auth-session, inquiry y detail-scroll. Sin operaciones Neon/migraciones ni cambios a permisos, schema o flujos del panel.
- QA manual: en localhost/Respaldo verificar olvide/reset en es/en/fr (para probar el rechazo servidor, omitir validación HTML temporalmente), modal con fechas iguales deshabilitado y scroll interno conservado con reduced-motion. Solapamientos e iCal siguen pendientes y fuera de este lote.

### ✅ COMPLETADO (validado localmente por Emma; PENDIENTE de push/deploy)

**Sistema de imágenes — migración a Vercel Blob (CERRADA)**
- 84 fotos servidas desde Blob (dominio
  `eorinf4h9dcvcdit.public.blob.vercel-storage.com`), URLs de Media
  corregidas en main.
- Carpeta `apps/web/public/fotos` eliminada del repo.

**Scroll reveal público (08 Oct)**
- `components/Reveal.tsx`: IntersectionObserver, 700ms ease-out,
  distancia 48px, revelado único. Cascada en cards del listado
  (index*120ms, tope 600ms). Respeta prefers-reduced-motion y SSR.
  Aplicado a home, listado, detalle y footer público.

**Renta anual + contacto WhatsApp por propiedad**
- Schema: `rentalType` ('nocturna'|'anual', default 'nocturna'),
  `contactName`, `whatsapp` en Property.
- Panel: campos en PropertyForm + validación servidor
  (panel-validation.ts). Badge "Renta anual" en PropertyCard.
- Detalle: botón de WhatsApp secundario debajo del botón de
  reserva, con mensaje prellenado por idioma.
- ⚠️ Migración `scripts/sql/property-rental-contact.sql` PROPUESTA,
  AÚN NO EJECUTADA en Neon (Respaldo → main).

**Detalle — viaje de escenas full-screen (09 Oct) ✅ confirmado por Emma**
- Estructura: mosaico → 4 editoriales (destino/amenidades/
  habitaciones/lugar) → mapa/advertencias → reserva+WhatsApp.
- EditorialPresentation.tsx: avance por scroll (sin autoplay),
  contenidos y estilos internos conservados.
- Secciones no-editoriales con imagen de fondo personalizable
  elegida desde el panel (biblioteca de fotos; "ninguna" = blanco).
- Navbar inteligente (se oculta al bajar, reaparece al subir) y
  botón flotante ↑ (PropertyDetailScroll.tsx).
- Footer fuera del snap, pie de página normal al final del scroll.
- Eliminado velo blanco que lavaba la imagen de fondo.
- Docs: DETALLE-SCROLL-SNAP.md (checklist), CONTEXTO.md.
- Nota de entorno: navegador automatizado de QA caído en Windows
  (sandbox); el QA visual fue manual (checklist de Emma).

### 📋 PENDIENTES (prioridad)

Detalle sin snap (12 Oct): eliminado snap obligatorio y align:start de globals.css y módulo editorial. Componentes/motor/alturas protegidos intactos; editoriales mantienen altura natural, stages interactivos conservan100dvh por geometría JS. QA visual de recorrido continuo pendiente de Emma.

QA UX 12 Oct: subida múltiple, navbar translúcida y editoriales en flujo libre implementados; verificar visualmente en375px/desktop y es/en/fr con Emma.

### UX — cola de fotos y detalle (12 Oct 2026)

- Uploader secuencial con optimización por archivo, fallos individuales, orden inicial + índice y resumen; abort detiene pendientes. APIs y compresión intactas.
- Navbar detalle: fondo93% →75%, mantiene blur y lógica direccional.
- Editoriales en altura natural y scroll libre; fondos/fotos con fundido por scroll, tarjetas glass oscuro65%/blur12. Snap del documento suspendido solo mientras se ven editoriales, necesario para no saltarlas; stage mosaico/mapa/reserva intacto.
- Tests de cola y detalle ampliados: 30 scripts pasan, TypeScript web limpio y ESLint 0 errores / 8 warnings preexistentes. QA real/visual pendiente; sin BD/Blob, dependencias, SQL ni deploy.

1. **Bugs conocidos:** iCal sync no deduplica eventos (reservas
   duplicadas al repetir sync); `bookings/create` no valida
   solapamientos de fechas.
2. QA manual de calendario para colaboradores: tooltips de origen y desbloqueo host implementados; BlockDate de la grilla permanece solo lectura (sin endpoint DELETE existente).
3. Navbar post-login: fix aplicado, falta confirmación final.
4. QA de compresión cliente implementada: cámara >5MB, orientación/legibilidad y peso final en Respaldo.
5. Aplicación manual por Emma de `scripts/sql/site-content-featured.sql` (Respaldo → main) y QA de Propiedad destacada en home.
6. Aplicación manual de `scripts/sql/site-content-contact.sql` después del ALTER de destacada y QA del footer global (redes + WhatsApp, 375px y es/en/fr).
7. QA manual de Compartir ubicación: Google Maps con coordenadas/búsqueda, fallback a página, móvil/desktop y es/en/fr.

### Compartir ubicación — detalle (09 Oct 2026)

- Implementado: PropertyShareButton comparte URL oficial Maps search api=1 (coordenadas primero; dirección/ciudad como fallback; página si todo falta), título localizado + ciudad y feedback de ubicación.
- Mantiene mecanismos Web Share/clipboard/cancelación/temporizador y accesibilidad. LocationMap sin cambios de iframe; page.tsx solo amplía props de ambas instancias según autorización del usuario. WhatsApp y resto del detalle intactos.
- Tests offline ampliados en test-gallery-share.cjs; 30 scripts pasan, TypeScript web limpio y ESLint 0 errores/8 warnings preexistentes. Verificación real del pin/share nativo pendiente de Emma. Sin SQL, endpoints, dependencias ni operaciones contra BD.

### Footer — redes y WhatsApp global (09 Oct 2026)

- Implementado: mismas URLs Instagram/Facebook de SiteContent, WhatsApp opcional con número visible/formato genérico, SVG inline, accesibilidad y estilos compartidos de redes; email intacto.
- Selector/campo ADMIN en Contenido del sitio, regex 8–15 dígitos y 400 INVALID_CONTACT_WHATSAPP; contexto del layout alimenta ambos footers, incluido detalle, sin modificar home/nav/detalle.
- Excepción aprobada: ALTER del CHECK para séptima clave contact_whatsapp; SQL preparado y PENDIENTE de ejecución manual por Emma. Cero tablas/columnas nuevas y ninguna conexión a BD.
- Pruebas offline: 30 scripts pasan, TypeScript web limpio y ESLint 0 errores/8 warnings preexistentes. QA real en Respaldo pendiente (vaciar individualmente, enlaces, 375px, tres idiomas y temas).

### Propiedad destacada en home (09 Oct 2026)

- Implementado: selector ADMIN en Contenido del sitio, clave featured_property_id por GET/PUT existentes, validación de publicada y tarjeta tras Sobre nosotros/cierre del video.
- Primera portada por coverOrder, fallback PHOTO por order/id; sin foto, eliminada o despublicada oculta. Descripción breve localizada, CTA localizado, animación existente de Sobre nosotros y hover respetando reduced-motion.
- Excepción mínima aprobada: ALTER del CHECK SiteContent en `scripts/sql/site-content-featured.sql`, PENDIENTE de ejecución manual. No hay nuevas columnas/tablas ni conexiones a Neon.
- Pruebas: `test-featured-property.cjs` y regresión `test-site-content.cjs`; suite de 29 scripts pasa, TypeScript web limpio y ESLint 0 errores/8 warnings preexistentes. QA visual 375px/es/en/fr/temas y BD Respaldo pendiente de Emma.

### Calendario del panel — origen y desbloqueo host (09 Oct 2026)

- Implementado: detalles por mouse/foco/toque con rango y origen es/en/fr; colores diferenciados, aviso de solo lectura, confirmación de eliminación completa de host-block, aviso flotante y actualización sin recarga completa.
- Reutilizado DELETE de bloques existente: propiedad propia/ADMIN; reserva directa/iCal no eliminables; property-access y endpoints sin cambios. Sin SQL/Neon.
- Tests offline: interacción cliente y permisos/DELETE real con SQLite en memoria; los 28 scripts pasan, TypeScript web limpio y ESLint 0 errores/8 warnings preexistentes. Validación visual y contra Respaldo pendiente de Emma (375px, es/en/fr, ambos temas).
- Decisiones: el bloqueo creado desde la grilla sigue siendo BlockDate; crear host-block desde el editor individual para este flujo. Sin desbloqueo parcial ni Deshacer (no hay restauración existente).


### Detalle: scroll único continuo — 12 Oct 2026
- Mosaico, mapa y reserva salen de scenes/afterScenes y quedan en flujo documental junto a las editoriales; footer normal conservado.
- Eliminadas alturas forzadas/scroll interior del stage en la página; padding de las secciones24px (antes101px arriba/88px abajo), degradado decorativo entre fondos. Motor editorial intacto.
- Mapa no captura rueda por defecto: interacción con foco de teclado o enlace localizado a Google Maps.
- Validación: 30 tests offline pasan; TypeScript web limpio; lint0errores/8warnings preexistentes. DOM/browser1280px/375px sin huecos/overflow; lightbox y persistencia de fechas/campos con ↑ verificadas sin enviar datos. Checklist completo en CONTEXTO.md.


### Detalle: viaje visual de fondos compartidos — 12 Oct 2026
- Layout y CSS incorporan una capa decorativa sticky común desde mosaico hasta reserva; fundidos de opacidad ligados a timelines CSS de cada sección, sin snap ni alturas forzadas del contenido.
- EditorialPresentation y componentes interactivos intactos. Footer fuera del recorrido; fallback local con reduced-motion/navegadores sin soporte.
- Los 30 scripts offline pasan; TypeScript limpio, lint 0 errores / 8 warnings previos. QA local de fundido editorial→mapa, 375px sin overflow, lightbox y composición es/en/fr; reserva en francés/oscuro legible. Checklist completo en CONTEXTO.md.


### Detalle: fondo fijo Apple-style sin snap — 12 Oct 2026
- Fondo decorativo sticky compartido, contenido en altura natural y footer fuera del stage; fundido400ms con progreso de scroll equivalente al motor editorial existente.
- EditorialPresentation conserva API y contenido; el efecto compartido reemplaza timelines CSS y funciona también sin editoriales. Reduced-motion conserva fondos locales y funcionalidad completa.
- test-detail-scroll ampliado: cambio/intermedio/retorno de fondo, reduced-motion/cleanup, ausencia de snap y flujo natural. 30 scripts pasan, TypeScript limpio, lint0errores/8warnings previos.
- QA local:375px sin overflow; lightbox, navbar direccional, ↑ y conservación de fechas/campos. Matriz visual completa y teclado móvil real: checklist en CONTEXTO.md. Sin migraciones ni BD/deploy.


### Detalle: secciones independientes full-screen — 12 Oct 2026
- Eliminado stage global; mosaico/mapa/reserva conservan fondo propio y cada editorial se compone con una instancia slides:[slide], sin cambiar el componente.
- CSS externo: min-height100dvh/heightauto para no cortar contenido largo, sin snap ni solapamiento; fundido decorativo de entrada y fallback reduced-motion. Footer natural.
- 30 scripts pasan, TypeScript limpio, lint0errores/8warnings previos. Capturas/DOM: siete contenedores y fondos independientes, editoriales720px en viewport720px /812px en móvil375×812; sin overflow. Lightbox y calendario/formulario verificados sin enviar datos.
- QA completo y supuestos en CONTEXTO.md; teclado móvil real/reduced-motion visual pendientes de Emma. Sin BD/migraciones/deploy.


### Detalle: scroll-snap diapositivas — 12 Oct 2026
- Solo globals.css en la app: snap raíz y mandatory/overflow-scroll/height100vh; siete secciones min100vh/flex/start, con fondos propios y centrado.
- Footer conserva altura natural, cierre end en su envoltura para hacerlo alcanzable. Componentes React/navbar/↑/lightbox/calendario/formulario sin cambios.
- Los30scripts offline pasan; TypeScript limpio, lint0errores/8warnings previos; test-detail-scroll actualizado. QA local desktop/375px: snap, lightbox y footer accesibles; checklist en CONTEXTO.md.


### Detalle: snap simple local — 12 Oct 2026
- Contenedor en page.tsx con height100vh/overflow-scroll/snap mandatory; cada sección width100%/min100vh/flex/start y fondo independiente. Footer exterior natural.
- Sin stage global, fondos sticky ni timelines complejas. Navbar/↑ y fotografías adaptan su referencia al scroller local; lightbox bloquea ambos scrolls.
- 30 scripts pasan, TypeScript limpio, lint0errores/8warnings previos; pruebas y captura del scroller local. QA manual en CONTEXTO.md.


### Detalle: remates finales — 12 Oct 2026
- Proximity en vez de mandatory; fondos estáticos precargados y entrada300ms, un hero exclusivo por editorial. Estructura intacta.
- Navbar sigue deltas exterior/interior separados y conserva clases tras cambios de React; foco de teclado accesible.
- Mosaico compacto según HEAD disponible (falta commit de título solicitado); paneles gris90082%/blur4px/texto claro, CSS exclusivo del detalle.
- 30 scripts pasan, TypeScript limpio, lint0errores/8warnings previos. Pruebas de preload/proximity/navbar y QA local; checklist/supuestos en CONTEXTO.md.


### Editoriales: fade + autoplay + vidrio blanco — 12 Oct 2026
- Fondo propio por sección con fade350ms de entrada/salida y proximity intacto.
- Carrusel fotos4s, puntos/flechas/teclado/swipe, pausa interacción/invisible; reduced-motion sin autoplay. Una foto sin controles.
- Narrativas vidrio blanco22%/blur10px/texto negro; otros módulos intactos.
- 30scripts offline pasan; TypeScript limpio; lint0errores/8warnings previos. Browser375px,es/en/fr,temas y navegación manual verificados; prueba táctil/reduced-motion visual pendientes.


### Marco de fotos editorial: vidrio blanco — 12 Oct 2026
- Solo CSS del marco: blanco35%/blur10px, texto y controles negros; radio/padding/carrusel/fondos intactos.
- Dos tests de detalle/editoriales pasan; captura y DOM375px/francés/oscuro comprueban estilo y ausencia de overflow. Checklist en CONTEXTO.md.


### Detalle: slide/fade de sección completa — 12 Oct 2026
**Estado:** Implementado y validado; PENDIENTE de aprobación visual del cliente.
- Observer local: activa opacity1, inactivas.3/blur2px, transición400ms; flujo/fondos propios/proximity intactos.
- Carrusel4s sin flechas/puntos visibles; narrativa blanco20%/blur10px/texto negro. Foco/modal y reduced-motion/fallback protegidos.
- Tres archivos de app + test-detail-scroll/docs. 30scripts pasan, TypeScript limpio, lint0errores/8warnings previos; capturas desktop/móvil375px/es/en/fr/temas presentadas.
- No considerar cerrada hasta aprobación de las capturas; checklist/supuestos en CONTEXTO.md.


### Detalle: transición200ms + vidrio blanco general — 12 Oct 2026
- Fade de sección/fondo200ms, enlace «Ubicación ↗» bajo mapa retirado; mapa/comportamientos existentes sin cambios.
- Advertencias/calendario/formulario blanco25%/blur10px/texto negro, formulario sin segunda capa opaca. Estados calendario legibles y lógica intacta.
- 30scripts pasan, TypeScript limpio, lint0errores/8warnings previos;375px/es/en/fr/temas, rango13→15Oct y paneles verificados. Docs/checklist/supuestos en CONTEXTO.md.


### Experimento detalle fullpage — 12 Oct 2026
**Rama:** experimento/detalle-fullpage. **Estado:** Implementado/validado, PENDIENTE aprobación visual; sin merge ni deploy.
- Una escena por gesto de rueda/swipe para contenido que cabe; inercia agrupada, entrada fade300ms (opciónA), fondos propios/vidrio25%, autoplay4s intacto.
- Opción2 confirmada: reserva móvil y otras escenas largas con scroll natural, sin recortar contenido; footer normal. Mapa/input/lightbox protegidos.
- 31scripts pasan (nuevo test-detail-fullpage), TypeScript limpio, lint0errores/8warnings previos. QA desktop720px y móvil812px: avances exactos de una escena; reserva/formulario/submit y lightbox verificados sin enviar datos.
- Tres capturas en docs/qa para aprobación; checklist/supuestos en CONTEXTO.md. Merge manual solo tras aprobación de la clienta.


### Doble scroll del detalle — implementado (12 Oct 2026)
- Documento único en desktop/móvil; snap del html limitado al detalle, contenedor natural y reserva móvil con excepción aprobada.
- Navbar/↑ escuchan window: visible al subir/al final, oculta al bajar. EditorialPresentation ajustado con autorización: navegación/observer/EditorialFlow usan documento; carrusel/fade/contenidos intactos.
- Validación: 31 scripts offline pasan, TypeScript web limpio, lint0errores/8warnings previos; diff sin errores. Tests del detalle/fullpage actualizados para prohibir scroll interior y cubrir dirección/final/↑. QA visual de esta corrección pendiente de Emma; sin merge/deploy/BD. Checklist en CONTEXTO.md.


### Final fullpage: reserva libre y footer — 12 Oct 2026
- Reserva con altura natural y sin snap en todos los anchos; fondo, vidrio, componentes y provider intactos.
- Snap del documento desactivado mientras reserva/footer están en el tramo libre; restaurado al volver a diapositivas. Rueda/swipe no interceptados en ese tramo.
- Tests cubren CSS, desactivación/restauración/cleanup del snap, reserva libre incluso corta, swipe y navbar al final/↑. QA visual pendiente de Emma según checklist de CONTEXTO.md. Sin merge/deploy/BD.
- Validación offline: 31 scripts pasan; TypeScript web limpio, ESLint0errores/8warnings previos y diff limpio.


### Crossfade revertido — 12 Oct 2026
- Revertido el último ajuste a petición del usuario: desaparecieron las imágenes de fondo. Restaurados fondos locales/fade/observer anteriores y retirado el test específico del intento descartado.
- Scroll único, navbar/↑ y reserva/footer libres conservados. El parpadeo sigue pendiente; sin merge/deploy/BD.


### Detalle: ocultar cuadros de plantilla/vacíos — 12 Oct 2026
- Eliminadas listas fijas de servicios; galerías con Media real conservadas sin columna informativa vacía.
- Descripción/destino requieren texto/ubicación no vacíos; editoriales sin datos válidos omitidas; fotos solas/texto solo no muestran cuadros vacíos. Advertencias con hero real o narrativa.
- Tests render es/en/fr y estados parciales actualizados. Sin BD/backend/panel; fullpage/fondos/reserva/footer conservados. QA manual pendiente según CONTEXTO.md; criterio de completitud documentado como supuesto.


### Mapa slide + fundido de fondos locales — 12 Oct 2026
- Mapa explícito min100vh/align:start; umbral libre de reserva pasa de borde inferior a media pantalla para no liberar mapa completo.
- Eliminado fade desde0 de sección completa. Copia saliente local decodificada encima de original entrante siempre opaca; no fondos globales/ocultamiento de imágenes. Fade300ms, agrupación80ms/serialización, fallback y reduced-motion.
- Tests de mapa→reserva/footer/navbar actualizados y nuevo test-detail-background-fade para decode, originales visibles, disparos repetidos y cleanup. QA visual pendiente de Emma con checklist en CONTEXTO.md; sin merge/deploy/BD.
- Validación: 32 scripts offline pasan, TypeScript limpio, ESLint0errores/6warnings previos y diff limpio.


### Acceso a reserva corregido — 12 Oct 2026
- Diagnóstico medido: gap mapa→reserva0px; fallo del ancla por falta de punto de snap (quedaba reserva705px abajo con mandatory activo).
- Aterrizaje inicial de reserva con margin navbar+12px; tramo interior continúa libre. Enlaces#reservar/hash inicial liberan snap antes de desplazarse; fullpage no intercepta el tramo libre.
- QA real desktop/375px/es/en/fr/claro/oscuro: CTA/PgDn/rueda/hash inicial llegan a calendario; footer e ↑ operables. Capturas en docs/qa/reserva-accesible-*.jpg. Swipe/teclado físico/barra manual pendientes de Emma.
- 32 tests pasan, TypeScript limpio, lint0errores/6warnings previos y diff limpio. Sin BD/merge/deploy; calendario/formulario/WhatsApp/fundido intactos.


### Captura de reserva: eliminar franja del mapa — 12 Oct 2026
- Ancla a borde superior exacto, protección del navbar trasladada a padding interno de reserva; fondos intactos.
- Ajuste de desplazamiento inicial cancelable ante interacción. Capturas desktop/móvil actualizadas y bordes verificados en navegador.
- TypeScript/test-detail-scroll pasan, sin BD/merge/deploy.


### Identidad de reserva + feedback inicial — 12 Oct 2026
- Reutiliza sectionBgReserva propio; fallback color del tema, cover centrado, respiro inferior64–96px y gradiente al tema dentro de reserva. Footer/tramo libre/ancla intactos.
- MessageForm sin errores iniciales: aparecen por blur/submit, aria-invalid acompaña mensajes; reglas/servidor/botón inválido deshabilitado conservados.
- QA desktop y375px/fr: fondos distintos, errores0 iniciales/nombre inválido tras blur, cierre/footer alcanzables sin overflow. Capturas reserva-identidad-*.jpg y reserva-cierre-footer.jpg; sin envíos/BD/merge/deploy.
- Tests de render es/en/fr actualizados, nuevo test-inquiry-feedback y checks CSS en detail-scroll. Checklist/supuestos en CONTEXTO.md.
- Validación: 33 scripts offline pasan, TypeScript limpio, lint0errores/6warnings previos, diff limpio; QA inglés/oscuro confirma fondo y gradiente del tema.


### Panel: ubicación Maps + borradores multiidioma — 12 Oct 2026 (traducción sustituida el13 Oct)
- Link Maps reemplaza UX principal de coordenadas; parser estricto/feedback, manual avanzado, Ver en Maps; persiste lat/lng existentes, sin migración.
- Opción B explícita: copiar sin traducir a idiomas vacíos + abrir traductor, sin sobrescribir ni guardar automáticamente. Disponible en títulos/descripciones de propiedad y narrativas de5secciones; labels es/en/fr.
-34tests offline pasan, TypeScript limpio, lint0errores/6warnings previos y diff limpio. Nuevo test-panel-location-translation para formatos/rechazos/manual/borradores.
- Persistencia/QA visual del panel requieren sesión real y prueba de Emma; no BD/red de traducción/merge/deploy. Criterios, evaluación API, checklist y supuestos en CONTEXTO.md.

### Panel: traducción automática en la misma pantalla — 13 Oct 2026
- Reemplaza apertura externa/copia de borradores: Traducir rellena destinos vacíos desde cualquier origen es/en/fr, avisa omisiones, conserva ediciones concurrentes y solo Guardar persiste. Carga y bloqueo de doble clic, sin cambiar parser Maps ni vistas públicas.
- Nueva API /api/traducir con requirePropertyManager, validación400, MyMemory gratuito sin key, segmentos450bytes/timeout20s, cuota429 y fallos502. Rate limit básico en memoria:4peticiones de destino/usuario/minuto; presupuesto5000caracteres/día/instancia. Límites oficiales verificados; dos destinos consumen dos veces el texto.
-35scripts offline pasan, TypeScript web limpio y lint0errores/6warnings preexistentes. Nuevo test-panel-translation cubre relleno, errores, ediciones previas/concurrentes, API/permisos, cuotas y doble clic. Prueba pública del protocolo HTTP200; sin textos de usuarios/propiedades enviados, sin BD/merge/deploy.
- Pendiente de Emma: QA autenticado, calidad/revisión de traducciones y Guardar/reabrir en los tres idiomas. Procedimiento, límites y supuestos en CONTEXTO.md.


## 2026-10-15 — Fondo público de papel

Home, /casas y ficha usan `--paper-bg: #F4F1EC` con grano SVG inline (alfa máxima 0.045, sin imagen externa ni animación). Modo oscuro: papel cálido #24211D y texto #F4F1EC. Títulos que antes eran blancos sobre fotos usan #29251F en claro. Las galerías, tarjetas y fotos editoriales se conservan; solo se desactivan fondos decorativos. El panel no cambia y conserva URLs/configuración.

Reactivar los fondos anteriores: cambiar `PUBLIC_PHOTO_BACKGROUNDS` a `true` en `apps/web/src/lib/public-appearance.ts`; el mismo flag retira la clase `public-paper`, restaura video de home, SiteListingBackground y fondos de ficha/editoriales. Componentes y datos no se borraron. CSS en `apps/web/src/app/globals.css`; composición en las tres páginas y `EditorialPresentation.tsx`. En papel oscuro, vidrio de ficha al 85% blanco para sostener texto oscuro.

QA: capturas aisladas con páginas reales y datos ficticios, sin Neon; comparar en sitio real antes de aprobación final.


### 2026-10-15 — Fondos de secciones descontinuados en UI, vivos en BD
La ficha mantiene papel beige #F4F1EC (papel oscuro del tema), sin fondos de inicio, mapa/reserva ni heroes editoriales o portada de advertencias. Se eliminan sus precargas explícitas y clases de título condicionadas a URLs guardadas. La galería principal y las fotos de contenido/carrusel editorial permanecen. Advertencias sin narrativa no genera un cuadro solo por su hero antiguo.
En edición se omite SectionBackgroundEditor y se desactiva SECTION_HERO_PICKER_ENABLED en PropertySectionsEditor; el hero guardado se conserva al guardar los textos. Siguen activos biblioteca, portada del listado y selección de fotos de contenido. No se modifican columnas, registros, Blob ni endpoints: PATCH /api/properties/[id], PUT /api/properties/[id]/sections/[section] y subida de fotos se conservan. Restauración: reactivar import/render de SectionBackgroundEditor, poner SECTION_HERO_PICKER_ENABLED=true y reponer el cableado de fondos/hero y precargas del detalle desde el diff; PUBLIC_PHOTO_BACKGROUNDS continúa desactivado, no cambiarlo globalmente sin revisar home/listado. No hay QA de navegador automatizado; verificación visual pendiente de Emma.

## Actualización de estado real — 16 Oct 2026

Este cierre prevalece sobre estados históricos de experimentos, fallos de tests y pendientes ya resueltos citados arriba. «Hecho» significa implementado en código; no equivale a QA humana, aprobación de la clienta ni deployment verificado.

**Rama y evidencia:** al revisar, el checkout está en `main`, HEAD `cdec8afd`, igual a la referencia local `origin/main`; árbol limpio antes de esta edición documental. No existe referencia local ni remota almacenada `experimento/redesign`. No se hizo fetch ni se consultó Vercel: **verificar** si esa rama existe actualmente en el servidor, qué preview corresponde y cómo se integraron los cambios. No afirmar «merge a main pendiente» como hecho: los commits revisados ya son ancestros del main local. Última entrada anterior del archivo: fondos descontinuados, commit `d4ae9eb0` (15 Oct).

### Home: hero con video y navbar integrado — 16 Oct 2026
**Estado: HECHO; PENDIENTE DE QA humana y aprobación del cliente.**
- Commit `0ecf8cae` («Nuevos paneles»): `HOME_HERO_MEDIA_ENABLED=true`, video configurable con fallback actual; navbar transparente al inicio, se oculta al bajar dentro del hero y vuelve mate al subir/salir. Buscador permanece en la lupa; `HOME_SEARCH_IN_HERO=false`.
- Reduced-motion conserva fallback estático. No se reactivan fondos del listado/ficha. Referencia: `docs/HOME-COMPOSICION.md`.

### Home: carrusel de propiedades destacadas — 16 Oct 2026
**Estado: HECHO; PENDIENTE DE QA humana y aprobación del cliente.**
- Commit `0ecf8cae`: HomeFeaturedCarousel reutiliza las tarjetas de destacadas; tres visibles en escritorio, una en móvil, flechas y rotación cada 3 s cuando hay más de tres. Pausa por hover/foco y reduced-motion. Con hasta tres no rota automáticamente.
- Verificar fotos, clic/revelado táctil, controles y selección de propiedades reales en preview; no consta aprobación visual nueva.

### Home: Sobre nosotros después de destacadas — 16 Oct 2026
**Estado: HECHO; PENDIENTE DE QA humana, configuración y aprobación del cliente.**
- Commit `0ecf8cae`: imagen vertical 2:3, título/texto localizados y redes; requiere imagen y texto para renderizar. Editor SiteContent reutiliza subida existente y permite títulos por idioma. Reveal de una sola vez.
- SQL `scripts/sql/site-content-about.sql` preparado; aplicación efectiva por entorno: **VERIFICAR**, no acreditada por git. Referencia: `docs/HOME-COMPOSICION.md`.

### Ficha: video de hero, títulos editables y presentación zig-zag — 16 Oct 2026
**Estado: HECHO; PENDIENTE DE QA humana y aprobación del cliente.**
- Commit `0ecf8cae`: PropertyHeroVideo con poster/fallback y reduced-motion; PropertyPresentationEditor configura video por URL/subida MP4/WebM <=4 MB y títulos es/en/fr en `Property.sectionTitles`. Editoriales alternan imagen/texto; reserva nocturna/ambas mantiene formulario izquierda y calendario derecha. En móvil se apilan.
- SQL `scripts/sql/property-presentation.sql` preparado; aplicación por entorno: **VERIFICAR**. Referencia: `docs/FICHA-PRESENTACION.md`. Galería y lógica de reservas conservadas.

### Ficha: separación vertical compacta — 16 Oct 2026
**Estado: HECHO; PENDIENTE DE QA humana.**
- Incluido en `0ecf8cae`, `property-presentation.css`: distancia compartida 48 px escritorio / 32 px móvil; se elimina altura mínima heredada de fullpage en secciones exteriores. Se conservan padding interno, tamaños de imágenes y hero con video.
- Verificar continuidad entre editoriales, mapa, reserva/contacto y footer, sin espacios muertos ni bloques pegados.

### Ficha: Reveal lateral unificado de mapa y advertencias — 16 Oct 2026
**Estado: HECHO; PENDIENTE DE QA humana.**
- Commit `0ecf8cae`: mapa y título llegan desde derecha; advertencias desde izquierda. Se reutiliza Reveal existente, sin segundo observer/animación paralela; una vez, permanece visible y respeta reduced-motion.
- Comprobar gestos del mapa, lectura y ausencia de desborde a 375 px.

### Destinos: catálogo, edición dependiente y búsqueda — 15 Oct 2026
**Estado: HECHO en código; PENDIENTE DE QA humana; datos por entorno, VERIFICAR.**
- Commit `044207df` («Buscador por ciudades»): catálogo tipado de 44 destinos, helpers de normalización, `state` + `destinationCity`, conservación de `city` legacy y selects dependientes Estado → Ciudad. Listado combina ubicación, fechas y huéspedes; fichas/tarjetas muestran Ciudad, Estado con fallback legacy.
- Se registra aquí como funcionalidad omitida en el cierre anterior, conservando su fecha de commit. Scripts de schema/backfill e instrucciones en `docs/UBICACION-CATALOGO.md`; Emma indicó después que las cuatro propiedades estaban migradas. No se consultó BD para corroborarlo ni se presupone igual estado en main de Neon.

### Panel admin/colaborador: paleta beige y cierre sin franja blanca — 15 Oct 2026
**Estado: HECHO; PENDIENTE DE QA humana y aprobación del cliente.**
- Commit `1d4a04f0` («cambio de panel»): layouts de admin/panel activan variante papel usando tokens públicos; superficies, controles y espacio hasta footer se integran al beige. Skin lavanda conservado para reversión; distribución y funcionalidades intactas.
- Referencia: `docs/PANEL-SKIN-PRUEBA.md`. Revisar formularios, tablas y tarjetas en ambos temas y tamaños.

### Tipo de renta: trilogía completa — 16 Oct 2026
**Estado: HECHO; PENDIENTE DE QA humana integral y aprobación del cliente.**
- Commit `cdec8afd`: (1) modalidades `nocturna`/`anual`/`ambas`, contactEmail opcional, selector inicial, tarifas/disponibilidad ocultas sin borrar para anual y omisión de feeds anuales en iCal; (2) ficha anual con contacto sin fechas/precios/calendario y WhatsApp/correo condicionales, validación del tipo real en servidor; (3) búsqueda con fechas excluye anual, sin fechas la conserva con filtros de ciudad/capacidad/publicación.
- SQL de sub-fase 1 aplicado según confirmación de Emma; branch de BD/estado por entorno: **VERIFICAR**. No hay migraciones adicionales de sub-fases 2/3. No se ejecutó SQL desde el agente.
- Referencias: `docs/DIAGNOSTICO-RENTA.md` y cierre de sub-fases en CONTEXTO.md. Mensajes con fechas nulas comprobados offline en listas; envío/recepción real y sincronización autorizada siguen pendientes de QA.

### Validación offline y corrección del test de chrome — 16 Oct 2026
**Estado: HECHO; suite 52/52 en verde en la última ejecución registrada.**
- `cdec8afd` contiene el cierre de tests: se corrige expectativa obsoleta de `.home-brand` introducida por `d9c35a2a`, admitiendo solo sus dos selectores de token de logo; aislamiento restante y contrastes AA conservados. Test francés comprueba valores traducidos, no nombres internos de claves.
- Última validación de implementación: 52/52 scripts `test-*.cjs`, TypeScript web limpio y `pnpm lint` 0 errores / 5 warnings preexistentes. No se reejecutaron en esta tarea de documentación; árbol de código coincide con el cierre registrado. No implica build de producción ni QA de navegador exitosos.

### Supuestos y límites de este cierre
- Fechas tomadas de commits y registros existentes; no se infiere una fecha de aprobación/deploy a partir de la fecha de implementación.
- «Pendiente de cliente» se conserva hasta aprobación expresa; el preview en Vercel en revisión procede del contexto de Emma, no de una comprobación del dashboard. URL/deployment concreto: **VERIFICAR**.
- SQL aplicado y migración de cuatro propiedades son confirmaciones previas de Emma, no verificaciones nuevas de Neon. Scripts que solo constan como propuesta permanecen marcados para verificar.
- Se modifica únicamente PROGRESO.md; sin cambios de código, ramas, commits, merges, BD ni servicios externos. No se abre navegador ni se generan capturas.

## Pendientes reales al cierre — 16 Oct 2026

1. **QA humana de Emma:** home/hero/navbar, carrusel y Sobre nosotros; ficha/video/fallback, títulos, zig-zag, separación compacta y Reveal; panel beige; catálogo/búsqueda y trilogía anual/nocturna/ambas con persistencia/envío/sync autorizados. Cubrir 1440/375 px, es/en/fr, claro/oscuro, teclado y reduced-motion. Usar checklists de HOME-COMPOSICION.md, FICHA-PRESENTACION.md y CONTEXTO.md.
2. **Decisión de la clienta sobre preview de Vercel: PENDIENTE.** Verificar URL, deployment y commit que se está revisando; no consta aprobación final ni validación de producción en esta revisión.
3. **Merge de experimento/redesign a main: VERIFICAR.** La rama no está en referencias disponibles y main local/origin-main almacenado ya contienen el cierre `cdec8afd`. Confirmar con Emma qué rama/PR queda por integrar antes de registrar un merge pendiente o completado. No se hizo ningún merge en esta tarea.
4. **CSP en Report-Only:** preparado en `apps/web/vercel.json`, commit `ac0aba2b`; verificar headers desplegados y registrar violaciones reales de Maps/Blob/video/Analytics. No pasar a bloqueo sin revisar resultados. Procedimiento en `docs/CSP-HEADERS.md`.
5. **Limpieza del fullpage descontinuado: PENDIENTE.** `DETAIL_FULLPAGE_ENABLED=false`; código experimental, reglas y tests históricos permanecen. El detalle vigente usa scroll nativo con presentación zig-zag; DETALLE-SCROLL-SNAP.md conserva descripciones de stage/100dvh ya históricas que requieren reconciliación antes de reactivar o retirar el experimento. No borrar ni reactivar como parte de este cierre.
6. **Verificar configuración por entorno:** SQL de presentación/SiteContent, dominio PUBLIC_SITE_URL, Analytics activado/deploy y datos reales. Medir LCP/INP/CLS con tráfico de producción y validar optimizer antes de quitar `unoptimized`, pendientes históricos sin evidencia de cierre nueva.

## Módulos de secciones de propiedad — 19 Oct 2026

**Estado: HECHO en código; PENDIENTE SQL manual, QA humana y aprobación del cliente.**
- PropertySectionsEditor incorpora interruptores para Destino, Amenidades, Habitaciones, En el Lugar, Advertencias y Mapa; Reserva/Contacto siempre activo y bloqueado. Los cambios de activación se guardan automáticamente, con permisos dueño/admin y feedback de fallo. Texto/fotos mantienen su guardado independiente.
- Nueva columna JSONB nullable `Property.sectionsEnabled`, independiente del contenido. NULL conserva inferencia por datos en propiedades existentes; nuevas propiedades: opcionales OFF y Reserva ON. Apagar conserva datos y borradores; reactivar los restaura. Títulos siguen en Presentación y se ocultan según módulo sin borrarse. Mapa conserva edición de coordenadas en datos básicos, sin modificar PropertyForm.
- Ficha filtra módulos y sus fallbacks antes de renderizar, sin huecos ni enlaces muertos; Reserva y #reservar siempre presentes. No se cambia zig-zag, reveal, tarifas/disponibilidad, mensajes, ni se añade reordenado.
- SQL `scripts/sql/property-section-modules.sql` generado y NO ejecutado. Emma: Respaldo → QA → main antes de desplegar. Estado de este SQL pendiente, independiente de migraciones anteriores.
- Cobertura nueva `scripts/test-section-modules.cjs`: defaults, persistencia, contenido/fotos intactos, permisos 401/403/404, Reserva forzada, SSR es/en/fr, anclas, reactivación y feedback del interruptor. Decisiones, inventario de archivos y checklist completos en CONTEXTO.md, sección 2026-10-19.
- Validación offline: **53/53 scripts test-*.cjs pasan**, TypeScript web limpio, ESLint 0 errores y 5 warnings preexistentes; DDL PostgreSQL y QA real pendientes.
- QA humana pendiente: propiedad con datos y propiedad nueva; apagar/reactivar Amenidades/Mapa, guardar/reabrir, conservar títulos/fotos; Reserva bloqueada; Tab/Espacio/Enter; 375px/1440px, es/en/fr y ambos temas. Sin navegador automatizado ni migraciones ejecutadas por el agente.

## Riel de módulos del editor — 19 Oct 2026

**Estado: HECHO en código; PENDIENTE de QA humana.**
- Riel derecho sticky con columna reservada en desktop >=1024px si editor tiene >=960px útiles; en móvil/panel estrecho, menú compacto sticky. Un solo DOM y fuente de estado, con toggle inmediato y rollback ante fallo. Reserva bloqueada con candado; nombres enlazan a cada bloque sin robar foco, respetando reduced-motion.
- Solo PropertySectionsEditor, su CSS local, test de módulos y documentación. Sin API/schema/ficha/otros editores ni reordenado. Se reutilizan textos existentes. Tests de sincronía, menú y desplazamiento ampliados; TypeScript limpio y ESLint 0 errores/5 warnings anteriores.
- Suite offline completa: **53/53 tests pasan**. Verificación visual pendiente de Emma; sin navegador ni capturas automáticas.
- QA Emma: riel 1440px, menú 375px, ambos controles sincronizados, enlaces de módulo, teclado y Reserva; es/en/fr y ambos temas. Decisión: sticky limitado al editor, no overlay fixed sobre campos; móvil conserva menú abierto tras navegación para no esconder el enlace enfocado. Detalles en CONTEXTO.md.

### Riel único: retirada de interruptores duplicados — 19 Oct 2026
**Estado: HECHO; PENDIENTE QA humana.** Tarjetas sin interruptor propio; solo título y estado sutil de lectura (aria-describedby + role=status). Riel/menú conserva activación, guardado, rollback y Reserva bloqueada. Campos ocultos permanecen montados sin perder datos; no se toca API/schema/ficha. Tests adaptados para ausencia de duplicados, expansión/contracción y operación desde riel. TypeScript limpio y lint 0 errores/5 warnings preexistentes. QA Emma: 1440/375px, es/en/fr, temas, Tab/Enter/Espacio y anuncio de estado con lector.

Validación offline: **53/53 tests pasan**, incluida la cobertura de riel único; sin navegador ni capturas automáticas.

## Orden modular con Reserva al final — 19 Oct 2026

**Estado: HECHO en código; PENDIENTE SQL manual y QA humana.**
- Columna nullable `Property.sectionsOrder`, independiente de activación; SQL propuesto `scripts/sql/property-sections-order.sql`, no ejecutado. Emma: Respaldo → pruebas → main antes del deploy. Sin UPDATE de datos; propiedades sin personalización conservan composición/orden previos.
- Riel y tarjetas comparten orden: drag/drop nativo y botones subir/bajar con etiquetas es/en/fr, autosave optimista y rollback. Reserva bloqueada al final, sin arrastre/flechas. Servidor rechaza cualquier orden incompleto/duplicado o Reserva fuera del final con 400 diagnosticable.
- Ficha: orden explícito compone módulos activos en secuencia real, con respaldo incluido; galería inicial y footer no entran en el orden. Mapa/Advertencias se separan si hay orden personalizado para poder moverlos de forma independiente; sin orden guardado mantienen la fila anterior. Zig-zag/reveal y lógica de reserva/contacto intactos; #reservar siempre al final.
- Nuevo test-section-order.cjs: defaults, persistencia, permisos, validación, render/anclas es/en/fr, botones/foco, drag/drop y fallos. Móvil: botones, sin prometer arrastre táctil. No se añade animación de movimiento; navegación existente respeta reduced-motion.
- QA Emma pendiente: arrastrar, recargar, verificar ficha/activación, Reserva y payload inválido; teclado/foco, 375px/1440px, es/en/fr y ambos temas. Decisiones e inventario en CONTEXTO.md. Sin navegador automatizado ni migración ejecutada.
- Validación offline: **54/54 tests pasan**, TypeScript web limpio y ESLint 0 errores/5 warnings preexistentes. DDL PostgreSQL, arrastre real y QA visual pendientes de Emma.

## Biblioteca de fotos con miniaturas — 19 Oct 2026

**Estado: HECHO en código; PENDIENTE QA humana.** Filas de URLs sustituidas por miniaturas cuadradas lazy con botones SVG de editar/quitar (44px), foco visible y acciones permanentes en touch. Alta por URL plegada y localizada es/en/fr; edición conserva URL/categoría/orden y borrado pide la confirmación existente. Subida/dropzone/compresión y tarifas sin cambios. Sin migraciones ni cambios de endpoints. Reordenado de miniaturas por arrastre queda fuera de esta fase.

Test nuevo test-photo-library.cjs: alta plegada, URL ausente del texto de biblioteca, edición con orden numérico, cancelación/confirmación de borrado, PATCH/DELETE existentes y tarifas sin plegar. QA Emma: grilla y acciones sobre fotos claras/oscuras; editar/guardar/quitar; alta URL; cola/dropzone; teclado; 1440/375px; es/en/fr y ambos temas.

Validación: **55/55 scripts test-*.cjs pasan**, TypeScript web limpio, pnpm lint 0 errores / 5 avisos preexistentes; git diff --check limpio. Sin consultas a BD real ni verificación de navegador. Categorías legacy sin etiqueta usan Fotos como alt accesible, sin cambiar sus datos.

## Módulos apagados solo en el riel — 19 Oct 2026

**Estado: HECHO en código; PENDIENTE QA humana.** Lista principal solo con activos, en orden persistido; línea es/en/fr con conteos de activos/apagados. Apagar no quita el módulo de sectionsOrder; reactivar restaura su puesto y borradores de textos/fotos. Riel conserva inventario y único interruptor; nombre apagado deshabilitado (alternativa accesible elegida), sin enlace muerto. Activación exitosa: realce breve y scroll nearest solo fuera de vista; sin robar foco; reduced-motion sin animación. Reserva permanece obligatoria. Sin cambios de API/persistencia/ficha ni SQL. Tests adaptados: ausencia DOM, conteos, Reserva sola, rollback, orden intacto, borradores, enlaces deshabilitados y desplazamiento condicionado.

QA Emma: apagar Amenidades y reactivar con borrador; confirmar posición entre vecinas y datos/fotos; varios toggles y conteos; todos opcionales off = solo Reserva; nombre apagado no navega, interruptor sí; 1440/375px, menú sticky, teclado, es/en/fr, ambos temas y reduced-motion.

Validación offline: **55/55 scripts pasan**, TypeScript web limpio, ESLint 0 errores y 5 avisos preexistentes. Sin navegador, capturas ni acceso a BD real.

## Campos de módulos reactivados — 19 Oct 2026

**Estado: ajuste defensivo HECHO; causa visual NO reproducida offline y QA humana PENDIENTE.** SectionForm usaba hidden={!enabled} además del filtro de activos de la lista. No existe estado expandido separado ni condición de datos. Prueba nueva ejecutando el formulario real pasa ANTES del ajuste: carga y reactivación ya producen campos visibles en el código actual; no se puede afirmar si el síntoma ocurre solo en caliente o también al recargar en el navegador afectado. Se elimina la segunda compuerta hidden en una línea para garantizar que una tarjeta montada siempre está desplegada. Sin cambios de riel, orden, guardado ni Mapa/Reserva informativos. Tests cubren textareas editables sin ancestro hidden, selector de fotos y borrador tras apagar/reactivar.

QA Emma: Amenidades apagar→reactivar con campos inmediatos; escribir/guardar/recargar; apagar→recargar→reactivar; repetir Destino/Habitaciones; Mapa/Reserva mantienen texto; teclado en interruptores; 375px, temas y reduced-motion. Si persiste, reportar nombre exacto del módulo y si falla también al recargar con él activo para distinguir código servido/estado del navegador del render probado.

Validación del ajuste: 55/55 scripts offline pasan; TypeScript web limpio; ESLint 0 errores / 5 avisos preexistentes. Incluye arranque con módulo apagado y activación sin recarga. No se ejecutó navegador; el resultado visual reportado por Emma sigue pendiente de confirmación.

## Shimmer de skeletons y fade de contenido — 19 Oct 2026

**Estado: HECHO en código; PENDIENTE QA humana.** Reutiliza PageLoading en sus tres variantes/rutas loading: shimmer diagonal por bloque 1.8s; elimina pulse. CSS Module compartido con fade 200ms ease-out en contenedores existentes de home/listado/ficha, excluyendo navbar/footer/botón ↑. Cero JS de animación, sin cambios de fetch/navegación ni geometría. Colores existentes con alpha; todas las animaciones dentro de no-preference, reduced-motion estático. Nueva prueba test-page-loading.cjs cubre SSR de variantes/bloques/ARIA, ausencia de pulse, tokens y restricciones de movimiento.

QA Emma: pnpm dev, navegar home→casas→ficha con Network Slow 3G y Disable cache; observar shimmer durante espera y fade al aparecer contenido; confirmar ausencia de saltos nuevos y que navbar/footer no animan; repetir es/en/fr, claro/oscuro, 1440/375px y emulación reduced-motion. Caché/prefetch pueden evitar que el skeleton aparezca; fade CSS también se aplica al montaje inicial aunque no se haya visto fallback. No se hicieron pruebas de navegador ni capturas automáticas.

Validación offline: **56/56 scripts pasan** (baseline 55 + nueva cobertura de carga); TypeScript web limpio; ESLint 0 errores / 5 avisos preexistentes; git diff --check limpio.

## Ajustes de tipografía y header — 20 Oct 2026

**Estado: Cinzel, menú, flechas y etiquetas HECHOS en código; QA humana PENDIENTE. Vilaka PENDIENTE de archivo/licencia web.** Cinzel variable local con licencia OFL: títulos h1–h6, body/captions/labels intactos. Logo con clase/token aislado para Vilaka y fallback actual, sin URL inexistente. El enlace DaFont aportado identifica demo solo uso personal; se solicitó archivo comercial/web autorizado. No se descarga demo ni se afirma Vilaka cargada.

Hamburguesa reemplaza avatar y conserva opciones por sesión; Destinos en details accesible lista catálogo existente y navega al filtro de ciudad. Menú max70dvh y controles44px. Galería: flechas SVG más largas, botones64×48 debajo de miniaturas; mismos handlers/lightbox. Tokens de contraste:10.01:1 claro/12.33:1 oscuro para flechas. Solo /casas pone en negrita Llegada/Salida/Huéspedes mediante prop opcional; resto de labels intacto. Tests ampliados navbar, public-chrome y búsqueda; fuentes comprobadas como archivo TrueType válido/licencia y ruta pública existente, sin validación de navegador ni HTTP local.

QA Emma: home,/casas,ficha en es/en/fr,1440/375px y temas; comprobar títulos Cinzel/cuerpo intacto, menúhamburguesa usable con teclado/Escape/clic fuera/con y sin sesión, destinos Nuevo Vallarta/Guadalajara filtran listado, flechas franja+lightbox, tres labelsbold y otros sin cambio, Network fuente200 y sin404. Contraste sobre video/fotos requiere revisión humana con contenido real.

Validación: **56/56 scripts offline pasan**, TypeScript web limpio y pnpm lint 0 errores / 5 warnings preexistentes. Sin navegador ni capturas; Vilaka sigue pendiente de archivo autorizado.

## Logo definitivo en Marcellus (OFL) — 20 Oct 2026

**Estado: HECHO en código; PENDIENTE QA humana/aceptación de clienta.** Sustituye el pendiente Vilaka por Marcellus400 mediante next/font/google, latin, swap y variable aislada al wordmark. Solo logo: Cinzel/títulos/body/labels intactos. SVG A-F conserva sus paths; footer Portal Casas no replica Alia, intacto. Shortlist/documentación en CONTEXTO: descartadas Cormorant Garamond y Playfair Display SC por menor firmeza/contraste de trazo para este uso. Licencia OFL verificada en repositorio oficial Google Fonts.

Loader real Next en modo producción verificado en memoria:2 WOFF2,22932bytes(total),14272bytes latin con preload; CSS reescrito a rutas locales sin HTTP externo. Sin build, navegador ni BD. Certificados locales Node requieren --use-system-ca para esta prueba; TLS sigue activo. Contraste chrome mínimo5.51:1 claro/7.89:1 oscuro en FOR; modelo conservador del scrim de hero5.41:1, pendiente confirmar dimensiones/fotogramas en QA.

QA Emma: pnpm dev (si Node local falla con certificados, iniciarlo con NODE_OPTIONS=--use-system-ca); home tope navbar transparente y después mate, /casas y ficha; es/en/fr,1440/375px, temas; wordmark legible/sin empujar controles, monograma sin cambio; DevTools Network Fonts muestra archivos /_next/static/media/ y ninguna petición runtime a fonts.googleapis.com/fonts.gstatic.com. Confirmar fuente Marcellus en Computed del wordmark y Cinzel en títulos; contenido/footer sin cambio.

Validación final: **56/56 scripts offline pasan**; TypeScript web limpio; ESLint 0 errores / 5 warnings preexistentes; diff sin errores de whitespace. Tests ajustados para transformación next/font en navbar/home/SEO, sin quitar aserciones de negocio; loader real comprobado separadamente con descarga y emisión en memoria.

## Menú de destinos dinámico — 20 Oct 2026

**Estado: HECHO en código; PENDIENTE QA humana.** Diagnóstico: menú recorría catálogo SECTUR completo en Navbar; título localizado existente, enlaces /casas?state&destinationCity. Sustituido por props del layout servidor desde una consulta published=true agrupada, solo pares válidos completos, orden alfabético español por estado/ciudad. Sin ciudades legacy ni borradores; sin duplicados; grupo vacío oculto. Catálogo y claves i18n conservados, sin rutas nuevas ni fetch cliente.

React.cache deduplica solo durante render; destinos y SiteContent consultados en paralelo. PATCH publicación/state/destinationCity invalida layout /[locale], sin alterar permisos/validaciones ni otros guardados. Panel→publicar/despublicar→recargar vista pública refleja menú sin redeploy; pestañas ya abiertas no se sincronizan solas. SQL externo sin invalidación no forma parte de esta garantía. Nuevo test SQL/SSR/invalidation + test-navbar adaptado al array servidor. Sin cambios de fuentes/galería/buscador ni CSS.

QA Emma (Respaldo): publicar propiedad válida en destino sin otras publicadas, recargar home y abrir menú; comprobar estado/ciudad; enlace lleva a listado filtrado. Despublicar última propiedad, recargar, destino desaparece; si queda otra publicada debe permanecer. Todas sin destinos válidos: grupo oculto, opciones cuenta/tema intactas. Repetir es/en/fr,1440/375px, temas y teclado/cierre/scroll del menú. Sin navegador ni consultas Neon desde el agente.

Validación: **57/57 scripts offline pasan** (56 previos + destinos publicados), TypeScript web limpio, ESLint 0 errores / 5 avisos preexistentes; git diff --check limpio.

## Buscador con destinos publicados — 20 Oct 2026

**Estado: HECHO en código; PENDIENTE QA humana.** Selects de lupa y /casas consumen la misma lista servidor del menú. Navbar pasa prop existente; listado usa readPublishedDestinations (React.cache por render con layout) junto a SiteContent en paralelo. Sin consulta por apertura del buscador, sin duplicar agrupación ni catálogo. Orden alfabético y dependencia Estado→Ciudad intactos; Todos/Todas y estilos/fechas/huéspedes sin cambios. Catálogo completo conservado, recorrido descontinuado en opciones públicas y reversible en PropertySearchForm.

URL con destino válido sin publicadas: conserva opción activa en ambos selects hasta cambiarla; devuelve vacío habitual. Sin destinos/filtros: solo Todos/Todas y resto del buscador funcional. Validación de parejas no cambia. Tests ampliados de publicados y búsqueda: SSR es/en/fr de ambos usos, sin opciones de destinos vacíos, URL de estado y ciudad sin publicadas, caso ciudad retirada bajo estado aún publicado, vacío y handlers dependientes reales con hooks simulados.

QA Emma (Respaldo): lupa y /casas en es/en/fr,1440/375px,claro/oscuro; comparar opciones con menú; estado cambia y limpia ciudad; publicar/despublicar última propiedad de una ciudad, recargar y confirmar aparición/desaparición; URL /es/casas?state=Yucat%C3%A1n&destinationCity=M%C3%A9rida (si sin publicadas) conserva filtros y estado vacío; limpiar filtros vuelve a Todos/Todas. Sin publicados siguen fechas/huéspedes; sin navegador automatizado.

Validación: **57/57 scripts offline pasan**, TypeScript web limpio, ESLint 0 errores / 5 avisos preexistentes; diff sin errores de whitespace.

## Flechas de galería en móvil — 20 Oct 2026

**Estado: HECHO en código; PENDIENTE QA humana.** Causa: controls estaba después de strip en flujo normal a todos los tamaños, no había breakpoint causante. CSS bajo1024px coloca visualmente hero→controls centrados→strip, con8px antes de controles; reglas desktop intactas. Sin cambios React/JS, lightbox, traducciones, tamaños de miniaturas ni animaciones. Targets64×48 y contraste/foco previos conservados. Orden DOM de teclado permanece igual; confirmar recorrido usable en QA.

Tests de galería ampliados para CSS375/768/1440, controles junto al hero, desktop sin display nuevo, y scrollBy/reduced-motion; mantienen cobertura lightbox/teclado/share. QA Emma: pnpm dev, ficha con>3 fotos; DevTools375 y768: flechas centradas inmediatamente bajo foto antes de miniaturas, sin hueco largo;1440 idéntico al previo. Clic/Enter/Espacio en flechas, miniaturas cambian principal, swipe de franja, abrir/cerrar lightbox y flechas de teclado; claro/oscuro y es/en/fr; reduced-motion. Sin navegador ni capturas automatizadas.

Validación final: **57/57 scripts offline pasan**, TypeScript web limpio, ESLint0 errores/5 avisos preexistentes y git diff --check limpio.

## Lightbox móvil sin desplazamiento para navegar — 20 Oct 2026

**Estado: HECHO en código; PENDIENTE QA humana.** Se diagnosticó dialog100dvh flex-col con navegación final y límite porcentual max-h-full en zona flex, sin reserva grid explícita ni contención de overflow. No se afirmó medición de exceso real del navegador de Emma. Ajuste localizado: dos clases en lightbox/media y CSS solo<1024px con filas auto/minmax(0,1fr)/auto; viewport dinámico, safe-area y medio contain ajustado al hueco. Navegación inferior visible sin overlay nuevo; botones44px, aria, handlers, foco, Escape/clic fuera y reduced-motion conservados. Desktop y galería inline intactos.

Tests de galería ampliados: estilos375/768, imagen limitada, cabecera/controles reservados, desktop sin override; cierre/cancel y clic fuera devuelven foco con refs persistentes; cobertura previa mantenida. QA Emma: pnpm dev→ficha→foto principal; a375/768 abrir imagen vertical alta y horizontal, verificar imagen completa/contain y botones sin scroll, recorrer todas; safe-area/barra móvil real si posible. Escape/clic fuera/foco/Tab/flechas de teclado; temas,es/en/fr;1440 sin cambio. Sin navegador ni capturas automáticas del agente.

Validación: **57/57 scripts offline pasan**, TypeScript web limpio, ESLint0 errores/5 avisos preexistentes y diff sin errores de whitespace.

## Home: título de marca en segunda línea — 20 Oct 2026

**Estado: HECHO en código; PENDIENTE QA humana.** Diagnóstico: texto de diccionarios home.propiedadesEnRenta, no contenido editable ni BD. H2 del hero usa nueva home.heroBrand = ALIA FORRENT en es/en/fr. Primera bienvenida intacta; clave/textos anteriores conservados como descontinuados en UI y restaurables cambiando la clave del h2. Sin cambios de layout/estilos/reveal/banderas, navbar ni otros textos. Test-home-composition verifica bienvenida por idioma, nueva marca en h2 y ausencia del texto anterior en el hero, conservando su clave.

QA Emma: pnpm dev→/es,/en,/fr; segunda línea ALIA FORRENT y primera bienvenida localizada;1440/375px,claro/oscuro; navbar transparente legible, reveal y resto del hero intactos. Sin navegador ni consultas Neon.

Validación: **57/57 scripts offline pasan**, TypeScript web limpio, ESLint0 errores/5 avisos preexistentes; git diff --check limpio.
