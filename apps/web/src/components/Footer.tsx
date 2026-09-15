export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }, { locale: 'fr' }];
}
export default function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Portal Casas</h3>
            <p className="text-sm text-gray-600">
              Tu conexión con las mejores propiedades. Experiencias únicas, recuerdos inolvidables.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900 mb-4">Navegación</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><a href="/es/casas" className="hover:text-purple-600">Casas</a></li>
              <li><a href="/es/admin/mensajes" className="hover:text-purple-600">Admin</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-900 mb-4">Contacto</h4>
            <p className="text-sm text-gray-600">hola@portalcasas.com</p>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Portal Casas. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
