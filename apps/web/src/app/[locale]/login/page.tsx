import Link from "next/link";
import { loginAction } from "./actions";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Iniciar sesión</h1>
        <p className="mb-6 text-sm text-gray-600">
          Accede a tu cuenta para gestionar reservas y mensajes.
        </p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Credenciales incorrectas. Verifica tu correo y contraseña.
          </p>
        )}

        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition hover:bg-purple-700"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{" "}
          <Link href={`/${locale}/registro`} className="text-purple-600 underline">
            Regístrate
          </Link>
        </p>
        <p className="mt-2 text-center text-sm">
          <a href={`/${locale}/olvide-password`} className="text-purple-600 underline">
            ¿Olvidaste tu contraseña?
          </a>
        </p>
      </div>
    </div>
  );
}
