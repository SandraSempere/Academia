import { getCurrentPatientProfile } from "@/lib/patient";
import { prisma } from "@/lib/prisma";
import { SymptomForm } from "@/components/symptom-form";
import { SymptomFormSummary } from "@/components/symptom-form-summary";

export default async function FormularioSintomasPage() {
  const profile = await getCurrentPatientProfile();
  const existing = profile
    ? await prisma.symptomForm.findUnique({ where: { patientProfileId: profile.id } })
    : null;

  if (existing?.submittedAt) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">📝 Formulario de síntomas</h1>
          <p className="mt-1 text-foreground/70">
            Ya has enviado tu formulario el{" "}
            {new Date(existing.submittedAt).toLocaleDateString("es-ES")}. Si
            necesitas cambiar algo importante, escríbeme por WhatsApp.
          </p>
        </div>
        <div className="rounded-2xl bg-brand-tertiary-soft px-4 py-3 text-sm">
          🌿 Gracias por rellenarlo con tanto detalle. Ya lo tengo para
          preparar tu primera consulta.
        </div>
        <SymptomFormSummary data={existing} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">📝 Formulario de síntomas</h1>
        <p className="mt-1 text-foreground/70">
          Rellénalo con calma antes de nuestra primera consulta — cuanto más
          detalle, mejor podré prepararlo todo para ti. Se guarda directamente
          aquí, no hace falta que me lo envíes por email.
        </p>
      </div>

      <SymptomForm data={existing} />
    </div>
  );
}
