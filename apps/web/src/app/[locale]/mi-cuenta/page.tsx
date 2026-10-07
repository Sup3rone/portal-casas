import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, users, bookings, messages, properties } from "@portal/db";
import { and, eq, desc } from "drizzle-orm";
import { logoutAction } from "./actions";
import Link from "next/link";
import { getLocale } from "next-intl/server";

export default async function MyAccountPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user?.email) {
    redirect("/es/login");
  }

  // Buscar el usuario en DB para saber su id
  const [userData] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!userData) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-600 dark:text-gray-300">
        Usuario no encontrado.
      </div>
    );
  }

  // Consultas enviadas por este huésped
  const userMessages = await db
    .select({
      id: messages.id,
      body: messages.body,
      createdAt: messages.createdAt,
      propertyTitle: properties.titleEs,
      read: messages.read,
    })
    .from(messages)
    .leftJoin(properties, and(eq(messages.propertyId, properties.id), eq(properties.published, true)))
    .where(eq(messages.userId, userData.id))
    .orderBy(desc(messages.createdAt))
    .limit(10);

  // Reservas de este huésped
  const userBookings = await db
    .select({
      id: bookings.id,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
      source: bookings.source,
      propertyTitle: properties.titleEs,
    })
    .from(bookings)
    .leftJoin(properties, and(eq(bookings.propertyId, properties.id), eq(properties.published, true)))
    .where(eq(bookings.guestUserId, userData.id))
    .orderBy(desc(bookings.startDate))
    .limit(10);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Mi cuenta</h1>
            <p className="text-gray-600 dark:text-gray-300">
              {session.user.name} ({session.user.email})
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cerrar sesión
            </button>
          </form>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Consultas enviadas */}
          <section className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Mis consultas</h2>
            {userMessages.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Aún no has enviado consultas.{" "}
                <Link href={`/${locale}/casas`} className="text-purple-600 dark:text-purple-400 underline">
                  Explora las propiedades
                </Link>
              </p>
            ) : (
              <ul className="space-y-3">
                {userMessages.map((msg) => (
                  <li key={msg.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{msg.propertyTitle ?? "Propiedad"}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleDateString("es-MX")
                        : ""}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{msg.body}</p>
                    {msg.read ? (
                      <span className="mt-1 inline-block rounded bg-green-100 dark:bg-green-900/50 px-2 py-1 text-xs text-green-700 dark:text-green-400">
                        Leída
                      </span>
                    ) : (
                      <span className="mt-1 inline-block rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
                        Pendiente de revisión
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Mis reservas */}
          <section className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Mis reservas</h2>
            {userBookings.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Aún no tienes reservas.</p>
            ) : (
              <ul className="space-y-3">
                {userBookings.map((booking) => (
                  <li key={booking.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {booking.propertyTitle ?? "Propiedad"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {new Date(booking.startDate).toLocaleDateString("es-MX")} —{" "}
                      {new Date(booking.endDate).toLocaleDateString("es-MX")}
                    </p>
                    {booking.source === "manual" ? (
                      <span className="mt-1 inline-block rounded bg-green-100 dark:bg-green-900/50 px-2 py-1 text-xs text-green-700 dark:text-green-400">
                        Confirmada
                      </span>
                    ) : (
                      <span className="mt-1 inline-block rounded bg-blue-100 dark:bg-blue-900/50 px-2 py-1 text-xs text-blue-700 dark:text-blue-400">
                        Sincronizada de {booking.source}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
