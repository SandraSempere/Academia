import { getCurrentPatientProfile } from "@/lib/patient";
import { prisma } from "@/lib/prisma";
import { RuleAuditForm } from "@/components/rule-audit-form";
import { RuleAuditFormSummary } from "@/components/rule-audit-form-summary";

export default async function AuditoriaReglasPage() {
  const profile = await getCurrentPatientProfile();
  const existing = profile
    ? await prisma.ruleAuditForm.findUnique({ where: { patientProfileId: profile.id } })
    : null;

  if (existing?.submittedAt) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">📋 Auditoría de tus reglas</h1>
          <p className="mt-1 text-foreground/70">
            Ya la enviaste el{" "}
            {new Date(existing.submittedAt).toLocaleDateString("es-ES")}. Si
            quieres comentar algo más, escríbeme por WhatsApp.
          </p>
        </div>
        <RuleAuditFormSummary data={existing} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">📋 Auditoría de tus reglas</h1>
        <p className="mt-1 text-foreground/70">
          Revisa las normas que te has autoimpuesto con la comida. Ya llevas
          unas semanas en el proceso, así que has tenido tiempo para
          observarte. Seguramente tienes normas que sigues sin cuestionar —
          cosas tipo &ldquo;nunca como fruta después de comer&rdquo; o
          &ldquo;siempre evito la cebolla por si acaso&rdquo;. Algunas
          nacieron de una razón real. Otras, del miedo, de algo que leíste
          una vez, o de una mala experiencia puntual que ya no aplica. Vamos
          a revisarlas.
        </p>
      </div>

      <RuleAuditForm data={existing} />
    </div>
  );
}
