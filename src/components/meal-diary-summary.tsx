import { DAYS, MEAL_DIARY_FIELDS, WEEKS, hasAnyValue, type MealDiaryEntryData } from "@/lib/meal-diary-fields";

// Vista de solo lectura para la coach, dentro de la ficha de la paciente.
// Solo muestra semanas y días que la paciente ya ha rellenado — a
// diferencia del formulario de la paciente (que siempre muestra las 12
// semanas para poder rellenarlas), aquí mostrar huecos vacíos solo sería
// ruido.
export function MealDiarySummary({
  entries,
  weeks = WEEKS,
}: {
  entries: Map<string, MealDiaryEntryData>;
  weeks?: number[];
}) {
  const weeksWithData = weeks.filter((week) =>
    DAYS.some((d) => hasAnyValue(entries.get(`${week}-${d.day}`))),
  );

  if (weeksWithData.length === 0) {
    return <p className="text-sm text-foreground/60">Todavía no ha rellenado ningún día.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {weeksWithData.map((week) => {
        const daysWithData = DAYS.filter((d) => hasAnyValue(entries.get(`${week}-${d.day}`)));
        return (
          <details key={week} className="rounded-xl border border-black/5 bg-blanco-roto p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Semana {week}
              <span className="ml-2 text-xs text-foreground/50">{daysWithData.length} / 7 días</span>
            </summary>
            <div className="mt-3 flex flex-col gap-3">
              {daysWithData.map(({ day, label }) => {
                const entry = entries.get(`${week}-${day}`)!;
                return (
                  <div key={day} className="rounded-lg bg-crema p-3 text-sm">
                    <p className="font-medium">{label}</p>
                    <div className="mt-1 flex flex-col gap-1">
                      {MEAL_DIARY_FIELDS.map((field) => {
                        const value = entry[field.id];
                        if (!value) return null;
                        const option = field.options?.find((o) => o.value === value);
                        return (
                          <p key={field.id}>
                            <span className="text-foreground/50">{field.label}: </span>
                            {option ? (
                              <span
                                className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                                style={{ backgroundColor: option.color }}
                              >
                                {option.label}
                              </span>
                            ) : (
                              value
                            )}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}
