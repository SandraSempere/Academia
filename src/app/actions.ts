"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail, sendNotificationEmail } from "@/lib/email";

// Cambio de contraseña propio — sirve tanto a pacientes (para dejar de
// depender de la "contraseña provisional"/reiniciada que les puso la coach)
// como a la coach (para poder cambiar la suya). Vive fuera de (app)/coach
// porque lo usan los dos roles por igual. Cualquier cambio con éxito por
// esta vía quita el aviso de "tienes que cambiar tu contraseña".
export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    throw new Error("La contraseña nueva debe tener al menos 8 caracteres.");
  }
  if (newPassword !== confirmPassword) {
    throw new Error("Las dos contraseñas nuevas no coinciden.");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { patientProfile: true },
  });
  if (!user) throw new Error("Usuario no encontrado");

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error("La contraseña actual no es correcta.");

  // Primera vez que una paciente cambia su contraseña provisional = se ha
  // unido de verdad al programa (antes de esto la cuenta existe, pero la
  // creó la coach, no la ha usado la paciente todavía).
  const isFirstActivation = user.role === "PATIENT" && user.mustChangePassword && !!user.patientProfile;

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  if (isFirstActivation && user.patientProfile) {
    await prisma.patientProfile.update({
      where: { id: user.patientProfile.id },
      data: { activatedAt: new Date() },
    });
    await sendNotificationEmail(
      "🎉 Nueva paciente",
      `${user.name} ha entrado por primera vez y ha empezado tu programa.`,
    );
    revalidatePath("/coach");
  }

  revalidatePath("/cambiar-contrasena");
  revalidatePath("/");
}

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

// "¿Olvidaste tu contraseña?" — siempre responde con el mismo mensaje
// genérico exista o no ese email, para no revelar qué emails están dados
// de alta.
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) throw new Error("Escribe tu email.");

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.blocked) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    });

    const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/restablecer-contrasena/${token}`;
    await sendPasswordResetEmail(user.email, user.name, resetUrl);
  }

  return { ok: true as const };
}

export async function resetPasswordWithToken(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    throw new Error("La contraseña nueva debe tener al menos 8 caracteres.");
  }
  if (newPassword !== confirmPassword) {
    throw new Error("Las dos contraseñas no coinciden.");
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { include: { patientProfile: true } } },
  });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new Error("Este enlace no es válido o ha caducado. Pide uno nuevo.");
  }

  const isFirstActivation =
    resetToken.user.role === "PATIENT" && resetToken.user.mustChangePassword && !!resetToken.user.patientProfile;

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash, mustChangePassword: false },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    ...(isFirstActivation
      ? [
          prisma.patientProfile.update({
            where: { id: resetToken.user.patientProfile!.id },
            data: { activatedAt: new Date() },
          }),
        ]
      : []),
  ]);

  if (isFirstActivation) {
    await sendNotificationEmail(
      "🎉 Nueva paciente",
      `${resetToken.user.name} ha entrado por primera vez y ha empezado tu programa.`,
    );
  }

  return { ok: true as const };
}
