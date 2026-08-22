import { getCurrentPatientProfile } from "@/lib/patient";
import { prisma } from "@/lib/prisma";
import { CommitmentForm } from "@/components/commitment-form";
import { CommitmentFormSummary } from "@/components/commitment-form-summary";

export const dynamic = "force-dynamic";

export default async function LineaDeIntentosPage() {
  const profile = await getCurrentPatientProfile();
  const existing = profile
    ? await prisma.commitmentForm.findUnique({ where: { patientProfileId: profile.id } })
    : null;

  if (existing?.submittedAt) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">
            Tu línea de intentos y tu carta de compromiso
          </h1>
          <p className="mt-1 text-foreground/70">
            Ya la enviaste el{" "}
            {new Date(existing.submittedAt).toLocaleDateString("es-ES")}.
            Puedes descargarla abajo. En la semana 12 la volveremos a leer
            juntas.
          </p>
        </div>
        <CommitmentFormSummary data={existing} downloadHref="/api/linea-de-intentos-pdf" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Tu línea de intentos y tu carta de compromiso
        </h1>
        <p className="mt-1 text-foreground/70">
          Un momento para mirar atrás antes de mirar hacia delante. Tómate tu
          tiempo.
        </p>
      </div>

      <CommitmentForm data={existing} />
    </div>
  );
}
