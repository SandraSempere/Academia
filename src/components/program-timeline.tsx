import { updateRevisionDate } from "@/app/coach/actions";
import { computeCheckpoints, atMidnight } from "@/lib/revisiones";

function toDateInputValue(date: Date) {
  // Fecha local (no UTC) — con toISOString() una medianoche local en
  // Europe/Madrid (UTC+1/+2) se desplaza al día anterior.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fmt(date: Date) {
  return date.toLocaleDateString("es-ES");
}

type Row = {
  label: string;
  actual: Date | null;
  expected: Date | null;
  editableField?: string;
};

function TimelineRow({ row, userId, today }: { row: Row; userId: string; today: Date }) {
  const isFinishLine = row.label === "Revisión final semana 12";

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 py-2 text-sm last:border-0">
      <span className={isFinishLine ? "font-medium" : ""}>
        {isFinishLine ? "🏁 " : ""}
        {row.label}
      </span>

      {row.actual ? (
        <span className="text-brand-tertiary">✓ {fmt(row.actual)}</span>
      ) : row.editableField ? (
        <form action={updateRevisionDate} className="flex items-center gap-1.5">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="field" value={row.editableField} />
          <input
            name="date"
            type="date"
            defaultValue={row.expected ? toDateInputValue(row.expected) : ""}
            className="rounded border border-black/10 px-1.5 py-1 text-xs outline-none focus:border-brand-primary"
          />
          <button type="submit" className="text-xs text-brand-primary underline hover:opacity-80">
            Guardar
          </button>
        </form>
      ) : row.expected ? (
        atMidnight(row.expected).getTime() < atMidnight(today).getTime() ? (
          <span className="text-brand-primary">⚠ Atrasado · previsto {fmt(row.expected)}</span>
        ) : (
          <span className="text-foreground/50">Previsto {fmt(row.expected)}</span>
        )
      ) : (
        <span className="text-foreground/30">Pendiente</span>
      )}
    </li>
  );
}

export function ProgramTimeline({
  userId,
  title,
  planStartDate,
  revision4Date,
  revision8Date,
  revision4Field,
  revision8Field,
  quincenalForms,
  symptomFormSubmittedAt,
  intakeScreeningCompletedAt,
  commitmentFormSubmittedAt,
  celebrationFormSubmittedAt,
  ruleAuditFormSubmittedAt,
  closingFormSubmittedAt,
}: {
  userId: string;
  title: string;
  planStartDate: Date | null;
  revision4Date: Date | null;
  revision8Date: Date | null;
  revision4Field: string;
  revision8Field: string;
  quincenalForms: { week: number; submittedAt: Date | null }[];
  symptomFormSubmittedAt?: Date | null;
  intakeScreeningCompletedAt?: Date | null;
  commitmentFormSubmittedAt?: Date | null;
  celebrationFormSubmittedAt?: Date | null;
  ruleAuditFormSubmittedAt?: Date | null;
  closingFormSubmittedAt?: Date | null;
}) {
  if (!planStartDate) {
    return (
      <div className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <p className="font-semibold">🗓️ {title}</p>
        <p className="mt-1 text-sm text-foreground/60">
          Se pone en marcha sola en cuanto subas su primer Plan nutricional.
        </p>
      </div>
    );
  }

  const today = new Date();
  const checkpoints = computeCheckpoints(planStartDate, revision4Date, revision8Date);
  const at = (label: string) => checkpoints.find((c) => c.label === label)!.date;
  const formSubmitted = (week: number) => quincenalForms.find((f) => f.week === week)?.submittedAt ?? null;

  const rows: Row[] = [{ label: "Inicio del programa", actual: planStartDate, expected: null }];

  if (symptomFormSubmittedAt !== undefined) {
    rows.push({ label: "Formulario de síntomas", actual: symptomFormSubmittedAt, expected: null });
  }
  if (intakeScreeningCompletedAt !== undefined) {
    rows.push({ label: "Autocribado de inicio", actual: intakeScreeningCompletedAt, expected: null });
  }

  rows.push({ label: "Formulario semana 2", actual: formSubmitted(2), expected: at("Formulario semana 2") });
  if (commitmentFormSubmittedAt !== undefined) {
    rows.push({
      label: "Tu línea de intentos y carta de compromiso",
      actual: commitmentFormSubmittedAt,
      expected: at("Formulario semana 2"),
    });
  }

  rows.push({
    label: "Revisión semana 4",
    actual: null,
    expected: at("Revisión semana 4"),
    editableField: revision4Field,
  });

  rows.push({ label: "Formulario semana 6", actual: formSubmitted(6), expected: at("Formulario semana 6") });
  if (celebrationFormSubmittedAt !== undefined) {
    rows.push({
      label: "Mi momento de celebración",
      actual: celebrationFormSubmittedAt,
      expected: at("Formulario semana 6"),
    });
  }

  rows.push({
    label: "Revisión semana 8",
    actual: null,
    expected: at("Revisión semana 8"),
    editableField: revision8Field,
  });
  if (ruleAuditFormSubmittedAt !== undefined) {
    rows.push({
      label: "Auditoría de reglas",
      actual: ruleAuditFormSubmittedAt,
      expected: at("Revisión semana 8"),
    });
  }

  rows.push({ label: "Formulario semana 10", actual: formSubmitted(10), expected: at("Formulario semana 10") });

  const revision12Date = at("Revisión final semana 12");
  rows.push({ label: "Revisión final semana 12", actual: null, expected: revision12Date });
  if (closingFormSubmittedAt !== undefined) {
    rows.push({
      label: "Formulario de cierre y valoración",
      actual: closingFormSubmittedAt,
      expected: revision12Date,
    });
  }

  const daysRemaining = Math.ceil(
    (atMidnight(revision12Date).getTime() - atMidnight(today).getTime()) / (1000 * 60 * 60 * 24),
  );
  const daysSinceStart = Math.floor(
    (atMidnight(today).getTime() - atMidnight(planStartDate).getTime()) / (1000 * 60 * 60 * 24),
  );
  const currentWeek = Math.min(12, Math.max(1, Math.floor(daysSinceStart / 7) + 1));
  const summary =
    daysRemaining <= 0
      ? `Semana 12 alcanzada el ${fmt(revision12Date)}.`
      : `Semana ${currentWeek} de 12 · quedan ${daysRemaining} día${daysRemaining === 1 ? "" : "s"} para la revisión final (${fmt(revision12Date)}).`;

  return (
    <details className="rounded-2xl border border-black/5 bg-blanco-roto p-5">
      <summary className="cursor-pointer font-semibold">
        🗓️ {title}{" "}
        <span className="font-normal text-foreground/60">
          · Inicio {fmt(planStartDate)} · {summary}
        </span>
      </summary>
      <ul className="mt-3">
        {rows.map((row) => (
          <TimelineRow key={row.label} row={row} userId={userId} today={today} />
        ))}
      </ul>
    </details>
  );
}
