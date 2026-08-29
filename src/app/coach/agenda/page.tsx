import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createAppointment, deleteAppointment, updateAppointment } from "@/app/coach/actions";
import { computeCheckpoints, isTimeTbd } from "@/lib/revisiones";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toDatetimeLocalValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getMonthGrid(year: number, month: number) {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // lunes = 0
  const gridStart = new Date(year, month, 1 - startWeekday);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m - 1;
  }

  const days = getMonthGrid(year, month);
  const rangeStart = days[0];
  const rangeEnd = new Date(days[days.length - 1]);
  rangeEnd.setHours(23, 59, 59, 999);

  const [appointments, patients] = await Promise.all([
    prisma.appointment.findMany({
      where: { date: { gte: rangeStart, lte: rangeEnd } },
      orderBy: { date: "asc" },
      include: { patientProfile: { include: { user: true } } },
    }),
    prisma.user.findMany({
      where: { role: "PATIENT" },
      orderBy: { name: "asc" },
      include: { patientProfile: { include: { quincenalForms: true } } },
    }),
  ]);

  const appointmentsByDay = new Map<string, typeof appointments>();
  for (const appt of appointments) {
    const key = dateKey(appt.date);
    const list = appointmentsByDay.get(key) ?? [];
    list.push(appt);
    appointmentsByDay.set(key, list);
  }

  // Fechas de "toca formulario" (semana 2/6/10) — no son citas reales en la
  // Agenda (no tienen hora ni se editan/borran aquí), son las mismas fechas
  // calculadas que ya se usan en /coach/revisiones y en los recordatorios
  // por email; aquí solo se muestran para tenerlas también de un vistazo.
  type FormDueEntry = {
    patientId: string;
    patientName: string;
    week: 2 | 6 | 10;
    cycle: 1 | 2;
    submitted: boolean;
  };
  const formDueByDay = new Map<string, FormDueEntry[]>();
  const addFormDueEntry = (dateStr: string, entry: FormDueEntry) => {
    const list = formDueByDay.get(dateStr) ?? [];
    list.push(entry);
    formDueByDay.set(dateStr, list);
  };
  for (const patient of patients) {
    const profile = patient.patientProfile;
    if (!profile) continue;

    if (profile.planStartDate) {
      const checkpoints = computeCheckpoints(profile.planStartDate, profile.revision4Date, profile.revision8Date);
      for (const checkpoint of checkpoints) {
        if (!("formWeek" in checkpoint)) continue;
        addFormDueEntry(dateKey(checkpoint.date), {
          patientId: patient.id,
          patientName: patient.name,
          week: checkpoint.formWeek!,
          cycle: 1,
          submitted: profile.quincenalForms.some(
            (f) => f.cycle === 1 && f.week === checkpoint.formWeek && f.submittedAt,
          ),
        });
      }
    }

    if (profile.renewalEnabled && profile.renewalPlanStartDate) {
      const checkpoints = computeCheckpoints(
        profile.renewalPlanStartDate,
        profile.renewalRevision4Date,
        profile.renewalRevision8Date,
      );
      for (const checkpoint of checkpoints) {
        if (!("formWeek" in checkpoint)) continue;
        addFormDueEntry(dateKey(checkpoint.date), {
          patientId: patient.id,
          patientName: patient.name,
          week: checkpoint.formWeek!,
          cycle: 2,
          submitted: profile.quincenalForms.some(
            (f) => f.cycle === 2 && f.week === checkpoint.formWeek && f.submittedAt,
          ),
        });
      }
    }
  }

  const prevMonth = month === 0 ? { year: year - 1, month: 12 } : { year, month };
  const nextMonth = month === 11 ? { year: year + 1, month: 1 } : { year, month: month + 2 };
  const prevHref = `/coach/agenda?month=${prevMonth.year}-${String(prevMonth.month).padStart(2, "0")}`;
  const nextHref = `/coach/agenda?month=${nextMonth.year}-${String(nextMonth.month).padStart(2, "0")}`;
  const todayKey = dateKey(now);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">📅 Agenda</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href={prevHref} className="rounded-full border border-black/10 px-3 py-1.5 hover:border-brand-primary">
            ← Anterior
          </Link>
          <span className="font-medium">
            {MONTH_NAMES[month]} {year}
          </span>
          <Link href={nextHref} className="rounded-full border border-black/10 px-3 py-1.5 hover:border-brand-primary">
            Siguiente →
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-blanco-roto p-3">
        <div className="grid min-w-[640px] grid-cols-7 gap-1 text-xs font-medium uppercase tracking-wide text-foreground/50">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="px-2 py-1">
              {label}
            </div>
          ))}
        </div>
        <div className="grid min-w-[640px] grid-cols-7 gap-1">
          {days.map((day) => {
            const key = dateKey(day);
            const inMonth = day.getMonth() === month;
            const dayAppointments = appointmentsByDay.get(key) ?? [];
            return (
              <div
                key={key}
                className={`min-h-[100px] rounded-lg border p-1.5 text-xs ${
                  key === todayKey
                    ? "border-brand-primary bg-brand-primary-soft/40"
                    : "border-black/5"
                } ${inMonth ? "" : "opacity-40"}`}
              >
                <p className="text-right text-[11px] text-foreground/50">{day.getDate()}</p>
                <div className="mt-1 flex flex-col gap-1">
                  {dayAppointments.map((appt) => {
                    const tbd = isTimeTbd(appt.date);
                    const label = appt.patientProfile?.user.name ?? appt.title ?? "Cita";
                    return (
                      <div
                        key={appt.id}
                        className={`rounded px-1.5 py-1 ${
                          tbd ? "bg-brand-primary-soft" : "bg-brand-secondary-soft/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate">
                            {tbd
                              ? "⏰ falta hora"
                              : appt.date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}{" "}
                            {label}
                          </span>
                          <form action={deleteAppointment}>
                            <input type="hidden" name="appointmentId" value={appt.id} />
                            <button type="submit" className="shrink-0 text-foreground/40 hover:text-brand-primary">
                              ×
                            </button>
                          </form>
                        </div>

                        <details open={tbd}>
                          <summary className="cursor-pointer text-[10px] text-foreground/50 hover:text-brand-primary">
                            ℹ️ ver cita
                          </summary>
                          <div className="mt-1 flex flex-col gap-0.5 rounded bg-blanco-roto px-1.5 py-1 text-[10px] text-foreground/70">
                            <p>
                              <span className="font-medium">Paciente:</span>{" "}
                              {appt.patientProfile?.user.name ?? appt.title ?? "Sin paciente"}
                            </p>
                            <p>
                              <span className="font-medium">Día:</span>{" "}
                              {appt.date.toLocaleDateString("es-ES", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              })}
                            </p>
                            <p>
                              <span className="font-medium">Hora:</span>{" "}
                              {tbd
                                ? "Sin hora asignada"
                                : appt.date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                            {appt.notes && (
                              <p>
                                <span className="font-medium">Nota:</span> {appt.notes}
                              </p>
                            )}
                          </div>
                          <form
                            action={updateAppointment}
                            className="mt-1 flex flex-col gap-1"
                          >
                            <input type="hidden" name="appointmentId" value={appt.id} />
                            {!appt.patientProfileId && (
                              <input
                                name="title"
                                type="text"
                                defaultValue={appt.title ?? ""}
                                placeholder="Título"
                                className="w-full min-w-0 rounded border border-black/10 px-1 py-0.5 text-[10px]"
                              />
                            )}
                            <input
                              name="date"
                              type="datetime-local"
                              required
                              defaultValue={toDatetimeLocalValue(appt.date)}
                              className="w-full min-w-0 rounded border border-black/10 px-1 py-0.5 text-[10px]"
                            />
                            <input
                              name="notes"
                              type="text"
                              defaultValue={appt.notes ?? ""}
                              placeholder="Nota (opcional)"
                              className="w-full min-w-0 rounded border border-black/10 px-1 py-0.5 text-[10px]"
                            />
                            <button
                              type="submit"
                              className="self-start text-[10px] font-medium text-brand-primary underline"
                            >
                              Guardar
                            </button>
                          </form>
                        </details>
                      </div>
                    );
                  })}
                  {(formDueByDay.get(key) ?? []).map((entry) => (
                    <Link
                      key={`${entry.patientId}-${entry.cycle}-${entry.week}`}
                      href={`/coach/pacientes/${entry.patientId}`}
                      className="block truncate rounded bg-brand-tertiary-soft px-1.5 py-1 hover:opacity-80"
                    >
                      📝 {entry.patientName} · Sem. {entry.week}
                      {entry.cycle === 2 ? " · Ren." : ""}
                      {entry.submitted ? " ✓" : ""}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form
        action={createAppointment}
        className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-blanco-roto p-5 sm:flex-row sm:items-end sm:flex-wrap"
      >
        <p className="w-full text-sm font-medium">Nueva cita</p>
        <label className="flex flex-col gap-1 text-sm">
          Paciente
          <select
            name="userId"
            className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-primary"
          >
            <option value="">— Sin paciente —</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Título (si no es de una paciente)
          <input
            name="title"
            type="text"
            placeholder="Llamada proveedor, gestión..."
            className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-primary"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Fecha y hora
          <input
            name="date"
            type="datetime-local"
            required
            className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-primary"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Nota (opcional)
          <input
            name="notes"
            type="text"
            placeholder="Videollamada de revisión, semana 4..."
            className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-primary"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-brand-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Añadir cita
        </button>
      </form>
    </div>
  );
}
