import type { NextAuthConfig } from "next-auth";

// Configuración sin providers ni Prisma, compartida por auth.ts (server
// components / route handlers / acciones) y src/proxy.ts. La configuración
// completa (con Credentials + Prisma) vive en auth.ts.
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id as string;
        token.sessionVersion = user.sessionVersion ?? 0;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "PATIENT" | "COACH" | "SETTER" | "CLOSER";
        session.user.sessionVersion = (token.sessionVersion as number | undefined) ?? 0;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
