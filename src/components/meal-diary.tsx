"use client";

import { useState, useTransition } from "react";
import { saveMealDiaryEntry } from "@/app/(app)/progreso/actions";
import {
  BATHROOM_OPTIONS,
  DAYS,
  DIGESTION_OPTIONS,
  WEEKS,
  hasAnyValue,
  type ColorOption,
  type MealDiaryEntryData,
} from "@/lib/meal-diary-fields";

function MealDiaryDayForm({
  cycle,
  week,
  day,
  label,
  data,
}: {
  cycle: number;
  week: number;
  day: number;
  label: string;
  data: MealDiaryEntryData | undefined;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => saveMealDiaryEntry(formData))}
      className="flex flex-col gap-2 rounded-xl border border-black/5 bg-blanco-roto p-3"
    >
      <input type="hidden" name="cycle" value={cycle} />
      <input type="hidden" name="week" value={week} />
      <input type="hidden" name="day" value={day} />
      <p className="text-sm font-semibold">{label}</p>

      <div className="grid gap-2 sm:grid-cols-2">
        <Field name="breakfast" label="Desayuno" defaultValue={data?.breakfast} />
        <ColorSelectField
          name="breakfastDigestion"
          label="Digestión"
          options={DIGESTION_OPTIONS}
          defaultValue={data?.breakfastDigestion}
        />
        <Field name="lunch" label="Comida" defaultValue={data?.lunch} />
        <ColorSelectField
          name="lunchDigestion"
          label="Digestión"
          options={DIGESTION_OPTIONS}
          defaultValue={data?.lunchDigestion}
        />
        <Field name="dinner" label="Cena" defaultValue={data?.dinner} />
        <ColorSelectField
          name="dinnerDigestion"
          label="Digestión"
          options={DIGESTION_OPTIONS}
          defaultValue={data?.dinnerDigestion}
        />
        <ColorSelectField
          name="bathroom"
          label="Baño"
          options={BATHROOM_OPTIONS}
          defaultValue={data?.bathroom}
        />
      </div>

      <label className="flex flex-col gap-1 text-xs text-foreground/70">
        Observaciones generales del día
        <textarea
          name="notes"
          defaultValue={data?.notes ?? ""}
          rows={2}
          className="rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-primary"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-brand-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string | null | undefined;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-foreground/70">
      {label}
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        className="rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-primary"
      />
    </label>
  );
}

function ColorSelectField({
  name,
  label,
  options,
  defaultValue,
}: {
  name: string;
  label: string;
  options: ColorOption[];
  defaultValue: string | null | undefined;
}) {
  const initial = options.find((o) => o.value === defaultValue);
  const [color, setColor] = useState(initial?.color ?? "transparent");

  return (
    <label className="flex flex-col gap-1 text-xs text-foreground/70">
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        onChange={(e) => setColor(options.find((o) => o.value === e.target.value)?.color ?? "transparent")}
        style={{ backgroundColor: color }}
        className="rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-primary"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MealDiary({
  cycle = 1,
  entries,
  weeks = WEEKS,
}: {
  cycle?: number;
  entries: Map<string, MealDiaryEntryData>;
  weeks?: number[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {weeks.map((week) => {
        const filledDays = DAYS.filter((d) => hasAnyValue(entries.get(`${week}-${d.day}`))).length;
        return (
          <details key={week} className="rounded-xl border border-black/5 bg-crema p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Semana {week}
              {filledDays > 0 && (
                <span className="ml-2 text-xs text-foreground/50">
                  {filledDays} / 7 días
                </span>
              )}
            </summary>
            <div className="mt-3 flex flex-col gap-2">
              {DAYS.map(({ day, label }) => (
                <MealDiaryDayForm
                  key={day}
                  cycle={cycle}
                  week={week}
                  day={day}
                  label={label}
                  data={entries.get(`${week}-${day}`)}
                />
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}
