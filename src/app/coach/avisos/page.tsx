import { getPatientsWithStatus, patientDisplayName } from "@/lib/patient";
import { prisma } from "@/lib/prisma";
import { BroadcastForm } from "@/components/broadcast-form";

export const dynamic = "force-dynamic";

export default async function AvisosPage() {
  const { activas } = await getPatientsWithStatus();
  const withProfile = activas.filter((p) => p.patientProfile);

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { patientProfileId: { in: withProfile.map((p) => p.patientProfile!.id) } },
    select: { patientProfileId: true },
  });
  const withPush = new Set(subscriptions.map((s) => s.patientProfileId));

  const recipients = withProfile
    .map((p) => ({
      patientProfileId: p.patientProfile!.id,
      name: patientDisplayName(p),
      email: p.email,
      blocked: p.blocked,
      hasPush: withPush.has(p.patientProfile!.id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">📣 Aviso masivo</h1>
        <p className="mt-1 text-foreground/70">
          Manda el mismo mensaje a varias pacientes activas a la vez — les llega por notificación push (si la
          tienen activada) y siempre por email.
        </p>
      </div>

      {recipients.length === 0 ? (
        <p className="text-sm text-foreground/60">No hay pacientes activas todavía.</p>
      ) : (
        <BroadcastForm recipients={recipients} />
      )}
    </div>
  );
}
