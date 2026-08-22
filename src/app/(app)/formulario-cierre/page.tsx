import { getCurrentPatientProfile } from "@/lib/patient";
import { prisma } from "@/lib/prisma";
import { ClosingForm } from "@/components/closing-form";
import { ClosingFormSummary } from "@/components/closing-form-summary";

export const dynamic = "force-dynamic";

export default async function FormularioCierrePage() {
  const profile = await getCurrentPatientProfile();
  const existing = profile
    ? await prisma.closingForm.findUnique({ where: { patientProfileId: profile.id } })
    : null;

  if (existing?.submittedAt) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">🎓 Formulario de cierre y valoración</h1>
          <p className="mt-1 text-foreground/70">
            Ya lo enviaste el{" "}
            {new Date(existing.submittedAt).toLocaleDateString("es-ES")}. Si
            quieres añadir algo más, escríbeme por WhatsApp.
          </p>
        </div>
        <ClosingFormSummary data={existing} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">🎓 Formulario de cierre y valoración</h1>
        <p className="mt-1 text-foreground/70">
          Este formulario es para cerrar el proceso con calma y recoger cómo
          has vivido estos meses. No hay respuestas correctas o incorrectas.
          Me interesa entender tu experiencia.
        </p>
      </div>

      <ClosingForm data={existing} />
    </div>
  );
}
