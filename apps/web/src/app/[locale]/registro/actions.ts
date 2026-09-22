"use server";

import { signIn } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users } from "@portal/db";

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "es") || "es";

  if (!name || !email || !password || password.length < 6) {
    return { error: "Todos los campos son obligatorios y la contraseña mínima es de 6 caracteres." };
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return { error: "Este correo ya está registrado. Intenta con otro." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      name,
      email,
      phone,
      passwordHash,
      role: "CLIENT",
    });

    // Iniciar sesión automáticamente tras registrarse
    // signIn con redirectTo lanza una excepción de redirección — NO capturarla
    await signIn("credentials", {
      email,
      password,
      redirectTo: `/${locale}/mi-cuenta`,
    });
  } catch (error) {
    // Las redirecciones de Next llegan aquí como error especial — hay que re-lanzarlas
    if (error instanceof Error && "digest" in error) throw error;
    return { error: "Error al crear tu cuenta. Intenta nuevamente." };
  }
}
