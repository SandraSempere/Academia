import Link from "next/link";
import { getCurrentPatientProfile } from "@/lib/patient";
import { prisma } from "@/lib/prisma";
import {
  formularioBannerStatus,
  extraMonthFormularioBannerStatus,
  computeCheckpoints,
  computeExtraMonthCheckpoints,
  isTimeTbd,
  atMidnight,
} from "@/lib/revisiones";

export const dynamic = "force-dynamic";

type FormularioCheckpoint = { label: string; date: Date; week: 2 | 6 | 10 | 14 };

function FormularioChecklist({
  title,
  checkpoints,
  isSubmitted,
  cycle,
}: {
  title: string;
  checkpoints: FormularioCheckpoint[];
  isSubmitted: (week: number) => boolean;
  cycle: 1 | 2;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground/60">{title}</p>
      <div className="mt-2 flex flex-col gap-2">
        {checkpoints.map((checkpoint) => {
          const submitted = isSubmitted(checkpoint.week);
          return submitted ? (
            <div
              key={checkpoint.week}
              className="flex items-center justify-between rounded-2xl border border-black/5 bg-blanco-roto px-4 py-3 text-sm"
            >
              <span>
                {checkpoint.label} · {checkpoint.date.toLocaleDateString("es-ES")}
              </span>
              <span className="font-medium text-brand-tertiary">✅ Enviado</span>
            </div>
          ) : (
            <Link
              key={checkpoint.week}
              href={`/revision-quincenal/${checkpoint.week}${cycle === 2 ? "?cycle=2" : ""}`}
              className="flex items-center justify-between rounded-2xl bg-brand-primary px-4 py-3 text-sm font-medium text-white hover:opacity-90"
            >
              <span>
                {checkpoint.label} · {checkpoint.date.toLocaleDateString("es-ES")}
              </span>
              <span>Rellenar →</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default async function CitasPage() {
  const profile = await getCurrentPatientProfile();

  const [quincenalForms, appointments] = await Promise.all([
    profile ? prisma.quincenalForm.findMany({ where: { patientProfileId: profile.id } }) : [],
    profile
      ? prisma.appointment.findMany({
          where: { patientProfileId: profile.id },
          orderBy: { date: "asc" },
        })
      : [],
  ]);

  const today = new Date();
  const isSubmitted = (cycle: number, week: number) =>
    quincenalForms.some((f) => f.cycle === cycle && f.week === week && f.submittedAt);

  const dueCycle1 = profile?.planStartDate
    ? formularioBannerStatus(profile.planStartDate, profile.revision4Date, profile.revision8Date, (week) => isSubmitted(1, week), today)
    : null;
  const dueCycle2 =
    profile?.renewalEnabled && profile.renewalPlanStartDate
      ? formularioBannerStatus(
          profile.renewalPlanStartDate,
          profile.renewalRevision4Date,
          profile.renewalRevision8Date,
          (week) => isSubmitted(2, week),
          today,
        )
      : null;
  const dueExtraMonth = profile?.extraMonthEnabled
    ? extraMonthFormularioBannerStatus(profile.extraMonthStartDate, isSubmitted(1, 14), today)
    : null;

  const dueFormulario = dueCycle1
    ? { ...dueCycle1, cycle: 1 as const }
    : dueCycle2
      ? { ...dueCycle2, cycle: 2 as const }
      : dueExtraMonth
        ? { ...dueExtraMonth, cycle: 1 as const }
        : null;

  function onlyFormularios<W extends number>(
    checkpoints: { label: string; date: Date; formWeek?: W }[],
  ): FormularioCheckpoint[] {
    return checkpoints
      .filter((c): c is { label: string; date: Date; formWeek: W } => c.formWeek !== undefined)
      .map((c) => ({ label: c.label, date: c.date, week: c.formWeek as unknown as 2 | 6 | 10 | 14 }));
  }

  const checkpointsCycle1: FormularioCheckpoint[] = profile?.planStartDate
    ? onlyFormularios(computeCheckpoints(profile.planStartDate, profile.revision4Date, profile.revision8Date))
    : [];

  const checkpointsCycle2: FormularioCheckpoint[] =
    profile?.renewalEnabled && profile.renewalPlanStartDate
      ? onlyFormularios(
          computeCheckpoints(profile.renewalPlanStartDate, profile.renewalRevision4Date, profile.renewalRevision8Date),
        )
      : [];

  const checkpointsExtraMonth: FormularioCheckpoint[] = profile?.extraMonthEnabled
    ? onlyFormularios(computeExtraMonthCheckpoints(profile.extraMonthStartDate!))
    : [];

  // Solo citas con hora ya puesta por la coach (si sigue en 00:00 es que
  // todavía no la ha coordinado) y que no hayan pasado ya.
  const upcomingAppointments = appointments.filter(
    (appt) => !isTimeTbd(appt.date) && appt.date.getTime() >= atMidnight(today).getTime(),
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">📅 Citas</h1>
        <p className="mt-1 text-foreground/70">
          Tus próximas citas y qué formulario te toca rellenar.
        </p>
      </div>

      {dueFormulario && (
        <Link
          href={`/revision-quincenal/${dueFormulario.week}${dueFormulario.cycle === 2 ? "?cycle=2" : ""}`}
          className="flex items-center justify-between rounded-2xl bg-brand-primary px-5 py-4 text-sm font-medium text-white hover:opacity-90"
        >
          <span>
            📋{" "}
            {dueFormulario.when === "hoy"
              ? "Hoy toca"
              : dueFormulario.when === "mañana"
                ? "Mañana toca"
                : "Tienes pendiente"}{" "}
            tu {dueFormulario.label.toLowerCase()}
            {dueFormulario.cycle === 2 ? " · Renovación" : ""}
          </span>
          <span>Rellenar →</span>
        </Link>
      )}

      {(checkpointsCycle1.length > 0 || checkpointsCycle2.length > 0 || checkpointsExtraMonth.length > 0) && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">📝 Tus formularios</h2>
          {checkpointsCycle1.length > 0 && (
            <FormularioChecklist
              title="Semanas 2, 6 y 10"
              checkpoints={checkpointsCycle1}
              isSubmitted={(week) => isSubmitted(1, week)}
              cycle={1}
            />
          )}
          {checkpointsCycle2.length > 0 && (
            <FormularioChecklist
              title="Semanas 2, 6 y 10 · Renovación"
              checkpoints={checkpointsCycle2}
              isSubmitted={(week) => isSubmitted(2, week)}
              cycle={2}
            />
          )}
          {checkpointsExtraMonth.length > 0 && (
            <FormularioChecklist
              title="Semana 14 · Mes extra"
              checkpoints={checkpointsExtraMonth}
              isSubmitted={(week) => isSubmitted(1, week)}
              cycle={1}
            />
          )}
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold">Próximas citas</h2>
        {upcomingAppointments.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/60">
            Todavía no tienes ninguna cita con fecha y hora confirmadas. En
            cuanto la coordine contigo aparecerá aquí.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {upcomingAppointments.map((appt) => (
              <div key={appt.id} className="rounded-2xl border border-black/5 bg-blanco-roto p-4">
                <p className="font-medium capitalize">
                  {appt.date.toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  · {appt.date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                </p>
                {appt.notes && <p className="mt-1 text-sm text-foreground/70">{appt.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
