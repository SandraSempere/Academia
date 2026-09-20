import Link from "next/link";
import { getCurrentPatientProfile } from "@/lib/patient";
import { prisma } from "@/lib/prisma";
import { formularioBannerStatus, extraMonthFormularioBannerStatus, isTimeTbd, atMidnight } from "@/lib/revisiones";

export const dynamic = "force-dynamic";

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
