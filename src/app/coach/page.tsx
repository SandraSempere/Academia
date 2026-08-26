import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPatientsWithStatus } from "@/lib/patient";
import { isTimeTbd, formularioWeekOverdue } from "@/lib/revisiones";
import { markPatientActivationSeen } from "@/app/coach/actions";

export const dynamic = "force-dynamic";

const WEEKDAY_FULL = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];
const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

type ProfileWithForms = {
  planStartDate: Date | null;
  revision4Date: Date | null;
  revision8Date: Date | null;
  symptomForm: { submittedAt: Date | null } | null;
  quincenalForms: { week: number; cycle: number; submittedAt: Date | null }[];
  celebrationForm: { submittedAt: Date | null } | null;
  ruleAuditForm: { submittedAt: Date | null } | null;
  commitmentForm: { submittedAt: Date | null } | null;
  closingForm: { submittedAt: Date | null } | null;
};

const FORM_CHECKS: {
  label: string;
  done: (p: ProfileWithForms) => boolean;
  // Si no está, se considera pendiente en cuanto no está hecho (como
  // siempre). Si está, además hace falta que ya haya llegado su fecha —
  // para no avisar de una revisión quincenal antes de que le toque.
  isDue?: (p: ProfileWithForms, today: Date) => boolean;
}[] = [
  { label: "Formulario de síntomas", done: (p) => !!p.symptomForm?.submittedAt },
  {
    label: "Tu línea de intentos y carta de compromiso",
    done: (p) => !!p.commitmentForm?.submittedAt,
  },
  {
    label: "Revisión quincenal · Semana 2",
    done: (p) => p.quincenalForms.some((f) => f.cycle === 1 && f.week === 2 && f.submittedAt),
    isDue: (p, today) => formularioWeekOverdue(p.planStartDate, p.revision4Date, p.revision8Date, 2, today),
  },
  {
    label: "Revisión quincenal · Semana 6",
    done: (p) => p.quincenalForms.some((f) => f.cycle === 1 && f.week === 6 && f.submittedAt),
    isDue: (p, today) => formularioWeekOverdue(p.planStartDate, p.revision4Date, p.revision8Date, 6, today),
  },
  { label: "Mi momento de celebración · Semana 6", done: (p) => !!p.celebrationForm?.submittedAt },
  { label: "Auditoría de reglas · Semana 8", done: (p) => !!p.ruleAuditForm?.submittedAt },
  {
    label: "Revisión quincenal · Semana 10",
    done: (p) => p.quincenalForms.some((f) => f.cycle === 1 && f.week === 10 && f.submittedAt),
    isDue: (p, today) => formularioWeekOverdue(p.planStartDate, p.revision4Date, p.revision8Date, 10, today),
  },
  { label: "Formulario de cierre y valoración", done: (p) => !!p.closingForm?.submittedAt },
];

export default async function CoachHomePage() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const upcomingLimit = new Date(todayStart);
  upcomingLimit.setDate(upcomingLimit.getDate() + 10);
  upcomingLimit.setHours(23, 59, 59, 999);

  const [{ patients, activas, finalizadas }, todayAppointments, upcomingAppointments, quincenalToReview, autoAppointments, newlyActivated] =
    await Promise.all([
      getPatientsWithStatus(),
      prisma.appointment.findMany({
        where: { date: { gte: todayStart, lte: todayEnd } },
        orderBy: { date: "asc" },
        include: { patientProfile: { include: { user: true } } },
      }),
      prisma.appointment.findMany({
        where: { date: { gt: todayEnd, lte: upcomingLimit } },
        orderBy: { date: "asc" },
        include: { patientProfile: { include: { user: true } } },
      }),
      prisma.quincenalForm.findMany({
        where: { submittedAt: { not: null }, reviewedAt: null },
        orderBy: { submittedAt: "asc" },
        include: { patientProfile: { include: { user: true } } },
      }),
      prisma.appointment.findMany({
        where: { source: { not: null } },
        orderBy: { date: "asc" },
        include: { patientProfile: { include: { user: true } } },
      }),
      prisma.patientProfile.findMany({
        where: { activatedAt: { not: null }, activatedSeenAt: null },
        orderBy: { activatedAt: "desc" },
        include: { user: true },
      }),
    ]);

  const needsTime = autoAppointments.filter((a) => isTimeTbd(a.date));

  const pendingByPatient = activas
    .filter((p) => p.patientProfile)
    .map((p) => ({
      patient: p,
      pending: FORM_CHECKS.filter((check) => {
        const profile = p.patientProfile as ProfileWithForms;
        if (check.done(profile)) return false;
        return check.isDue ? check.isDue(profile, now) : true;
      }),
    }))
    .filter((entry) => entry.pending.length > 0);

  const dateLabel = `${WEEKDAY_FULL[now.getDay()]}, ${now.getDate()} de ${MONTH_NAMES[now.getMonth()]}`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-foreground/60">Hoy es</p>
        <h1 className="text-2xl font-semibold">{dateLabel}</h1>
      </div>

      {newlyActivated.length > 0 && (
        <div className="rounded-2xl border border-black/5 bg-brand-tertiary-soft p-5">
          <p className="font-semibold">🎉 Nuevas pacientes</p>
          <div className="mt-3 flex flex-col gap-2">
            {newlyActivated.map((profile) => (
              <div
                key={profile.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-blanco-roto px-3 py-2 text-sm"
              >
                <Link href={`/coach/pacientes/${profile.user.id}`} className="font-medium hover:text-brand-primary">
                  {profile.user.name} se ha unido a tu programa
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-foreground/60">
                    {profile.activatedAt && new Date(profile.activatedAt).toLocaleDateString("es-ES")}
                  </span>
                  <form action={markPatientActivationSeen}>
                    <input type="hidden" name="userId" value={profile.user.id} />
                    <button type="submit" className="text-xs text-brand-primary underline hover:opacity-80">
                      Marcar como visto
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Pacientes" value={patients.length} />
        <StatCard label="Activas" value={activas.length} />
        <StatCard label="Finalizadas" value={finalizadas.length} />
        <StatCard label="Citas hoy" value={todayAppointments.length} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
          <p className="font-semibold">🗓️ Citas de hoy</p>
          {todayAppointments.length === 0 ? (
            <p className="mt-2 text-sm text-foreground/60">No tienes citas hoy.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {todayAppointments.map((appt) => (
                <Link
                  key={appt.id}
                  href={appt.patientProfile ? `/coach/pacientes/${appt.patientProfile.user.id}` : "/coach/agenda"}
                  className="flex items-center justify-between rounded-lg bg-brand-secondary-soft/60 px-3 py-2 text-sm hover:bg-brand-secondary-soft"
                >
                  <span>{appt.patientProfile?.user.name ?? appt.title ?? "Cita"}</span>
                  <span className="text-foreground/60">
                    {appt.date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
          <p className="font-semibold">⏭️ Próximas citas</p>
          {upcomingAppointments.length === 0 ? (
            <p className="mt-2 text-sm text-foreground/60">No hay citas próximas.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {upcomingAppointments.map((appt) => (
                <Link
                  key={appt.id}
                  href={appt.patientProfile ? `/coach/pacientes/${appt.patientProfile.user.id}` : "/coach/agenda"}
                  className="flex items-center justify-between rounded-lg bg-brand-secondary-soft/60 px-3 py-2 text-sm hover:bg-brand-secondary-soft"
                >
                  <span>{appt.patientProfile?.user.name ?? appt.title ?? "Cita"}</span>
                  <span className="text-foreground/60">
                    {appt.date.toLocaleDateString("es-ES")} ·{" "}
                    {appt.date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {needsTime.length > 0 && (
        <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
          <p className="font-semibold">⏰ Citas de revisión sin hora</p>
          <p className="mt-1 text-xs text-foreground/50">
            Se han añadido solas a tu Agenda al calcularse — cuadra la hora
            con cada paciente y ponla desde Agenda.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {needsTime.map((appt) => (
              <Link
                key={appt.id}
                href="/coach/agenda"
                className="flex items-center justify-between rounded-lg bg-brand-primary-soft px-3 py-2 text-sm hover:opacity-90"
              >
                <span>
                  {appt.patientProfile?.user.name} ·{" "}
                  {appt.source === "revision4" ? "Revisión semana 4" : "Revisión semana 8"}
                </span>
                <span className="text-foreground/60">{appt.date.toLocaleDateString("es-ES")}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <p className="font-semibold">📋 Revisiones quincenales por revisar</p>
        {quincenalToReview.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/60">No tienes revisiones pendientes de leer.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {quincenalToReview.map((form) => (
              <Link
                key={form.id}
                href={`/coach/pacientes/${form.patientProfile.user.id}`}
                className="flex items-center justify-between rounded-lg bg-brand-primary-soft px-3 py-2 text-sm hover:opacity-90"
              >
                <span>
                  {form.patientProfile.user.name} · Semana {form.week}
                </span>
                <span className="text-foreground/60">
                  {form.submittedAt && new Date(form.submittedAt).toLocaleDateString("es-ES")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <p className="font-semibold">📝 Formularios pendientes de tus pacientes</p>
        {pendingByPatient.length === 0 ? (
          <p className="mt-2 text-sm text-foreground/60">
            Todas tus pacientes activas están al día con sus formularios.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {pendingByPatient.map(({ patient, pending }) => (
              <Link
                key={patient.id}
                href={`/coach/pacientes/${patient.id}`}
                className="rounded-lg bg-brand-secondary-soft/60 px-3 py-2 text-sm hover:bg-brand-secondary-soft"
              >
                <p className="font-medium">
                  {patient.name} <span className="font-normal text-foreground/60">· {pending.length} pendiente{pending.length > 1 ? "s" : ""}</span>
                </p>
                <p className="mt-0.5 text-xs text-foreground/50">
                  {pending.map((p) => p.label).join(" · ")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-brand-primary-soft p-4 text-center">
      <p className="text-2xl font-semibold text-brand-secondary">{value}</p>
      <p className="text-xs text-foreground/70">{label}</p>
    </div>
  );
}
