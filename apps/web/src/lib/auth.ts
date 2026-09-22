import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, users } from "@portal/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },

  // A dónde manda si intentan entrar a página protegida sin sesión
  pages: {
    signIn: "/es/login",
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
      if (user?.id) {
        const [dbUser] = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, user.id))
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
});
