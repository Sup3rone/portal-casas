// T-4944: bandera de /nosotros y /unete, sin dependencias para que Navbar y Footer (cliente) la importen.
// false = esqueleto: sin enlaces, noindex y fuera del sitemap. Ponerla en true cuando haya contenido real.
export const PUBLIC_PAGES_LIVE = false;
// Decisión del negocio (17-11-2026): los enlaces del footer se muestran ya; menú, noindex y sitemap siguen con
// PUBLIC_PAGES_LIVE. Al publicarlas del todo, esta deja de importar (el footer también mira PUBLIC_PAGES_LIVE).
export const PUBLIC_PAGES_IN_FOOTER = true;
