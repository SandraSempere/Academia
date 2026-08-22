import { notFound } from "next/navigation";
import { getCurrentPatientProfile } from "@/lib/patient";
import { prisma } from "@/lib/prisma";
import { QuincenalForm } from "@/components/quincenal-form";
import { QuincenalFormSummary } from "@/components/quincenal-form-summary";

const VALID_WEEKS = [2, 6, 10];

export default async function RevisionQuincenalPage({
  params,
  searchParams,
}: {
  params: Promise<{ week: string }>;
  searchParams: Promise<{ cycle?: string }>;
}) {
  const { week: weekParam } = await params;
  const { cycle: cycleParam } = await searchParams;
  const week = Number(weekParam);
  const cycle = cycleParam === "2" ? 2 : 1;
  if (!VALID_WEEKS.includes(week)) notFound();

  const profile = await getCurrentPatientProfile();
  if (cycle === 2 && !profile?.renewalEnabled) notFound();

  const existing = profile
    ? await prisma.quincenalForm.findUnique({
        where: { patientProfileId_cycle_week: { patientProfileId: profile.id, cycle, week } },
      })
    : null;

  const titleSuffix = cycle === 2 ? " · Renovación" : "";

  if (existing?.submittedAt) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">📅 Revisión quincenal{titleSuffix} · Semana {week}</h1>
          <p className="mt-1 text-foreground/70">
            Ya has enviado esta revisión el{" "}
            {new Date(existing.submittedAt).toLocaleDateString("es-ES")}. Si
            necesitas cambiar algo, escríbeme por WhatsApp.
          </p>
        </div>
        <QuincenalFormSummary answers={existing.answers} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">📅 Revisión quincenal{titleSuffix} · Semana {week}</h1>
        <p className="mt-1 text-foreground/70">
          Este registro sirve para entender cómo te has encontrado durante
          estos días y poder seguir ajustando el proceso a lo que necesitas
          ahora.
        </p>
      </div>

      <QuincenalForm week={week} cycle={cycle} data={existing} />
    </div>
  );
}
