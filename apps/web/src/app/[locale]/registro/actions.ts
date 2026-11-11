"use server";

import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users } from "@portal/db";
import { headers } from 'next/headers';
import { consumeRateLimit } from '@/lib/rate-limit';
import { sendVerificationEmail } from '@/lib/email-verification';

export async function registerAction(formData: FormData) {
  const retryAfter = consumeRateLimit('register', await headers());
  if (retryAfter) return { retryAfter };
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "es") || "es";

  if (!name || !email || !password || password.length < 6) {
    redirect(`/${locale}/registro?error=campos`);
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    redirect(`/${locale}/registro?error=duplicado`);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [created] = await db.insert(users).values({
    name,
    email,
    phone,
    passwordHash,
    role: "CLIENT",
  }).returning({ id: users.id });

  // T-4783: «Confirma tu correo». Si falla (base o Resend), la cuenta queda creada y Mi cuenta ofrece reenviar.
  const sent = await sendVerificationEmail({ id: created.id, email, name }, locale);

  // signIn exitoso lanza su propia redirección — dejarla propasar
  await signIn("credentials", {
    email,
    password,
    redirectTo: `/${locale}/mi-cuenta${sent ? "" : "?correo=error"}`,
  });
}
