# Header/footer mates y buscador compacto — 2026-10-15

## Decisión visual

Tonos planos, sin textura adicional ni brillo: el papel de las páginas conserva su propia textura y el marco del sitio queda más sobrio. Tokens en `apps/web/src/app/public-chrome.css`.

| Token | Claro | Oscuro |
|---|---|---|
| --header-bg | #ECE7DF | #2C2823 |
| --footer-bg | #E4DED4 | #201D19 |
| --chrome-text | #39342E | #F0EBE3 |
| --chrome-muted | #625A50 | #C6BDB1 |
| --search-surface | #F4F1EC | #302B25 |

Popover bajo la lupa: ancho 20rem (320px), máximo calc(100vw - 3rem), campos apilados. Medido en 375px: x=24, ancho=320, alto=326; campos y botón de 44px de alto, sin overflow horizontal. Se conserva max-height 70dvh y scroll interno si el teclado/viewport deja poco espacio. Los colores del botón Buscar no cambian.

## Contraste

| Texto/fondo | Claro | Oscuro |
|---|---|---|
| Principal/header | 10.01:1 | 12.33:1 |
| Secundario/header | 5.51:1 | 7.89:1 |
| Principal/footer | 9.21:1 | 14.14:1 |
| Secundario/footer | 5.07:1 | 9.04:1 |
| Etiquetas/buscador | 6.02:1 | 7.55:1 |

Cálculo de luminancia WCAG sobre los colores sólidos reales. SVG de iconos hereda el color principal.

## Alcance y validación

Navbar y Footer añaden marcadores públicos solamente fuera de /panel y /admin; los tests comprueban la exclusión. No cambia contenido, enlaces, datos, rutas, comportamiento de navbar fija ni el botón Buscar. No se editaron las páginas de ficha/listado ni componentes del panel en esta tarea. El header fijo del detalle recibe el mismo fondo mate opaco; su posición y ocultación se conservan.

Enter abre y enfoca Llegada; Escape y clic fuera cierran devolviendo el foco a la lupa. Formulario GET conserva start/end/guests. TypeScript limpio; ESLint 0 errores (5 warnings existentes). Pasan test-navbar, test-footer-contacts, test-public-chrome y test-property-search.

## Capturas antes/después

Componentes reales, con datos/URLs de contacto ficticios, sin cuentas reales ni Neon. Home renderizada como escenario de comparación; pruebas de interacción sobre Navbar real y su formulario.

| Vista | Tema | Ancho | Antes | Después |
|---|---|---|---|---|
| Home con lupa abierta | Claro | 1440px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/matte-before-header-light-1440.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/matte-after-header-light-1440.png) |
| Home con lupa abierta | Claro | 375px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/matte-before-header-light-375.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/matte-after-header-light-375.png) |
| Home con lupa abierta | Oscuro | 1440px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/matte-before-header-dark-1440.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/matte-after-header-dark-1440.png) |
| Home con lupa abierta | Oscuro | 375px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/matte-before-header-dark-375.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/matte-after-header-dark-375.png) |
| Footer | Claro | 1440px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/matte-before-footer-light-1440.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/matte-after-footer-light-1440.png) |
| Footer | Claro | 375px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/matte-before-footer-light-375.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/matte-after-footer-light-375.png) |
| Footer | Oscuro | 1440px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/matte-before-footer-dark-1440.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/matte-after-footer-dark-1440.png) |
| Footer | Oscuro | 375px | [Antes](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/matte-before-footer-dark-375.png) | [Después](C:/Users/menib/.codex/visualizations/2026/10/02/01a0fec2-608f-7e01-bd29-9ce319424377/matte-after-footer-dark-375.png) |

## Cómo probar

1. Abrir home a 1440px y 375px: lupa abre una tarjeta vertical de 320px, no una franja.
2. Tab hasta lupa, Enter, recorrer campos y Escape: se cierra y retorna foco. Clic en logo fuera de la tarjeta también cierra.
3. Enviar fechas y huéspedes: conserva la ruta localizada /casas y parámetros GET habituales.
4. Cambiar tema y recorrer el footer: redes, WhatsApp, email y navegación permanecen; revisar ambos temas.
5. Entrar al panel: header/footer conservan la vestimenta anterior y no adoptan estos tokens visuales.

## Supuestos

Se eligió anclaje debajo de la lupa, tonos planos sin grano adicional y se conservó el margen existente antes del footer. No se alteraron botones de acción ni páginas de contenido. Sin deploy.
