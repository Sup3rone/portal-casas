import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users } from "@portal/db";
import { getLocale } from 'next-intl/server';

export const { handlers, auth, signIn, signOut } = NextAuth(async request => {
  // API Auth.js: conservar el locale del destino/referer o la cookie de next-intl.
  const requestLocale = request ? [request.nextUrl.searchParams.get('callbackUrl'), request.headers.get('referer'), request.url]
    .flatMap(value => { try { return value ? [new URL(value, request.url).pathname.split('/')[1]] : []; } catch { return []; } })
    .find(value => ['es', 'en', 'fr'].includes(value)) : await getLocale();
  const cookieLocale = request?.cookies.get('NEXT_LOCALE')?.value;
  const locale = requestLocale ?? (cookieLocale && ['es', 'en', 'fr'].includes(cookieLocale) ? cookieLocale : 'es');
  return {
  session: { strategy: "jwt" },

  // A dónde manda si intentan entrar a página protegida sin sesión
  pages: {
    signIn: `/${locale}/login`,
  },

  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        // Sin usuario o sin hash = no entra (usuarios viejos sin contraseña)
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // Devuelve lo mínimo para la sesión
        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],

  callbacks: {
    // Metemos el rol en el JWT para tenerlo en cada request
    async jwt({ token, user }) {
      const id = user?.id ?? token.sub;
      if (id) {
        const [dbUser] = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, id))
          .limit(1);
        token.role = dbUser?.role ?? "CLIENT";
      }
      return token;
    },
    // Y lo exponemos en la sesión del cliente
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub as string;
        (session.user as { role?: string }).role = (token.role as string) ?? "CLIENT";
      }
      return session;
    },
  },
  };
});
