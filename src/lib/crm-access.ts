import { prisma } from "@/lib/prisma";

// Comprobación de acceso al CRM contra la base de datos. Vive aparte de
// src/lib/crm.ts (sin importar auth.ts) porque también la usa src/proxy.ts
// en cada petición.

export const CRM_TEAM_ROLES = ["SETTER", "CLOSER"] as const;
export type CrmTeamRole = (typeof CRM_TEAM_ROLES)[number];

export function isCrmTeamRole(role: string | undefined | null): role is CrmTeamRole {
  return role === "SETTER" || role === "CLOSER";
}

// "Última conexión" se guarda como mucho una vez cada 5 minutos — basta para
// ver si alguien entra a diario sin escribir en la base de datos en cada
// petición.
const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000;

export type CrmAccessUser = {
  id: string;
  name: string;
  email: string;
  role: "COACH" | CrmTeamRole;
};

// ¿Sigue este usuario (id + versión de sesión del JWT) teniendo acceso al
// CRM? Para setter/closer exige que esté activo y que la versión de sesión
// coincida: desactivar a alguien sube su sessionVersion, así que cualquier
// sesión abierta deja de valer en la siguiente petición (y no revive si
// luego se le reactiva).
export async function checkCrmAccess(userId: string, sessionVersion: number): Promise<CrmAccessUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, blocked: true, sessionVersion: true, lastSeenAt: true },
  });
  if (!user) return null;
  if (user.role !== "COACH" && !isCrmTeamRole(user.role)) return null;

  if (isCrmTeamRole(user.role)) {
    if (user.blocked || user.sessionVersion !== sessionVersion) return null;
    if (!user.lastSeenAt || Date.now() - user.lastSeenAt.getTime() > LAST_SEEN_THROTTLE_MS) {
      await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
    }
  }

  return { id: user.id, name: user.name, email: user.email, role: user.role as CrmAccessUser["role"] };
}
