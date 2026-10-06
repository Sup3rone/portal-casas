# Reserva en móvil

## Auditoría antes de modificar CSS — 5 octubre 2026

Página local: `/es/casas/arian-ocean-vallarta` y su variante `/en`.
Se usó el navegador Chromium integrado con viewport 375×667 (dimensiones
de iPhone SE) y 360px de ancho (Android), además de 768px y 1440px.
Es una comprobación de viewport; no sustituye Safari/iOS ni emula su selector
nativo de fechas o un dispositivo táctil real.

- Cabecera: sus enlaces no se envolvían. El ancho desplazable alcanzaba
  524px en español y 491px en inglés, provocando scroll horizontal.
- Calendario: celdas de 32,86px a 360px y 35px a 375px; flechas de mes
  de aproximadamente 38×40px, por debajo de los objetivos táctiles.
- Formulario: inputs de 33px de alto. El padding acumulado dejaba solo
  222px de ancho a 360px y 237px a 375px.
- Los paneles ya estaban apilados con el calendario primero. La leyenda
  se veía completa; no se observaron superposiciones ni textos truncados
  en los paneles de reserva.
- A 768px no había scroll horizontal, pero los inputs seguían en 33px.

## Cambio

Solo CSS en `apps/web/src/app/globals.css`, usando espaciado Tailwind existente.
No se modificaron componentes, lógica, colores, glass, backend ni validación.

- Bajo md (48rem/768px): paddings laterales de reserva de 12px, panel del
  calendario de 8px y panel del formulario de 12px; la cabecera permite
  envolver sus filas, exclusivamente cuando la página contiene `#reservar`.
- Bajo lg (64rem/1024px): celdas de fecha con altura mínima de 40px,
  flechas de 44×44px e inputs/textarea con altura mínima de 44px. Se conserva
  el ancho completo de los campos y del botón de envío existentes.
- La leyenda puede envolver y los errores largos pueden partir palabras.
- Desde lg: no aplica ningún ajuste; se conserva el layout de desktop.
- No se encontró soporte existente de safe-area/viewport-fit; no se cambió
  esa configuración en esta tarea.

## Verificación realizada

En es/en se midió el ancho desplazable del documento en 360, 375, 640, 767,
768, 1023, 1024 y 1440px: sin scroll horizontal en esos tamaños.
El navegador tiene una scrollbar de 10px: el área útil es 350px a viewport
360px, y 365px a viewport 375px.

| Viewport | Celda calendario | Input | Resultado |
| --- | --- | --- | --- |
| 360px | 40,86×40,86px | 270×44px | Sin overflow; leyenda visible |
| 375px | 43×43px | 285×44px | Sin overflow; leyenda visible |
| 768px | 91,14×91,14px | 199,33×44px (nombre) | Paneles apilados |
| 1440px | 69,70×69,70px | 149,33×33px (nombre) | Desktop conservado |

Se compararon posiciones, dimensiones, padding, tipografía, display y gap
de cabecera, paneles, calendario y formulario antes/después a 1440×1000px
en español, con formulario vacío: idénticos.
En inglés a 360px y español a 375px se seleccionaron fechas disponibles:
llegada/salida se rellenaron, el rango quedó resaltado y, al completar nombre,
email y mensaje válidos, el botón de envío se habilitó.
No se guardó una consulta real durante esta comprobación de estilos.

## Prueba manual completa

1. Desde la raíz, `pnpm dev`.
2. Abrir una casa publicada en `/es/casas/<slug>` y `/en/casas/<slug>`.
3. En DevTools activar Device Toolbar, escala 100%, probar 360, 375, 768
   y 1440px, y activar emulación táctil en los tamaños móviles.
4. Revisar la página completa, incluida la cabecera: no debe haber scroll
   horizontal; calendario arriba del formulario hasta el breakpoint lg.
5. Tocar una fecha disponible y otra posterior: comprobar rango resaltado,
   llegada/salida, leyenda completa y flechas fáciles de pulsar.
6. Completar nombre, email, teléfono opcional, huéspedes y mensaje. Verificar
   campos/botón dentro del panel y errores inline legibles al introducir datos
   inválidos. Editar fechas manualmente y comprobar la sincronía existente.
7. En el entorno local de pruebas, enviar la consulta y comprobar respuesta
   201 y confirmación visible. Este envío real queda pendiente de comprobación.
8. A 1440px confirmar los dos paneles y su apariencia habitual.
9. Completar en un iPhone real la comprobación del selector de fecha, teclado
   y zonas seguras de iOS.

## Supuestos y notas

- Se respetan los breakpoints Tailwind existentes: md=768px y lg=1024px.
- Los problemas del footer que apuntaba a `/es/casas` y los dots recortados
  con 55 imágenes se resolvieron posteriormente en el lote de limpieza
  (05 Oct 2026). Ver `docs/LIMPIEZA-MENOR.md`.
