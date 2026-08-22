import type { NextAuthConfig } from "next-auth";

// Configuración "edge-safe": sin providers ni Prisma, para poder usarse en
// middleware (Edge Runtime). La configuración completa (con Credentials +
// Prisma) vive en auth.ts y solo se usa en server components / route handlers.
export const authConfig = {
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "PATIENT" | "COACH";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
