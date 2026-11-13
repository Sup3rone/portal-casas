"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db, users } from "@portal/db";
import { auth, signOut } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sendPasswordChangedEmail } from "@/lib/account-emails";

export async function logoutAction() {
  await signOut({ redirectTo: "/es" });
}

export type ChangePasswordState = { status: "idle" | "ok" | "error"; error?: "session" | "current" | "length" | "match" | "same" | "rate" | "server" };

/**
 * T-4772: cambiar la contraseña desde Mi cuenta. Pide la actual (bcrypt), la nueva dos veces (mínimo 8,
 * distinta de la actual), limita intentos por IP y avisa por correo. El usuario se toma de la sesión,
 * nunca del formulario. Las sesiones abiertas en otros dispositivos siguen vigentes (JWT).
 */
export async function changePasswordAction(_prev: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return { status: "error", error: "session" };
  if (consumeRateLimit("password", await headers())) return { status: "error", error: "rate" };
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (next.length < 8 || next.length > 200) return { status: "error", error: "length" };
  if (next !== confirm) return { status: "error", error: "match" };
  if (next === current) return { status: "error", error: "same" };
  try {
    const [user] = await db.select({ id: users.id, email: users.email, name: users.name, passwordHash: users.passwordHash })
      .from(users).where(eq(users.id, id)).limit(1);
    if (!user) return { status: "error", error: "session" };
    if (!user.passwordHash || !(await bcrypt.compare(current, user.passwordHash))) return { status: "error", error: "current" };
    await db.update(users).set({ passwordHash: await bcrypt.hash(next, 10) }).where(eq(users.id, user.id));
    await sendPasswordChangedEmail(user, "account");
    return { status: "ok" };
  } catch (error) {
    console.error("No se pudo cambiar la contraseña:", error);
    return { status: "error", error: "server" };
  }
}
