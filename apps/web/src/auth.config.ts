import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  providers: [], // vacío aquí, los reales viven en auth.ts
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { role?: string }).role = token.role as string | undefined;
      return session;
    },
  },
} satisfies NextAuthConfig;
