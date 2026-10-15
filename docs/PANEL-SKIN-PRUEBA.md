# Prueba reversible del skin del panel — 2026-10-15

Referencia: rasgos parciales aportados por la clienta (pastillas lavanda y superficies limpias); no réplica exacta de perpendicular.mx.

## Cambios y reversión

Todos los tokens están en `apps/web/src/app/panel-skin.css`. No se modificaron datos, rutas, menús, orden, acciones ni permisos. No se cambiaron grids, flex, márgenes ni padding de las vistas. El layout del panel solo añade una clase; el layout admin usa un envoltorio `display: contents` sin caja visual, sin mover sus hijos. Las celdas con aria-pressed conservan sus estados de calendario. Los controles de selección mantienen su semántica nativa con accent-color.

**Revertir en una línea:** comentar `@import "./panel-skin.css";` en `apps/web/src/app/globals.css`. Las clases restantes son inertes. Para ajustar el look sin desactivarlo, editar únicamente los tokens de la hoja del skin.

## Verificación

TypeScript limpio; ESLint 0 errores (5 warnings preexistentes). Tests `test-panel-skin.cjs`, `test-panel-render.cjs`, `test-panel-inquiries.cjs` y `test-manager-messages-rates.cjs` pasan.

Contraste de texto/fondo verificado sobre tokens: mínimo 6.03:1 en claro y 8.78:1 en oscuro, incluidas acciones destructivas y selección. Botones medidos en navegador: 44px de alto. Las 12 combinaciones de vista/tema/ancho mantienen el mismo orden de encabezados, enlaces, tarjetas, campos y botones antes/después, sin overflow horizontal. Se mantienen los espaciados existentes; únicamente los controles menores a 44px pueden aumentar su altura.

Capturas: componentes y páginas reales renderizados con datos ficticios en SQLite en memoria, sin Neon ni sesiones reales. Las capturas son de presentación; no ejecutan operaciones de negocio.

## Capturas antes/después

| Vista | Tema | Ancho | Antes | Después |
|---|---|---|---|---|
| consultas | Claro | 1440px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-before-consultas-light-1440.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-after-consultas-light-1440.png) |
| consultas | Claro | 375px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-before-consultas-light-375.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-after-consultas-light-375.png) |
| consultas | Oscuro | 1440px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-before-consultas-dark-1440.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-after-consultas-dark-1440.png) |
| consultas | Oscuro | 375px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-before-consultas-dark-375.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-after-consultas-dark-375.png) |
| propiedades | Claro | 1440px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-before-propiedades-light-1440.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-after-propiedades-light-1440.png) |
| propiedades | Claro | 375px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-before-propiedades-light-375.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-after-propiedades-light-375.png) |
| propiedades | Oscuro | 1440px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-before-propiedades-dark-1440.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-after-propiedades-dark-1440.png) |
| propiedades | Oscuro | 375px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-before-propiedades-dark-375.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-after-propiedades-dark-375.png) |
| tarifas | Claro | 1440px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-before-tarifas-light-1440.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-after-tarifas-light-1440.png) |
| tarifas | Claro | 375px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-before-tarifas-light-375.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-after-tarifas-light-375.png) |
| tarifas | Oscuro | 1440px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-before-tarifas-dark-1440.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-after-tarifas-dark-1440.png) |
| tarifas | Oscuro | 375px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-before-tarifas-dark-375.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/skin-after-tarifas-dark-375.png) |

## Checklist en la aplicación

1. Abrir consultas, propiedades y tarifas en claro y oscuro, a 1440px y 375px. Comparar tarjetas, botones y filtros con las capturas.
2. Recorrer con Tab: foco violeta visible; seleccionar filtros y abrir una consulta sin cambios de comportamiento.
3. Confirmar que Eliminar conserva tono de advertencia, y los estados del calendario siguen diferenciados.
4. Comentar el import del skin y refrescar: reaparece el aspecto anterior sin cambiar componentes ni datos.

## Supuestos

Se conservan la tipografía y los espaciados actuales. Modo oscuro adapta la paleta a ciruela sin forzar superficies blancas. El skin es una prueba pendiente de aprobación estética de la clienta; no se hizo deploy.
