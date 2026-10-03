import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkCrmAccess, CRM_TEAM_ROLES, type CrmAccessUser } from "@/lib/crm-access";

// CRM de leads de Instagram. COACH es la admin (Sandra): ve toda la app,
// incluido el CRM, y gestiona el equipo. SETTER y CLOSER solo pueden ver el
// CRM — el resto de la app les devuelve 403 desde src/proxy.ts, y además
// cada página/acción del CRM vuelve a comprobar el acceso contra la base de
// datos (no solo el JWT), para que desactivar a alguien le corte al
// instante aunque tenga la sesión abierta.

export { CRM_TEAM_ROLES, isCrmTeamRole, type CrmTeamRole, type CrmAccessUser } from "@/lib/crm-access";

export const CRM_ROLE_LABELS: Record<string, string> = {
  COACH: "Admin",
  SETTER: "Setter",
  CLOSER: "Closer",
};

export const CRM_TIME_ZONE = "Europe/Madrid";

// Usuario del CRM de la sesión actual, o null si no tiene acceso (sin
// sesión, paciente, desactivado o sesión invalidada).
export async function getCrmUser(): Promise<CrmAccessUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return checkCrmAccess(session.user.id, session.user.sessionVersion ?? 0);
}

// Para server actions del CRM: lanza si no hay acceso.
export async function requireCrmUser(): Promise<CrmAccessUser> {
  const user = await getCrmUser();
  if (!user) throw new Error("No autorizado");
  return user;
}

// Para server actions solo de admin (Equipo CRM).
export async function requireCrmAdmin(): Promise<CrmAccessUser> {
  const user = await requireCrmUser();
  if (user.role !== "COACH") throw new Error("No autorizado");
  return user;
}

// Opciones del desplegable "Closer" de los leads: miembros activos con
// "Hace llamadas" marcado. Se calcula en cada carga, así que marcar/
// desmarcar la casilla o desactivar a alguien se refleja solo. Los leads
// guardarán el id del closer (los usuarios del CRM nunca se borran), así
// que los antiguos siguen mostrando su nombre aunque ya no salga aquí.
export async function getCallerOptions() {
  return prisma.user.findMany({
    where: { takesCalls: true, blocked: false, role: { in: ["COACH", ...CRM_TEAM_ROLES] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}

export function formatMadridDateTime(date: Date | null | undefined): string {
  if (!date) return "Nunca";
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: CRM_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
