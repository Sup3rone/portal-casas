import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db, users, bookings, messages, properties } from "@portal/db";
import { eq, desc } from "drizzle-orm";

export default async function MyAccountPage() {
  const session = await auth();

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
      <div className="flex min-h-screen items-center justify-center text-gray-600">
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
    .leftJoin(properties, eq(messages.propertyId, properties.id))
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
    .leftJoin(properties, eq(bookings.propertyId, properties.id))
    .where(eq(bookings.guestUserId, userData.id))
    .orderBy(desc(bookings.startDate))
    .limit(10);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mi cuenta</h1>
            <p className="text-gray-600">
              {session.user.name} ({session.user.email})
            </p>
          </div>
          import { logoutAction } from "./actions";

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cerrar sesión
            </button>
          </form>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Consultas enviadas */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Mis consultas</h2>
            {userMessages.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aún no has enviado consultas.{" "}
                <a href="/es/casas" className="text-purple-600 underline">
                  Explora las propiedades
                </a>
              </p>
            ) : (
              <ul className="space-y-3">
                {userMessages.map((msg) => (
                  <li key={msg.id} className="rounded-lg border border-gray-200 p-3">
                    <p className="font-medium text-gray-900">{msg.propertyTitle ?? "Propiedad"}</p>
                    <p className="text-sm text-gray-600">
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleDateString("es-MX")
                        : ""}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">{msg.body}</p>
                    {msg.read ? (
                      <span className="mt-1 inline-block rounded bg-green-100 px-2 py-1 text-xs text-green-700">
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
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Mis reservas</h2>
            {userBookings.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no tienes reservas.</p>
            ) : (
              <ul className="space-y-3">
                {userBookings.map((booking) => (
                  <li key={booking.id} className="rounded-lg border border-gray-200 p-3">
                    <p className="font-medium text-gray-900">
                      {booking.propertyTitle ?? "Propiedad"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(booking.startDate).toLocaleDateString("es-MX")} —{" "}
                      {new Date(booking.endDate).toLocaleDateString("es-MX")}
                    </p>
                    {booking.source === "manual" ? (
                      <span className="mt-1 inline-block rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                        Confirmada
                      </span>
                    ) : (
                      <span className="mt-1 inline-block rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
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
