"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "es") || "es";
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  try {
    // signIn con Server Action → el token CSRF se maneja solo ✨
    await signIn("credentials", {
      email,
      password,
      redirectTo: `/${locale}/mi-cuenta`,
    });
  } catch (error) {
    // Credenciales inválidas → AuthError, redirigimos con mensaje
    if (error instanceof AuthError) {
      redirect(`/${locale}/login?error=1`);
    }
    // NEXT_REDIRECT y otros errores de Next → re-lanzar (¡no capturar!)
    throw error;
  }
}
