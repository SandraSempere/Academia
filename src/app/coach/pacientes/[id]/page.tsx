import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProgressSummary } from "@/lib/patient";
import {
  updateQuincenalVideo,
  markQuincenalReviewed,
  enableRenewal,
  enableExtraMonth,
  resetSymptomForm,
  blockPatient,
  unblockPatient,
  resetPatientPassword,
  deletePatient,
  addClinicalNote,
} from "@/app/coach/actions";
import { SymptomFormSummary } from "@/components/symptom-form-summary";
import { QuincenalComparison } from "@/components/quincenal-comparison";
import { CelebrationFormSummary } from "@/components/celebration-form-summary";
import { IntakeScreeningSummary } from "@/components/intake-screening-summary";
import { ClosingFormSummary } from "@/components/closing-form-summary";
import { PlanFileUploadRow } from "@/components/plan-file-upload";
import { EatingChecklistSummary } from "@/components/eating-checklist-summary";
import { RuleAuditFormSummary } from "@/components/rule-audit-form-summary";
import { CommitmentFormSummary } from "@/components/commitment-form-summary";
import { MealDiarySummary } from "@/components/meal-diary-summary";
import { ProgramTimeline } from "@/components/program-timeline";
import { PERSONAL_FIELDS } from "@/lib/symptom-form-fields";
import type { MealDiaryEntryData } from "@/lib/meal-diary-fields";

export const dynamic = "force-dynamic";

const PLAN_FILE_SECTIONS = [
  { category: "accion", title: "Plan de acción", emoji: "🗓️" },
  { category: "nutricional", title: "Plan nutricional", emoji: "🍽️" },
  { category: "suplementacion", title: "Suplementación", emoji: "💊" },
  { category: "recetas", title: "Receta", emoji: "🍳" },
];

// Estas se duplican para la renovación (Plan de acción, Plan nutricional y
// Suplementación) — Recetas no, Sandra pidió que siga siendo la misma del
// ciclo original. La Fase de reintroducción se duplica aparte, más abajo
// (no encaja en este array porque usa sus propias etiquetas de slot).
const RENEWAL_PLAN_FILE_SECTIONS = PLAN_FILE_SECTIONS.filter((s) => s.category !== "recetas");

const REINTRODUCTION_SLOTS = ["1º introducción", "2º introducción", "3º introducción", "Registro de síntomas"];

function toDateInputValue(date: Date) {
  // Fecha local (no UTC) — con toISOString() una medianoche local en
  // Europe/Madrid (UTC+1/+2) se desplaza al día anterior.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type QuincenalFormRow = {
  week: number;
  answers: unknown;
  coachVideoUrl: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
};

function QuincenalSection({
  patientId,
  forms,
  cycle,
  title,
  weeks = [2, 6, 10],
}: {
  patientId: string;
  forms: QuincenalFormRow[];
  cycle: number;
  title: string;
  // El mes extra solo tiene la semana 14 — con un único punto no hay
  // evolución que comparar, así que se salta el gráfico/tabla de
  // QuincenalComparison (pensado para 3 semanas) y solo se muestran el
  // estado de revisión y el hueco de vídeo, igual que para 2/6/10.
  weeks?: number[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {weeks.length > 1 && <QuincenalComparison forms={forms} />}

      <div className="flex flex-wrap gap-2">
        {weeks.map((week) => {
          const form = forms.find((f) => f.week === week);
          if (!form?.submittedAt) return null;
          return form.reviewedAt ? (
            <span key={week} className="rounded-full bg-brand-tertiary-soft px-3 py-1.5 text-xs">
              ✓ Semana {week} revisada · {new Date(form.reviewedAt).toLocaleDateString("es-ES")}
            </span>
          ) : (
            <form key={week} action={markQuincenalReviewed}>
              <input type="hidden" name="userId" value={patientId} />
              <input type="hidden" name="week" value={week} />
              <input type="hidden" name="cycle" value={cycle} />
              <button
                type="submit"
                className="rounded-full bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                Marcar semana {week} como revisada
              </button>
            </form>
          );
        })}
      </div>

      <p className="text-xs font-medium uppercase tracking-wide text-brand-secondary">
        🎥 Vídeos personalizados por semana
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {weeks.map((week) => {
          const form = forms.find((f) => f.week === week);
          return (
            <form
              key={week}
              action={updateQuincenalVideo}
              className="flex flex-col gap-2 rounded-2xl border border-black/5 bg-blanco-roto p-4"
            >
              <input type="hidden" name="userId" value={patientId} />
              <input type="hidden" name="week" value={week} />
              <input type="hidden" name="cycle" value={cycle} />
              <label className="flex flex-col gap-1 text-xs">
                Semana {week}
                <input
                  name="coachVideoUrl"
                  type="url"
                  defaultValue={form?.coachVideoUrl ?? ""}
                  placeholder="https://loom.com/share/..."
                  className="rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-primary"
                />
              </label>
              <button
                type="submit"
                className="self-start rounded-full bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                Guardar
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}

export default async function PacienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const patient = await prisma.user.findUnique({
    where: { id },
    include: { patientProfile: { include: { plan: true } } },
  });

  if (!patient || !patient.patientProfile) notFound();

  const progress = await getProgressSummary(patient.patientProfile.id);
  const clinicalNotes = await prisma.clinicalNote.findMany({
    where: { patientProfileId: patient.patientProfile.id },
    orderBy: { date: "desc" },
  });
  const symptomForm = await prisma.symptomForm.findUnique({
    where: { patientProfileId: patient.patientProfile.id },
  });
  const quincenalForms = await prisma.quincenalForm.findMany({
    where: { patientProfileId: patient.patientProfile.id },
  });
  const celebrationForm = await prisma.celebrationForm.findUnique({
    where: { patientProfileId: patient.patientProfile.id },
  });
  const closingForm = await prisma.closingForm.findUnique({
    where: { patientProfileId: patient.patientProfile.id },
  });
  const intakeScreening = await prisma.intakeScreening.findUnique({
    where: { patientProfileId: patient.patientProfile.id },
  });
  const planFiles = await prisma.patientPlanFile.findMany({
    where: { patientProfileId: patient.patientProfile.id },
  });
  const planFileByKey = new Map(planFiles.map((f) => [`${f.category}-${f.cycle}-${f.slot}`, f]));
  const eatingChecklist = await prisma.eatingChecklist.findUnique({
    where: { patientProfileId: patient.patientProfile.id },
  });
  const ruleAuditForm = await prisma.ruleAuditForm.findUnique({
    where: { patientProfileId: patient.patientProfile.id },
  });
  const commitmentForm = await prisma.commitmentForm.findUnique({
    where: { patientProfileId: patient.patientProfile.id },
  });
  const mealDiaryEntries = await prisma.mealDiaryEntry.findMany({
    where: { patientProfileId: patient.patientProfile.id },
  });
  const mealDiaryByWeekDay = new Map<string, MealDiaryEntryData>(
    mealDiaryEntries.filter((e) => e.cycle === 1).map((e) => [`${e.week}-${e.day}`, e]),
  );
  const mealDiaryByWeekDayRenewal = new Map<string, MealDiaryEntryData>(
    mealDiaryEntries.filter((e) => e.cycle === 2).map((e) => [`${e.week}-${e.day}`, e]),
  );
  const quincenalFormsCycle1 = quincenalForms.filter((f) => f.cycle === 1);
  const quincenalFormsCycle2 = quincenalForms.filter((f) => f.cycle === 2);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {patient.name}
            {patient.blocked && (
              <span className="ml-2 rounded-full bg-brand-primary-soft px-2.5 py-1 text-xs font-medium text-brand-primary align-middle">
                🔒 Bloqueada
              </span>
            )}
          </h1>
          <p className="text-sm text-foreground/60">{patient.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {patient.patientProfile.renewalEnabled ? (
            <span className="rounded-full bg-brand-tertiary-soft px-3 py-1.5 text-xs font-medium text-carbon">
              ✅ Renovación activa desde{" "}
              {patient.patientProfile.renewalPlanStartDate &&
                new Date(patient.patientProfile.renewalPlanStartDate).toLocaleDateString("es-ES")}
            </span>
          ) : (
            <form action={enableRenewal}>
              <input type="hidden" name="userId" value={patient.id} />
              <button
                type="submit"
                className="rounded-full bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                🔁 Habilitar renovación (12 semanas más)
              </button>
            </form>
          )}

          {patient.patientProfile.extraMonthEnabled ? (
            <span className="rounded-full bg-brand-tertiary-soft px-3 py-1.5 text-xs font-medium text-carbon">
              ✅ Mes extra activo desde{" "}
              {patient.patientProfile.extraMonthStartDate &&
                new Date(patient.patientProfile.extraMonthStartDate).toLocaleDateString("es-ES")}
            </span>
          ) : (
            <form action={enableExtraMonth}>
              <input type="hidden" name="userId" value={patient.id} />
              <button
                type="submit"
                className="rounded-full bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                ➕ Habilitar 1 mes extra (semanas 13-16)
              </button>
            </form>
          )}

          <form action={patient.blocked ? unblockPatient : blockPatient}>
            <input type="hidden" name="userId" value={patient.id} />
            <button
              type="submit"
              className="rounded-full border border-black/10 bg-blanco-roto px-3 py-1.5 text-xs font-medium hover:border-brand-primary"
            >
              {patient.blocked ? "🔓 Desbloquear acceso" : "🔒 Bloquear acceso"}
            </button>
          </form>

          <details className="relative">
            <summary className="cursor-pointer list-none rounded-full border border-black/10 bg-blanco-roto px-3 py-1.5 text-xs font-medium hover:border-brand-primary">
              🔑 Restablecer contraseña
            </summary>
            <form
              action={resetPatientPassword}
              className="absolute right-0 z-10 mt-2 flex w-64 flex-col gap-2 rounded-2xl border border-black/5 bg-blanco-roto p-4 shadow-md"
            >
              <input type="hidden" name="userId" value={patient.id} />
              <label className="flex flex-col gap-1 text-xs">
                Contraseña provisional nueva
                <input
                  name="password"
                  type="text"
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  className="rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-primary"
                />
              </label>
              <p className="text-xs text-foreground/50">
                Se la das a la paciente para que vuelva a entrar — le pedirá
                elegir la suya al hacerlo.
              </p>
              <button
                type="submit"
                className="self-start rounded-full bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                Guardar
              </button>
            </form>
          </details>
        </div>
      </div>

      <details className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <summary className="cursor-pointer font-semibold">🩺 Historial clínico</summary>

        {clinicalNotes.length > 0 && (
          <a
            href={`/api/coach/historial-clinico-pdf/${patient.id}`}
            className="mt-3 inline-block rounded-full bg-brand-primary px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            ⬇️ Descargar en PDF
          </a>
        )}

        <form action={addClinicalNote} className="mt-4 flex flex-col gap-2 rounded-xl bg-crema p-3">
          <input type="hidden" name="userId" value={patient.id} />
          <label className="flex flex-col gap-1 text-xs">
            Fecha
            <input
              name="date"
              type="date"
              required
              defaultValue={toDateInputValue(new Date())}
              className="w-40 rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-primary"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Apunte
            <textarea
              name="text"
              required
              rows={3}
              placeholder="Lo que le escribió por WhatsApp, algo que comentó en consulta..."
              className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          </label>
          <button
            type="submit"
            className="self-start rounded-full bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            Añadir al historial
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-3">
          {clinicalNotes.length === 0 ? (
            <p className="text-sm text-foreground/60">Todavía no hay ningún apunte.</p>
          ) : (
            clinicalNotes.map((note) => (
              <div key={note.id} className="rounded-lg bg-crema p-3 text-sm">
                <p className="text-xs font-medium text-brand-secondary">
                  {new Date(note.date).toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-foreground/80">{note.text}</p>
              </div>
            ))
          )}
        </div>
      </details>

      {symptomForm && (
        <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
          <p className="font-semibold">🪪 Ficha de la paciente</p>
          <p className="text-xs text-foreground/50">
            Rellenado por ella en el formulario de síntomas
            {symptomForm.submittedAt && (
              <> · {new Date(symptomForm.submittedAt).toLocaleDateString("es-ES")}</>
            )}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {PERSONAL_FIELDS.map((field) => {
              const value = symptomForm[field.id as keyof typeof symptomForm];
              if (value === null || value === undefined || value === "") return null;
              return (
                <div key={field.id} className="text-sm">
                  <span className="text-foreground/50">{field.label}: </span>
                  <span>{String(value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progreso</span>
          <span className="text-foreground/60">
            {progress.completedItems} / {progress.totalItems} pasos ·{" "}
            {progress.percent}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/5">
          <div
            className="h-full rounded-full bg-brand-tertiary"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      <ProgramTimeline
        userId={patient.id}
        title="Control del programa"
        planStartDate={patient.patientProfile.planStartDate}
        revision4Date={patient.patientProfile.revision4Date}
        revision8Date={patient.patientProfile.revision8Date}
        revision4Field="revision4Date"
        revision8Field="revision8Date"
        quincenalForms={quincenalFormsCycle1}
        symptomFormSubmittedAt={symptomForm?.submittedAt ?? null}
        intakeScreeningCompletedAt={intakeScreening?.completedAt ?? null}
        commitmentFormSubmittedAt={commitmentForm?.submittedAt ?? null}
        celebrationFormSubmittedAt={celebrationForm?.submittedAt ?? null}
        ruleAuditFormSubmittedAt={ruleAuditForm?.submittedAt ?? null}
        closingFormSubmittedAt={closingForm?.submittedAt ?? null}
      />

      {patient.patientProfile.renewalEnabled && (
        <ProgramTimeline
          userId={patient.id}
          title="Control del programa · Renovación"
          planStartDate={patient.patientProfile.renewalPlanStartDate}
          revision4Date={patient.patientProfile.renewalRevision4Date}
          revision8Date={patient.patientProfile.renewalRevision8Date}
          revision4Field="renewalRevision4Date"
          revision8Field="renewalRevision8Date"
          quincenalForms={quincenalFormsCycle2}
        />
      )}

      <details className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <summary className="cursor-pointer font-semibold">
          📝 Autocribado de inicio{" "}
          {intakeScreening?.completedAt ? (
            <span className="font-normal text-foreground/60">
              · guardado {new Date(intakeScreening.completedAt).toLocaleDateString("es-ES")}
            </span>
          ) : (
            <span className="font-normal text-foreground/60">· aún no lo ha rellenado</span>
          )}
        </summary>

        {intakeScreening?.completedAt && (
          <div className="mt-4">
            <IntakeScreeningSummary data={intakeScreening} />
          </div>
        )}
      </details>

      <details className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <summary className="cursor-pointer font-semibold">
          📝 Formulario de síntomas{" "}
          {symptomForm ? (
            <span className="font-normal text-foreground/60">
              · enviado {new Date(symptomForm.submittedAt ?? symptomForm.updatedAt).toLocaleDateString("es-ES")}
            </span>
          ) : (
            <span className="font-normal text-foreground/60">· aún no lo ha enviado</span>
          )}
        </summary>

        {symptomForm?.submittedAt && (
          <a
            href={`/api/coach/formulario-sintomas-pdf/${patient.id}`}
            className="mt-3 inline-block rounded-full bg-brand-primary px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            ⬇️ Descargar en PDF
          </a>
        )}

        {symptomForm && (
          <div className="mt-4">
            <SymptomFormSummary data={symptomForm} />
          </div>
        )}

        {symptomForm && (
          <details className="relative mt-4">
            <summary className="cursor-pointer list-none text-xs font-medium text-foreground/50 hover:text-brand-primary">
              🔄 Restablecer formulario
            </summary>
            <div className="absolute z-10 mt-2 flex w-72 flex-col gap-2 rounded-2xl border border-black/5 bg-blanco-roto p-4 shadow-md">
              <p className="text-xs text-foreground/60">
                Borra sus respuestas para siempre y vuelve a verlo vacío, para
                que lo rellene de cero. Úsalo solo si se equivocó al
                rellenarlo.
              </p>
              <form action={resetSymptomForm}>
                <input type="hidden" name="userId" value={patient.id} />
                <button
                  type="submit"
                  className="w-full rounded-full bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                >
                  Sí, restablecer
                </button>
              </form>
            </div>
          </details>
        )}
      </details>

      <details className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <summary className="cursor-pointer font-semibold">
          🧭 Tu línea de intentos y tu carta de compromiso · Semana 2{" "}
          {commitmentForm?.submittedAt ? (
            <span className="font-normal text-foreground/60">
              · enviado {new Date(commitmentForm.submittedAt).toLocaleDateString("es-ES")}
            </span>
          ) : (
            <span className="font-normal text-foreground/60">· aún no lo ha enviado</span>
          )}
        </summary>

        {commitmentForm?.submittedAt && (
          <div className="mt-4">
            <CommitmentFormSummary data={commitmentForm} />
          </div>
        )}
      </details>

      <details className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <summary className="cursor-pointer font-semibold">
          🎉 Mi momento de celebración · Semana 6{" "}
          {celebrationForm?.submittedAt ? (
            <span className="font-normal text-foreground/60">
              · enviado {new Date(celebrationForm.submittedAt).toLocaleDateString("es-ES")}
            </span>
          ) : (
            <span className="font-normal text-foreground/60">· aún no lo ha enviado</span>
          )}
        </summary>

        {celebrationForm?.submittedAt && (
          <div className="mt-4">
            <CelebrationFormSummary data={celebrationForm} />
          </div>
        )}
      </details>

      <details className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <summary className="cursor-pointer font-semibold">
          🎓 Formulario de cierre y valoración{" "}
          {closingForm?.submittedAt ? (
            <span className="font-normal text-foreground/60">
              · enviado {new Date(closingForm.submittedAt).toLocaleDateString("es-ES")}
            </span>
          ) : (
            <span className="font-normal text-foreground/60">· aún no lo ha enviado</span>
          )}
        </summary>

        {closingForm?.submittedAt && (
          <>
            <a
              href={`/api/coach/formulario-cierre-pdf/${patient.id}`}
              className="mt-3 inline-block rounded-full bg-brand-primary px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
            >
              ⬇️ Descargar en PDF
            </a>
            <div className="mt-4">
              <ClosingFormSummary data={closingForm} />
            </div>
          </>
        )}
      </details>

      <details className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <summary className="cursor-pointer font-semibold">
          🍽️ Cómo comer, no solo qué comer
        </summary>

        {eatingChecklist ? (
          <div className="mt-4">
            <EatingChecklistSummary data={eatingChecklist} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-foreground/60">Aún no ha empezado el checklist.</p>
        )}
      </details>

      <details className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <summary className="cursor-pointer font-semibold">
          📋 Auditoría de reglas · Semana 8{" "}
          {ruleAuditForm?.submittedAt ? (
            <span className="font-normal text-foreground/60">
              · enviado {new Date(ruleAuditForm.submittedAt).toLocaleDateString("es-ES")}
            </span>
          ) : (
            <span className="font-normal text-foreground/60">· aún no lo ha enviado</span>
          )}
        </summary>

        {ruleAuditForm?.submittedAt && (
          <div className="mt-4">
            <RuleAuditFormSummary data={ruleAuditForm} />
          </div>
        )}
      </details>

      <div className="flex flex-col gap-4">
        {PLAN_FILE_SECTIONS.map((section) => (
          <div key={section.category} className="flex flex-col gap-2">
            <p className="text-sm font-semibold">
              {section.emoji} {section.title}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {(patient.patientProfile!.extraMonthEnabled ? [1, 2, 3, 4, 5] : [1, 2, 3, 4]).map((slot) => (
                <PlanFileUploadRow
                  key={slot}
                  userId={patient.id}
                  category={section.category}
                  slot={slot}
                  label={`${section.title} ${slot}`}
                  currentUrl={planFileByKey.get(`${section.category}-1-${slot}`)?.url}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">🔓 Fase de reintroducción</p>
          <p className="text-xs text-foreground/60">
            En cuanto subas el primero de estos documentos, esta fase se
            desbloquea sola en el perfil de la paciente — no hace falta
            avisarla a mano.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {REINTRODUCTION_SLOTS.map((label, i) => (
              <PlanFileUploadRow
                key={label}
                userId={patient.id}
                category="reintroduccion"
                slot={i + 1}
                label={label}
                currentUrl={planFileByKey.get(`reintroduccion-1-${i + 1}`)?.url}
              />
            ))}
          </div>
        </div>
      </div>

      {patient.patientProfile.renewalEnabled && (
        <div className="flex flex-col gap-4">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-secondary">
            Renovación
          </p>
          {RENEWAL_PLAN_FILE_SECTIONS.map((section) => (
            <div key={section.category} className="flex flex-col gap-2">
              <p className="text-sm font-semibold">
                {section.emoji} {section.title} · Renovación
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {[1, 2, 3, 4].map((slot) => (
                  <PlanFileUploadRow
                    key={slot}
                    userId={patient.id}
                    category={section.category}
                    slot={slot}
                    cycle={2}
                    label={`${section.title} ${slot}`}
                    currentUrl={planFileByKey.get(`${section.category}-2-${slot}`)?.url}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold">🔓 Fase de reintroducción · Renovación</p>
            <p className="text-xs text-foreground/60">
              En cuanto subas el primero de estos documentos, esta fase se
              desbloquea sola en el perfil de la paciente — no hace falta
              avisarla a mano.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {REINTRODUCTION_SLOTS.map((label, i) => (
                <PlanFileUploadRow
                  key={label}
                  userId={patient.id}
                  category="reintroduccion"
                  slot={i + 1}
                  cycle={2}
                  label={label}
                  currentUrl={planFileByKey.get(`reintroduccion-2-${i + 1}`)?.url}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <QuincenalSection patientId={patient.id} forms={quincenalFormsCycle1} cycle={1} title="📅 Revisión quincenal · Semana 2 / 6 / 10" />

      {patient.patientProfile.renewalEnabled && (
        <QuincenalSection
          patientId={patient.id}
          forms={quincenalFormsCycle2}
          cycle={2}
          title="📅 Revisión quincenal · Renovación · Semana 2 / 6 / 10"
        />
      )}

      {patient.patientProfile.extraMonthEnabled && (
        <QuincenalSection
          patientId={patient.id}
          forms={quincenalFormsCycle1}
          cycle={1}
          title="📅 Revisión quincenal · Mes extra · Semana 14"
          weeks={[14]}
        />
      )}

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">📔 Registro de comidas y síntomas</h2>
        <MealDiarySummary
          entries={mealDiaryByWeekDay}
          weeks={
            patient.patientProfile.extraMonthEnabled
              ? Array.from({ length: 16 }, (_, i) => i + 1)
              : undefined
          }
        />
      </div>

      {patient.patientProfile.renewalEnabled && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">📔 Registro de comidas y síntomas · Renovación</h2>
          <MealDiarySummary entries={mealDiaryByWeekDayRenewal} />
        </div>
      )}

      <div className="rounded-2xl border border-brand-primary/30 bg-brand-primary-soft/40 p-5">
        <p className="font-semibold text-brand-primary">⚠️ Eliminar paciente</p>
        <p className="mt-1 text-sm text-foreground/70">
          Borra a {patient.name} y todos sus datos (formularios, planes,
          registro de comidas, citas...) para siempre. No se puede deshacer.
        </p>
        <form action={deletePatient} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="userId" value={patient.id} />
          <label className="flex flex-col gap-1 text-xs">
            Escribe ELIMINAR para confirmar
            <input
              name="confirm"
              required
              className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Eliminar paciente definitivamente
          </button>
        </form>
      </div>
    </div>
  );
}
