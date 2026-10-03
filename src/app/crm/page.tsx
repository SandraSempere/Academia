import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CRM_TEAM_ROLES, getCallerOptions, getCrmUser } from "@/lib/crm";

export const dynamic = "force-dynamic";

export default async function CrmHomePage() {
  const user = await getCrmUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "COACH";
  const [callers, activeTeam] = await Promise.all([
    getCallerOptions(),
    isAdmin ? prisma.user.count({ where: { role: { in: [...CRM_TEAM_ROLES] }, blocked: false } }) : 0,
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">📇 CRM de leads</h1>
        <p className="mt-1 text-sm text-foreground/70">Hola, {user.name}.</p>
      </div>

      <section className="rounded-2xl bg-blanco-roto p-6 shadow-sm">
        <h2 className="font-semibold">Leads de Instagram</h2>
        <p className="mt-2 text-sm text-foreground/70">
          Aquí aparecerán la tabla de leads, la agenda y el dashboard en cuanto estén listos.
        </p>
      </section>

      {isAdmin && (
        <section className="rounded-2xl bg-blanco-roto p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold">👥 Equipo</h2>
            <Link href="/crm/equipo" className="text-sm text-brand-primary hover:opacity-80">
              Gestionar equipo →
            </Link>
          </div>
          <p className="mt-2 text-sm text-foreground/70">
            {activeTeam === 1 ? "1 miembro activo" : `${activeTeam} miembros activos`} (setters y closers).
          </p>
          <p className="mt-1 text-sm text-foreground/70">
            Opciones del desplegable &quot;Closer&quot;:{" "}
            {callers.length > 0 ? callers.map((c) => c.name).join(", ") : "nadie marcado con \"Hace llamadas\""}
          </p>
        </section>
      )}
    </div>
  );
}
