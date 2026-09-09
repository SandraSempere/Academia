import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email }, include: { patientProfile: true } });
        if (!user) return null;
        if (user.blocked) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // La casilla de "He leído y acepto los términos y condiciones" del
        // formulario de login es obligatoria (atributo `required` del propio
        // checkbox, ver src/app/login/page.tsx) — si llegamos aquí, ya
        // estaba marcada. Se registra aquí, en la misma petición que valida
        // la contraseña, para no depender de una llamada aparte desde el
        // cliente tras el login (eso tenía una condición de carrera con la
        // cookie de sesión recién creada). Solo se guarda la primera vez.
        if (user.role === "PATIENT" && user.patientProfile && !user.patientProfile.termsAcceptedAt) {
          await prisma.patientProfile.update({
            where: { id: user.patientProfile.id },
            data: { termsAcceptedAt: new Date() },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
