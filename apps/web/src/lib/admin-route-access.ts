// Regla del proxy para /{locale}/admin/*. Solo decide quién puede llegar a la página;
// cada página vuelve a validar en servidor (requireAdmin / requirePropertyManager).
// T-4719: mensajes y tarifas ya filtran por propiedad gestionada, así que el
// colaborador puede entrar; el resto de /admin sigue siendo solo de ADMIN.
const COLLABORATOR_ADMIN_SECTIONS = new Set(['mensajes', 'tarifas']);

/** null si la ruta no es /admin; true/false según el rol. */
export function adminRouteAllowed(pathname: string, role: string | undefined): boolean | null {
  const match = pathname.match(/^\/(?:es|en|fr)\/admin(?:\/([^/]+))?(?:\/.*)?$/);
  if (!match) return null;
  if (role === 'ADMIN') return true;
  return role === 'COLLABORATOR' && COLLABORATOR_ADMIN_SECTIONS.has(match[1] ?? '');
}
