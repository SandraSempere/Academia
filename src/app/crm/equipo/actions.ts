"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendCrmInviteEmail } from "@/lib/email";
import { CRM_ROLE_LABELS, isCrmTeamRole, requireCrmAdmin } from "@/lib/crm";

// Apartado "Equipo CRM" (solo admin). Los miembros nunca se borran, solo se
// desactivan, para conservar el histórico de leads que registraron/atendieron.

const INVITE_TTL_DAYS = 7;

function parseTeamRole(value: FormDataEntryValue | null) {
  const role = String(value ?? "");
  if (!isCrmTeamRole(role)) throw new Error("Elige un rol: setter o closer.");
  return role;
}

async function getTeamMember(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (user.role !== "COACH" && !isCrmTeamRole(user.role))) {
    throw new Error("Miembro no encontrado");
  }
  return user;
}

// Crea un enlace de un solo uso (válido 7 días) para que elija su
// contraseña — reutiliza el flujo de "restablecer contraseña".
async function createInvite(user: { id: string; email: string; name: string; role: string }) {
  const token = randomBytes(32).toString("hex");
  await prisma.$transaction([
    // Las invitaciones anteriores sin usar dejan de valer.
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { expiresAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000) },
    }),
    prisma.user.update({ where: { id: user.id }, data: { invitedAt: new Date() } }),
  ]);

  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${baseUrl}/restablecer-contrasena/${token}`;
  const emailSent = await sendCrmInviteEmail(
    user.email,
    user.name,
    CRM_ROLE_LABELS[user.role] ?? user.role,
    inviteUrl,
    INVITE_TTL_DAYS,
  );
  return { inviteUrl, emailSent };
}

export async function inviteCrmMember(formData: FormData) {
  await requireCrmAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = parseTeamRole(formData.get("role"));
  const takesCalls = formData.get("takesCalls") === "on";

  if (!name) throw new Error("Escribe el nombre real.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("El email no es válido.");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Ya existe un usuario con ese email.");

  // Sin contraseña utilizable hasta que abra el enlace de la invitación.
  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
  const user = await prisma.user.create({
    data: { name, email, role, takesCalls, passwordHash, mustChangePassword: false },
  });

  const result = await createInvite(user);
  revalidatePath("/crm/equipo");
  revalidatePath("/crm");
  return result;
}

export async function resendCrmInvite(userId: string) {
  await requireCrmAdmin();
  const user = await getTeamMember(userId);
  if (!isCrmTeamRole(user.role)) throw new Error("Solo se puede invitar a setters y closers.");
  if (user.blocked) throw new Error("Activa primero su acceso.");

  const result = await createInvite(user);
  revalidatePath("/crm/equipo");
  return result;
}

export async function updateCrmMember(userId: string, formData: FormData) {
  await requireCrmAdmin();
  const user = await getTeamMember(userId);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("El nombre no puede quedar vacío.");

  // El rol de la admin no se cambia desde aquí; setter ↔ closer sí.
  const role = isCrmTeamRole(user.role) ? parseTeamRole(formData.get("role")) : user.role;

  await prisma.user.update({ where: { id: user.id }, data: { name, role } });
  revalidatePath("/crm/equipo");
  revalidatePath("/crm");
}

export async function setCrmMemberActive(userId: string, active: boolean) {
  await requireCrmAdmin();
  const user = await getTeamMember(userId);
  if (!isCrmTeamRole(user.role)) throw new Error("No se puede desactivar a la admin.");

  await prisma.user.update({
    where: { id: user.id },
    data: active
      ? { blocked: false }
      : // Subir sessionVersion invalida al instante todas sus sesiones
        // abiertas (ver src/lib/crm-access.ts y src/proxy.ts).
        { blocked: true, sessionVersion: { increment: 1 } },
  });
  revalidatePath("/crm/equipo");
  revalidatePath("/crm");
}

export async function setCrmMemberTakesCalls(userId: string, takesCalls: boolean) {
  await requireCrmAdmin();
  const user = await getTeamMember(userId);

  await prisma.user.update({ where: { id: user.id }, data: { takesCalls } });
  revalidatePath("/crm/equipo");
  revalidatePath("/crm");
}
