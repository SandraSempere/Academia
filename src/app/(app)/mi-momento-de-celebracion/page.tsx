import { getCurrentPatientProfile } from "@/lib/patient";
import { prisma } from "@/lib/prisma";
import { CelebrationForm } from "@/components/celebration-form";
import { CelebrationFormSummary } from "@/components/celebration-form-summary";

export const dynamic = "force-dynamic";

export default async function CelebracionPage() {
  const profile = await getCurrentPatientProfile();
  const existing = profile
    ? await prisma.celebrationForm.findUnique({ where: { patientProfileId: profile.id } })
    : null;

  if (existing?.submittedAt) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">🎉 Mi momento de celebración</h1>
          <p className="mt-1 text-foreground/70">
            Ya lo enviaste el{" "}
            {new Date(existing.submittedAt).toLocaleDateString("es-ES")}. Puedes
            descargarlo abajo.
          </p>
        </div>
        <CelebrationFormSummary data={existing} downloadHref="/api/celebracion-pdf" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">🎉 Mi momento de celebración</h1>
        <p className="mt-1 text-foreground/70">
          Llevamos 6 semanas juntas y quiero que pares un momento. No para ver
          lo que queda, sino para ver todo lo que ya has recorrido. Tómate tu
          tiempo para rellenarlo con calma — cuando lo tengas, lo voy a leer y
          a celebrarlo contigo.
        </p>
      </div>

      <CelebrationForm data={existing} />
    </div>
  );
}
