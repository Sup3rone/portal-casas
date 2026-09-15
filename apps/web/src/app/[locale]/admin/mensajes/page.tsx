import { db, messages, properties } from '@portal/db';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic'; // siempre fresco, sin caché

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = searchParams ? await searchParams : {};

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-bold text-center">Acceso administrativo</h1>

        <form
          action="/api/admin/login"
          method="POST"
          className="space-y-4 rounded-2xl bg-white p-8 shadow-sm border"
        >
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              required
              autoFocus
              type="password"
              id="password"
              name="password"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            />
          </div>

          {params.error && (
            <p className="text-sm text-red-600">Contraseña incorrecta. Intenta de nuevo.</p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-purple-600 py-3 font-bold text-white transition-colors hover:bg-purple-700"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
