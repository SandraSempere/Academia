import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CRM_TEAM_ROLES, formatMadridDateTime, getCrmUser } from "@/lib/crm";
import { CrmInviteForm } from "@/components/crm-invite-form";
import { CrmMemberRow } from "@/components/crm-member-row";

export const dynamic = "force-dynamic";

export default async function EquipoCrmPage() {
  // El proxy ya devuelve 403 a setters/closers aquí; esto es la segunda
  // barrera por si se llega por otra vía.
  const user = await getCrmUser();
  if (!user || user.role !== "COACH") redirect("/crm");

  const members = await prisma.user.findMany({
    where: { role: { in: ["COACH", ...CRM_TEAM_ROLES] } },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      blocked: true,
      takesCalls: true,
      lastSeenAt: true,
      invitedAt: true,
    },
  });

  // Admin primero, luego activos, y por nombre.
  members.sort(
    (a, b) =>
      Number(b.role === "COACH") - Number(a.role === "COACH") ||
      Number(a.blocked) - Number(b.blocked) ||
      a.name.localeCompare(b.name, "es"),
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">👥 Equipo CRM</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Los miembros nunca se borran: al desactivarlos pierden el acceso al momento, pero se
          conservan sus datos y los leads que registraron. Quien tenga &quot;Hace llamadas&quot;
          marcado (y esté activo) sale como opción en el desplegable &quot;Closer&quot; de los leads.
        </p>
      </div>

      <section className="rounded-2xl bg-blanco-roto p-6 shadow-sm">
        <h2 className="font-semibold">Invitar a una persona</h2>
        <div className="mt-4">
          <CrmInviteForm />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Miembros</h2>
        {members.map((m) => (
          <CrmMemberRow
            key={m.id}
            member={{
              id: m.id,
              name: m.name,
              email: m.email,
              role: m.role as "COACH" | "SETTER" | "CLOSER",
              active: !m.blocked,
              takesCalls: m.takesCalls,
              // La admin entra por el panel de pacientes, que no registra
              // esto — solo tiene sentido para setters/closers.
              lastSeen: m.role === "COACH" ? null : formatMadridDateTime(m.lastSeenAt),
              pendingInvite: m.role !== "COACH" && !m.lastSeenAt && !!m.invitedAt,
            }}
          />
        ))}
      </section>
    </div>
  );
}
