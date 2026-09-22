import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { computeCheckpoints, formularioAlert, computeExtraMonthCheckpoints, extraMonthFormularioAlert } from "@/lib/revisiones";
import { updateRevisionDate } from "@/app/coach/actions";

export const dynamic = "force-dynamic";

function toDateInputValue(date: Date) {
  // Fecha local (no UTC) — con toISOString() una medianoche local en
  // Europe/Madrid (UTC+1/+2) se desplaza al día anterior.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type Row = {
  id: string;
  name: string;
  email: string;
  planStartDate: Date | null;
  revision4Date: Date | null;
  revision8Date: Date | null;
  quincenalWeeksSubmitted: Set<number>;
  // Mes extra (semanas 13-16) — solo existe en el ciclo original, nunca en
  // la renovación (ver comentario en src/lib/plan-file-categories.ts).
  extraMonthEnabled?: boolean;
  extraMonthStartDate?: Date | null;
};

function RevisionesTable({
  rows,
  revision4Field,
  revision8Field,
  today,
  showExtraMonth,
}: {
  rows: Row[];
  revision4Field: string;
  revision8Field: string;
  today: Date;
  // Añade "Formulario semana 14" y "Revisión final semana 16" al final de
  // la misma fila en vez de una tabla aparte — el mes extra continúa donde
  // ya está la paciente, no como un apartado nuevo debajo.
  showExtraMonth?: boolean;
}) {
  const dashColumns = showExtraMonth ? 9 : 7;

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/5 bg-blanco-roto">
      <table className="w-full min-w-[1000px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-black/5 text-left">
            <th className="p-3 font-medium text-foreground/50">Paciente</th>
            <th className="p-3 font-medium text-foreground/50">Email</th>
            <th className="p-3 font-medium text-foreground/50">Inicio plan</th>
            <th className="p-3 font-medium text-foreground/50">Formulario semana 2</th>
            <th className="p-3 font-medium text-foreground/50">Revisión semana 4</th>
            <th className="p-3 font-medium text-foreground/50">Formulario semana 6</th>
            <th className="p-3 font-medium text-foreground/50">Revisión semana 8</th>
            <th className="p-3 font-medium text-foreground/50">Formulario semana 10</th>
            <th className="p-3 font-medium text-foreground/50">Revisión final semana 12</th>
            {showExtraMonth && (
              <>
                <th className="p-3 font-medium text-foreground/50">Formulario semana 14</th>
                <th className="p-3 font-medium text-foreground/50">Revisión final semana 16</th>
              </>
            )}
            <th className="p-3 font-medium text-foreground/50">Avisos</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            if (!row.planStartDate) {
              return (
                <tr key={row.id} className="border-b border-black/5 align-top">
                  <td className="p-3">
                    <Link href={`/coach/pacientes/${row.id}`} className="font-medium hover:text-brand-primary">
                      {row.name}
                    </Link>
                  </td>
                  <td className="p-3 text-foreground/70">{row.email}</td>
                  {Array.from({ length: dashColumns }).map((_, i) => (
                    <td key={i} className="p-3 text-foreground/30">
                      —
                    </td>
                  ))}
                </tr>
              );
            }

            const checkpoints = computeCheckpoints(row.planStartDate, row.revision4Date, row.revision8Date);
            const hasExtraMonth = showExtraMonth && row.extraMonthEnabled && row.extraMonthStartDate;
            const [extraFormulario14, extraRevisionFinal16] = hasExtraMonth
              ? computeExtraMonthCheckpoints(row.extraMonthStartDate!)
              : [null, null];
            const alert =
              formularioAlert(row.planStartDate, row.revision4Date, row.revision8Date, today) ??
              (hasExtraMonth ? extraMonthFormularioAlert(row.extraMonthStartDate!, today) : null);

            return (
              <tr
                key={row.id}
                className={`border-b border-black/5 align-top ${alert ? "bg-brand-primary-soft" : ""}`}
              >
                <td className="p-3">
                  <Link href={`/coach/pacientes/${row.id}`} className="font-medium hover:text-brand-primary">
                    {row.name}
                  </Link>
                </td>
                <td className="p-3 text-foreground/70">{row.email}</td>
                <td className="p-3 text-foreground/70">{row.planStartDate.toLocaleDateString("es-ES")}</td>
                {checkpoints.map((checkpoint) => {
                  const editableField =
                    checkpoint.label === "Revisión semana 4"
                      ? revision4Field
                      : checkpoint.label === "Revisión semana 8"
                        ? revision8Field
                        : null;
                  const submitted = checkpoint.formWeek
                    ? row.quincenalWeeksSubmitted.has(checkpoint.formWeek)
                    : null;

                  return (
                    <td key={checkpoint.label} className="p-3 text-foreground/70">
                      {editableField ? (
                        <form action={updateRevisionDate} className="flex flex-col gap-1">
                          <input type="hidden" name="userId" value={row.id} />
                          <input type="hidden" name="field" value={editableField} />
                          <input
                            name="date"
                            type="date"
                            defaultValue={toDateInputValue(checkpoint.date)}
                            className="rounded border border-black/10 px-1.5 py-1 text-xs outline-none focus:border-brand-primary"
                          />
                          <button
                            type="submit"
                            className="self-start text-xs text-brand-primary underline hover:opacity-80"
                          >
                            Guardar
                          </button>
                        </form>
                      ) : (
                        <>
                          {checkpoint.date.toLocaleDateString("es-ES")}
                          {submitted && <span className="ml-1 text-brand-tertiary">✓</span>}
                        </>
                      )}
                    </td>
                  );
                })}
                {showExtraMonth && (
                  <>
                    <td className="p-3 text-foreground/70">
                      {extraFormulario14 ? (
                        <>
                          {extraFormulario14.date.toLocaleDateString("es-ES")}
                          {row.quincenalWeeksSubmitted.has(14) && (
                            <span className="ml-1 text-brand-tertiary">✓</span>
                          )}
                        </>
                      ) : (
                        <span className="text-foreground/30">—</span>
                      )}
                    </td>
                    <td className="p-3 text-foreground/70">
                      {extraRevisionFinal16 ? (
                        extraRevisionFinal16.date.toLocaleDateString("es-ES")
                      ) : (
                        <span className="text-foreground/30">—</span>
                      )}
                    </td>
                  </>
                )}
                <td className="p-3">
                  {alert && (
                    <span className="whitespace-nowrap rounded-full bg-brand-primary px-2.5 py-1 text-xs font-medium text-white">
                      {alert}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function RevisionesPage() {
  const patients = await prisma.user.findMany({
    where: { role: "PATIENT", patientProfile: { symptomForm: { submittedAt: { not: null } } } },
    orderBy: { name: "asc" },
    include: {
      patientProfile: {
        include: { quincenalForms: true },
      },
    },
  });

  const today = new Date();

  const rows: Row[] = patients.map((patient) => ({
    id: patient.id,
    name: patient.name,
    email: patient.email,
    planStartDate: patient.patientProfile?.planStartDate ?? null,
    revision4Date: patient.patientProfile?.revision4Date ?? null,
    revision8Date: patient.patientProfile?.revision8Date ?? null,
    quincenalWeeksSubmitted: new Set(
      (patient.patientProfile?.quincenalForms ?? [])
        .filter((f) => f.cycle === 1 && f.submittedAt)
        .map((f) => f.week),
    ),
    extraMonthEnabled: patient.patientProfile?.extraMonthEnabled ?? false,
    extraMonthStartDate: patient.patientProfile?.extraMonthStartDate ?? null,
  }));

  const renewalRows: Row[] = patients
    .filter((patient) => patient.patientProfile?.renewalEnabled)
    .map((patient) => ({
      id: patient.id,
      name: patient.name,
      email: patient.email,
      planStartDate: patient.patientProfile?.renewalPlanStartDate ?? null,
      revision4Date: patient.patientProfile?.renewalRevision4Date ?? null,
      revision8Date: patient.patientProfile?.renewalRevision8Date ?? null,
      quincenalWeeksSubmitted: new Set(
        (patient.patientProfile?.quincenalForms ?? [])
          .filter((f) => f.cycle === 2 && f.submittedAt)
          .map((f) => f.week),
      ),
    }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">📋 Revisiones</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Calendario automático de las revisiones de cada paciente, calculado
          desde la fecha en la que subes su primer Plan nutricional — igual
          que tu hoja de control, pero se rellena solo. Las fechas de
          &ldquo;Revisión semana 4&rdquo; y &ldquo;Revisión semana 8&rdquo; se
          pueden modificar a mano; el resto se recalcula solo a partir de
          ellas.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-foreground/60">
          Aquí aparecerán las pacientes en cuanto rellenen su Formulario de
          síntomas.
        </p>
      ) : (
        <RevisionesTable
          rows={rows}
          revision4Field="revision4Date"
          revision8Field="revision8Date"
          today={today}
          showExtraMonth
        />
      )}

      {renewalRows.length > 0 && (
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold">📋 Revisiones · Renovación</h2>
            <p className="mt-1 text-sm text-foreground/70">
              Pacientes con la renovación (otras 12 semanas) activada — mismo
              cálculo, a partir de la fecha en la que activaste la renovación
              en su ficha.
            </p>
          </div>
          <RevisionesTable
            rows={renewalRows}
            revision4Field="renewalRevision4Date"
            revision8Field="renewalRevision8Date"
            today={today}
          />
        </div>
      )}

      <p className="text-xs text-foreground/50">
        &ldquo;Inicio plan&rdquo; se pone sola la primera vez que subes el
        &ldquo;Plan nutricional 1&rdquo; de cada paciente, en su ficha —
        también crea sola las citas de las revisiones de semana 4, 8 y 12 en
        tu Agenda, a falta de que les pongas hora. El día antes de cada cita
        (y el mismo día a las 9:00h) le llega un recordatorio por email y
        notificación. Si activas el mes extra (semanas 13-16) de una
        paciente, sus dos columnas aparecen al final de su misma fila, sin
        moverla a ningún sitio aparte.
      </p>
    </div>
  );
}
