# Modo oscuro — implementación en Respaldo

## Funcionamiento

- Rama Git de trabajo: Respaldo, creada desde el checkout actual porque solo
  existían main y feature/i18n. No se hicieron push, despliegues ni operaciones
  sobre Neon. La configuración de BD se conserva. PROGRESO.md ya tenía cambios
  del usuario antes de esta tarea y se conserva esa edición.
- Tailwind CSS 4: custom-variant dark por clase en globals.css. Las variantes
  no siguen prefers-color-scheme. El SSR conserva html.dark; el bootstrap aplica light por defecto al inicializar.
- ThemeToggle está junto al selector de idioma en Navbar, con icono de sol/luna
  y nombres de acción localizados en es/en/fr. Botón nativo de 44px que funciona
  también con teclado. El header permite wrapping móvil para mantenerlo visible.
- Clases light y dark son exclusivas: cada cambio elimina ambas y añade la elegida.
  No se eliminan otras clases del html. Se guarda portal-casas-theme en localStorage.
- theme-init.js lee la preferencia al cargar como recurso local async de prioridad
  alta. React 19 gestiona/deduplica el recurso de script entre navegaciones.
  useLayoutEffect en ThemeToggle restaura la preferencia cuando el layout de otro
  locale vuelve a aplicar su clase SSR; el tema se sincroniza antes del siguiente
  pintado de React. useSyncExternalStore mantiene el botón alineado con el html.
- Sin preferencia o con valor inválido: light. Si el navegador bloquea localStorage,
  el toggle sigue funcionando, pero la elección no puede persistir y la siguiente
  carga vuelve a light. No se añaden cookies ni preferencias en la BD.
- color-scheme adapta controles nativos; fondo/texto usan variables de la paleta
  Tailwind. Se mantiene la gama gris, verde, púrpura y los colores de estados.
- Las modificaciones de componentes/páginas existentes son de clases de color,
  excepto integrar ThemeToggle, script y wrapping del header. Se comprobó que
  la pasada de variantes conserva el AST al retirar las clases dark añadidas.
  No se cambiaron lógica de datos, validación, calendario, permisos ni animaciones.

## Inventario — una línea por archivo

Los paths de la siguiente tabla son relativos a la raíz del repositorio.

| Archivo | Cambio |
| --- | --- |
| apps/web/src/lib/theme.ts | Lectura, aplicación, persistencia y suscripción del tema |
| apps/web/public/theme-init.js | Bootstrap local, claro inicial y preferencia guardada |
| apps/web/src/components/ThemeToggle.tsx | Botón nuevo, iconos y sincronización al cambiar locale |
| apps/web/src/app/[locale]/layout.tsx | Clase SSR dark y recurso de inicialización |
| apps/web/src/app/globals.css | Estrategia dark por clase, variables, glass y scrollbar |
| apps/web/messages/es.json | Acciones del toggle en español |
| apps/web/messages/en.json | Acciones del toggle en inglés |
| apps/web/messages/fr.json | Acciones del toggle en francés |
| apps/web/src/components/Navbar.tsx | Integrar toggle, wrapping móvil y colores del header/CTAs |
| apps/web/src/components/Footer.tsx | Fondo, bordes y textos oscuros |
| apps/web/src/components/LocaleSwitcher.tsx | Colores del selector y dropdown |
| apps/web/src/components/PropertyCard.tsx | Superficie oscura, bordes y textos de cards |
| apps/web/src/components/MessageForm.tsx | Inputs, labels, errores, CTA y panel de consulta |
| apps/web/src/components/MessageModal.tsx | Colores de modal, inputs, botones y overlay |
| apps/web/src/components/MensajesList.tsx | Cards administrativas, textos y estados |
| apps/web/src/components/MarkAsReadButton.tsx | Colores del botón/estado leído |
| apps/web/src/components/AvailabilityCalendar.tsx | Colores de días, leyenda y controles; selección intacta |
| apps/web/src/components/CalendarBoard.tsx | Superficies, textos y controles del calendario administrativo |
| apps/web/src/components/CategorySection.tsx | Glass, textos y separadores de categorías |
| apps/web/src/components/CategoryGrid.tsx | Widgets y modal de categorías |
| apps/web/src/components/LocationMap.tsx | Borde y tarjeta de dirección bajo el mapa |
| apps/web/src/components/PropertyShareButton.tsx | Colores del botón y feedback de compartir |
| apps/web/src/components/PropertyGallery.tsx | Superficies de miniaturas y colores del lightbox |
| apps/web/src/components/SectionSlider.tsx | Fondos de controles y textos de galerías compartidas |
| apps/web/src/components/PageLoading.tsx | Colores de skeletons; animación anterior intacta |
| apps/web/src/components/panel/request.ts | Variantes de las constantes inputClass/buttonClass; fetch intacto |
| apps/web/src/components/panel/PropertyForm.tsx | Superficie del formulario y textos auxiliares |
| apps/web/src/components/panel/ResourceEditor.tsx | Editor de tarifas/media y acciones |
| apps/web/src/components/panel/AvailabilityEditor.tsx | Tarjetas de bloqueos y acciones |
| apps/web/src/components/panel/Inquiries.tsx | Tarjetas de consultas y estados |
| apps/web/src/app/[locale]/page.tsx | Widget de búsqueda, labels, inputs, overlay y CTA |
| apps/web/src/app/[locale]/casas/page.tsx | Overlay y badge del listado |
| apps/web/src/app/[locale]/casas/[slug]/page.tsx | Fondo, glass, títulos, textos y separadores del detalle |
| apps/web/src/app/[locale]/login/page.tsx | Formulario de acceso y textos |
| apps/web/src/app/[locale]/registro/page.tsx | Formulario de registro y textos |
| apps/web/src/app/[locale]/olvide-password/page.tsx | Formulario de recuperación y feedback |
| apps/web/src/app/[locale]/reset-password/page.tsx | Formulario de nueva contraseña y feedback |
| apps/web/src/app/[locale]/mi-cuenta/page.tsx | Superficies, textos y estados del historial |
| apps/web/src/app/[locale]/panel/layout.tsx | Bordes y enlaces del panel |
| apps/web/src/app/[locale]/panel/page.tsx | Cards de propiedades y acciones |
| apps/web/src/app/[locale]/panel/consultas/page.tsx | Cards de reservas |
| apps/web/src/app/[locale]/panel/propiedades/[id]/page.tsx | Enlace de retorno del editor |
| apps/web/src/app/[locale]/admin/tarifas/page.tsx | Cards y textos de tarifas |
| apps/web/src/app/[locale]/admin/tarifas/components.tsx | Inputs y botones de tarifas |
| scripts/test-theme.cjs | Bootstrap, persistencia, defaults, storage bloqueado y SSR es/en/fr |
| docs/CONTEXTO.md | Convención de temas y referencias |
| docs/MODO-OSCURO.md | Inventario, decisiones, pruebas y notas |

## Verificación realizada

- Node: test-theme, test-inquiry, test-gallery-share, test-panel-render y
  test-property-access pasan. Todo usa DOM/storage simulados o SQL en memoria,
  sin red ni BD real.
- TypeScript --noEmit --incremental false: pasa.
- ESLint en nueva lógica y layout: sin errores, una advertencia ya existente
  por messages sin usar en layout. Comparación de los 37 archivos existentes
  modificados con HEAD: 4 errores/7 warnings antes y después; ninguna incidencia
  nueva. Causas preexistentes detalladas abajo.
- Navegador local: primera carga observada en oscuro en la implementación original (default actualizado a claro); alternancia de clases y
  color-scheme; colores reales de Navbar, Footer, glass e inputs de home/login.
  Claro y oscuro se conservan al recargar; claro se conserva al cambiar de es
  a en y fr. Toggle por Enter funciona. Control visible a 360px. Navegación
  final sin errores nuevos de consola. No se inició sesión ni se enviaron forms.
- Cards, modales y áreas privadas: variantes revisadas en código y regresiones
  SSR/permisos; auditoría visual completa en Respaldo queda en checklist manual.

## Cómo probar

Desde la raíz:

```powershell
git branch --show-current
pnpm dev
```

Debe indicar Respaldo antes de trabajar. Las pruebas sin red:

```powershell
node scripts/test-theme.cjs
node scripts/test-inquiry.cjs
node scripts/test-gallery-share.cjs
node scripts/test-panel-render.cjs
node scripts/test-property-access.cjs
```

1. Abrir localhost en un perfil sin preferencia de tema: html debe tener light tras la inicialización.
   Para repetir solo esa primera carga, quitar únicamente portal-casas-theme
   desde Application → Local Storage de DevTools; conservar el resto del storage.
2. Pulsar luna junto al selector de idioma: html pasa a dark, sin light. Recargar
   y confirmar dark. Pulsar sol: vuelve a light y persiste tras recargar.
3. Revisar la clave portal-casas-theme en DevTools y cambiar es/en/fr: conservar
   tema y localizar tooltip/aria-label. Probar el botón con Tab y Enter/Espacio.
4. A 360px y desktop comprobar el control visible. Revisar Navbar/Footer, búsqueda,
   listado/cards, detalle/glass, consulta, calendario, lightbox y formularios de
   login/registro en ambas variantes, sin enviar datos solo para probar colores.
5. En el entorno configurado para Neon Respaldo, con usuarios existentes, revisar
   panel, cards, tarifas, disponibilidad y consultas/modal en ambos temas. No
   modificar registros, main de Neon ni desplegar en Vercel durante esta prueba.

## Supuestos y notas fuera de alcance

- Preferencia local al navegador/origen, compartida por todos los locales; no
  vinculada a cuentas. No se sigue automáticamente el tema del sistema ni se
  sincronizan en vivo otras pestañas (al recargar leen la preferencia guardada).
- Google Maps en iframe conserva el tema de su proveedor; solo se tematizan
  su contenedor, dirección y botón de compartir.
- ESLint previo: mi-cuenta/page.tsx:86 mantiene enlace HTML a /es/casas, con tres
  reportes de no-html-link-for-pages; MessageModal.tsx:57 mantiene setState en
  un efecto. No se cambian navegación ni lógica para resolverlos en este alcance.
- Accesibilidad previa: MessageModal/CategoryGrid no tienen el mismo manejo de
  foco/semántica de dialog que el lightbox nuevo; menú ADMIN depende de hover.
  Se documentan, sin modificar comportamiento ni efectuar una auditoría WCAG.
- Animaciones previas: video autoplay de home y skeleton animate-pulse se
  conservan. PROGRESO.md menciona shimmer en su resumen, mientras el componente
  actual utiliza pulse; no se cambia esa animación ni el resumen del usuario.
- La advertencia de scroll-behavior smooth sin data-scroll-behavior en html es
  preexistente; no se alteran transiciones de navegación en esta tarea.
