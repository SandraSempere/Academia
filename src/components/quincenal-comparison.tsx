import { Fragment } from "react";
import { QUINCENAL_SECTIONS, toneColor } from "@/lib/quincenal-form-fields";

type QuincenalRecord = {
  week: number;
  answers: unknown;
  submittedAt: Date | string | null;
};

const WEEKS = [2, 6, 10];

function EvolutionChart({ byWeek }: { byWeek: Map<number, Record<string, string>> }) {
  const series = [
    { id: "estres", label: "Estrés", color: "var(--brand-primary)", dash: "6 4" },
    { id: "valoracionGeneral", label: "Valoración general", color: "var(--brand-tertiary)", dash: undefined },
  ];

  const hasAnyData = series.some((s) => WEEKS.some((w) => byWeek.get(w)?.[s.id]));
  if (!hasAnyData) return null;

  const width = 320;
  const height = 140;
  const padding = 24;
  const xFor = (week: number) => padding + ((week - 2) / (10 - 2)) * (width - padding * 2);
  const yFor = (value: number) => height - padding - ((value - 1) / (5 - 1)) * (height - padding * 2);

  return (
    <div className="rounded-2xl border border-black/5 bg-blanco-roto p-4">
      <p className="text-sm font-medium">📈 Evolución (escala 1-5)</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-2 w-full max-w-sm">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeOpacity={0.15} />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" strokeOpacity={0.15} />
        {WEEKS.map((w) => (
          <text key={w} x={xFor(w)} y={height - padding + 14} fontSize={9} textAnchor="middle" fill="currentColor" opacity={0.5}>
            S{w}
          </text>
        ))}
        {series.map((s) => {
          const points = WEEKS.map((w) => {
            const raw = byWeek.get(w)?.[s.id];
            const num = raw ? Number(raw) : null;
            return num ? { week: w, value: num } : null;
          }).filter((p): p is { week: number; value: number } => p !== null);

          if (points.length === 0) return null;
          const path = points.map((p) => `${xFor(p.week)},${yFor(p.value)}`).join(" ");
          // Cuando las dos líneas coinciden exactamente semana a semana (p.
          // ej. estrés y valoración general con el mismo número), una encima
          // de la otra taparía del todo a la de abajo — por eso "Estrés" va
          // más gruesa y discontinua: aunque coincidan, se le sigue viendo
          // el borde y el patrón de rayas por debajo de la línea verde.
          return (
            <g key={s.id}>
              <polyline
                points={path}
                fill="none"
                stroke={s.color}
                strokeWidth={s.dash ? 5 : 2}
                strokeDasharray={s.dash}
              />
              {points.map((p) => (
                <circle
                  key={p.week}
                  cx={xFor(p.week)}
                  cy={yFor(p.value)}
                  r={s.dash ? 5 : 3}
                  fill={s.dash ? "none" : s.color}
                  stroke={s.dash ? s.color : undefined}
                  strokeWidth={s.dash ? 2 : undefined}
                />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-foreground/60">
        {series.map((s) => (
          <span key={s.id} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function QuincenalComparison({ forms }: { forms: QuincenalRecord[] }) {
  const byWeek = new Map(
    forms
      .filter((f) => f.submittedAt)
      .map((f) => [f.week, (f.answers ?? {}) as Record<string, string>]),
  );

  if (byWeek.size === 0) {
    return (
      <p className="text-sm text-foreground/60">
        Todavía no ha enviado ninguna revisión quincenal.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <EvolutionChart byWeek={byWeek} />

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-blanco-roto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left">
              <th className="p-3 font-medium text-foreground/50">Pregunta</th>
              {WEEKS.map((w) => (
                <th key={w} className="p-3 font-medium text-foreground/50">
                  Semana {w}
                  {!byWeek.has(w) && (
                    <span className="ml-1 font-normal text-foreground/30">· sin enviar</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {QUINCENAL_SECTIONS.map((section) => {
              const rows = section.fields.filter((field) =>
                WEEKS.some((w) => byWeek.get(w)?.[field.id]),
              );
              if (rows.length === 0) return null;
              return (
                <Fragment key={section.title}>
                  <tr>
                    <td
                      colSpan={WEEKS.length + 1}
                      className="bg-black/[0.02] p-2 text-xs font-semibold uppercase tracking-wide text-brand-secondary"
                    >
                      {section.title}
                    </td>
                  </tr>
                  {rows.map((field) => (
                    <tr key={field.id} className="border-b border-black/5 align-top">
                      <td className="p-3 text-foreground/70">{field.label}</td>
                      {WEEKS.map((w) => {
                        const value = byWeek.get(w)?.[field.id];
                        const option = field.options?.find((o) => o.label === value);
                        return (
                          <td key={w} className="p-3">
                            {value ? (
                              field.type === "chips" ? (
                                <span
                                  className="inline-block rounded-full px-2.5 py-1 text-xs font-medium text-white"
                                  style={{ backgroundColor: toneColor(option?.tone ?? null) }}
                                >
                                  {value}
                                </span>
                              ) : (
                                <span className="text-foreground/80">{value}</span>
                              )
                            ) : (
                              <span className="text-foreground/30">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
