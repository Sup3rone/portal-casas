# Detalle continuo full-screen por scroll

Implementación vigente del 08 Oct 2026. No hay avance por tiempo en EditorialPresentation. QA visual manual pendiente para Emma; no se inició navegador automatizado, no se conectó con Neon ni se ejecutaron migraciones/deploy.

## Blueprint y archivos

1. Mosaico PropertyGallery, título, dirección/datos y compartir. Descripción general y fallbacks se integran en esta pantalla para conservar contenido sin agregar paradas snap; puede extenderse si no cabe.
2. Destino editorial.
3. Amenidades editorial.
4. Habitaciones editorial.
5. Lugar editorial.
6. LocationMap + advertencias existentes (solo cuando hay mapa o advertencias).
7. Reserva: ReservationDatesProvider + AvailabilityCalendar + MessageForm + WhatsApp debajo del submit.

Footer después de reserva, en el área snap final alta, sin parada propia ni duplicación. Las cuatro editoriales mantienen sus condiciones de datos: filas vacías se omiten y una casa sin ellas no muestra pantallas falsas. Galería/lightbox conserva colección principal y límite de ocho como antes; sin fotos los demás datos/flujo permanecen accesibles.

page.tsx solo reubica complementos dentro de P1 y conserva los componentes. globals.css aplica y mandatory al documento únicamente cuando existe .property-detail, secciones de min-height 100dvh y stage/puntos editoriales de 100dvh. No hay overflow que corte las secciones largas; los cuadros editoriales conservan su scroll interno original. Navbar y ↑ mantienen PropertyDetailScroll sin cambios en este ajuste: transición 300ms, oculta al bajar, visible al subir/inicio/foco, reduced-motion visible; ↑ smooth o auto según preferencia, safe-area/VisualViewport.

## Excepción editorial autorizada

Se cambia exclusivamente la fuente de avance de EditorialPresentation.tsx: no setInterval/setTimeout ni alternancia automática al esperar. Los fondos ya avanzaban con editorialProgress según window.scroll; ese fundido se conserva. Las fotos del cuadro ahora usan el progreso local del bloque: primera foto inicialmente, fundido a la segunda entre 25% y 75% del recorrido; al retroceder se revierte. Con una foto permanece fija. Reduced-motion hace el cambio de foto discreto. Las flechas del teclado sobre el cuadro desplazan el documento, no un índice independiente; swipe vertical nativo. Textos, fondos, cuadros glass, tipografías y EditorialPresentation.module.css permanecen intactos. Esta excepción no autoriza futuros cambios de contenido/estilo interno.

## Validación offline

22 scripts scripts/test-*.cjs pasaron sin red/BD real; TypeScript --noEmit --incremental false limpio; pnpm lint: 0 errores/8 warnings heredados. test-detail-scroll ejecuta el efecto editorial con scroll/DOM simulados, comprueba avance/retroceso/fotos/reduced-motion, ausencia de timers, fondos/narrativa y CSS protegidos, orden, navbar/footer/reserva/idiomas y caso sin fotos/editoriales. test-editorial-presentation conserva utilidades/SSR y prueba los fallbacks dentro de P1. Estos resultados no sustituyen la verificación visual del snap/fundido/teclado móvil.

```powershell
pnpm dev
# Otra terminal, raíz del repo:
node scripts/test-detail-scroll.cjs
node scripts/test-editorial-presentation.cjs
node scripts/test-gallery-share.cjs
node scripts/test-inquiry.cjs
pnpm lint
# Desde apps/web:
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

## Checklist visual manual para Emma

1. Preparar una propiedad QA con cuatro editoriales, fondos hero, dos PHOTO seleccionadas por sección, narrativas es/en/fr, coordenadas, advertencias y WhatsApp. Preparar otra sin editoriales/fotos. Usar el editor/datos de QA existentes, sin alterar producción para esta prueba.
2. PANTALLA 1, 1440px: abrir /es/casas/<slug> y hard refresh. Ver mosaico en sección de al menos una pantalla, título/datos/dirección y compartir. Descripción/fallbacks accesibles dentro de P1, sin pantallas independientes. Abrir lightbox, navegar y cerrar con Escape/X/exterior; colección/límite original intactos y scroll restaurado al cerrar.
3. PANTALLA 2, DESTINO: bajar lentamente hasta el primer bloque. Ver hero a pantalla completa, fotos glass izquierda y narrativa derecha. Esperar 10 segundos SIN scroll: no debe cambiar ninguna foto ni avanzar sección. Continuar desplazando dentro del recorrido: la segunda foto entra suavemente. Retroceder: vuelve la primera.
4. PANTALLA 3, AMENIDADES: avanzar con scroll; fondo de destino funde hacia amenidades como antes. Debe existir una parada al inicio de este bloque, con sus fotos/narrativa intactas; no saltar directamente al mapa. Esperar no causa cambios.
5. PANTALLA 4, HABITACIONES: repetir avance/fundido y comprobar fotos/texto correctos. Con Tab enfocar el cuadro y usar flechas izquierda/derecha: se desplaza el documento, no cambia una foto automáticamente sin scroll.
6. PANTALLA 5, LUGAR: comprobar fondo/cuadros y ausencia de autoplay. Retroceder por las cuatro editoriales: el avance/fundido responde en sentido inverso sin reinicios por tiempo. Sección con una sola foto mantiene esa imagen.
7. PANTALLA 6, MAPA + NOTAS: un solo mapa en coordenadas correctas y advertencias localizadas/hero si existen. No se inventan notas. Casa sin mapa ni advertencias omite esta pantalla. Estilos originales legibles, sin bordes añadidos ni separadores de diseño.
8. PANTALLA 7, RESERVA: calendario/formulario originales y WhatsApp inmediatamente debajo de submit si hay número. Seleccionar llegada/salida, comprobar sincronía/precio, editar fechas a mano y comprobar calendario; días ocupados/inputs inválidos siguen rechazados. Enviar únicamente consulta de prueba en entorno autorizado.
9. Bajar un poco más: descubrir TODO el footer, sin parada propia ni segunda copia. ↑ desde cada pantalla y footer vuelve al comienzo. Navbar oculta al bajar y reaparece al subir; visible/translúcida al inicio y visible al recibir foco. CTA Reservar desktop y ↑ no se solapan; #reservar funciona. Salir a /casas restaura navbar/footer/scroll normales.
10. Repetir 375px y 360px, luego 768px: fotos arriba/texto abajo; no scroll horizontal; se puede recorrer TODO contenido largo de P1, textos editoriales, mapa y formulario. Swipe vertical permite avanzar; probar teclado móvil en cada campo, giro del dispositivo y confirmar que ↑ no tapa inputs/submit/WhatsApp.
11. Repetir /en/casas/<slug> y /fr/casas/<slug>, en claro/oscuro. Ver títulos, narrativas, reserva, labels de ↑ y mensajes WhatsApp traducidos, glass/textos legibles. Solo aparecen editoriales con contenido del idioma activo o hero como antes.
12. DevTools → Rendering → Emulate CSS prefers-reduced-motion: reduce. Reveal inmediato, navbar visible, fondos/fotos sin animación obligatoria; snap, teclado, #reservar y ↑ funcionan. Cambiar esa preferencia estando a mitad del editorial y repetir.
13. Casa SIN editoriales/fotos: no pantallas editoriales vacías ni errores; título, descripción, fallbacks y mapa cuando existe, reserva y footer accesibles. Probar también una sección cargada/fila vacía: solo la cargada aparece, sin diapositivas inventadas.
14. Registrar resultado por pantalla/tamaño/idioma. Cualquier salto que omita un bloque, contenido inaccesible o superposición móvil requiere corrección antes de aceptar QA visual. El snap y continuidad visual nativos quedan pendientes hasta esta revisión manual.

Supuestos: el blueprint de siete pantallas corresponde a una casa con cuatro editoriales y mapa/notas cargados; ausentes se omiten según lógica actual. La descripción general/fallbacks se conservan dentro de P1; si son largos P1 puede superar 100dvh. El cambio autorizado de autoplay a scroll abarca también las fotos del cuadro, ya que eran el único avance temporizado. No se inventan narrativas ni imágenes, no hay traducciones nuevas y no se modifican datos/panel/APIs.
