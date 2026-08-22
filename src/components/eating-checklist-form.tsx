"use client";

import { useState, useTransition } from "react";
import { toggleEatingStep, saveEatingWeek } from "@/app/(app)/actions";
import { EATING_STEPS, EATING_WEEK_DAYS } from "@/lib/eating-checklist-fields";
import { HungerScale } from "@/components/hunger-scale";

type EatingChecklistData = {
  step1: boolean;
  step2: boolean;
  step3: boolean;
  step4: boolean;
  step5: boolean;
  monday: string | null;
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
  saturday: string | null;
  sunday: string | null;
} | null;

function StepCheckbox({
  id,
  label,
  helper,
  initialChecked,
}: {
  id: string;
  label: string;
  helper: string;
  initialChecked: boolean;
}) {
  const [checked, setChecked] = useState(initialChecked);
  const [, startTransition] = useTransition();

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-black/5 bg-blanco-roto p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          const next = e.target.checked;
          setChecked(next);
          startTransition(async () => {
            await toggleEatingStep(id, next);
          });
        }}
        className="mt-0.5 h-4 w-4"
      />
      <span>
        <span className={`text-sm font-medium ${checked ? "text-foreground/50 line-through" : ""}`}>
          {label}
        </span>
        <p className="mt-0.5 text-xs text-foreground/60">{helper}</p>
      </span>
    </label>
  );
}

export function EatingChecklistForm({ data }: { data: EatingChecklistData }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {EATING_STEPS.map((step) => (
          <StepCheckbox
            key={step.id}
            id={step.id}
            label={step.label}
            helper={step.helper}
            initialChecked={data?.[step.id] ?? false}
          />
        ))}
      </div>

      <HungerScale />

      <form
        action={(formData) =>
          startTransition(async () => {
            await saveEatingWeek(formData);
            setSaved(true);
          })
        }
        className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-blanco-roto p-5"
      >
        <div>
          <p className="font-semibold">Mi semana</p>
          <p className="text-xs text-foreground/60">
            Una palabra al día sobre cómo te sentó la comida (ligera,
            hinchada, en calma, pesada...).
          </p>
        </div>

        {saved && (
          <p className="rounded-lg bg-brand-tertiary-soft px-3 py-2 text-xs text-foreground/70">
            Guardado. Puedes actualizarlo cuando quieras.
          </p>
        )}

        <div className="grid gap-2 sm:grid-cols-4">
          {EATING_WEEK_DAYS.map((day) => (
            <label key={day.id} className="flex flex-col gap-1 text-xs">
              {day.label}
              <input
                name={day.id}
                type="text"
                defaultValue={data?.[day.id] ?? ""}
                className="rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-primary"
              />
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-brand-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Guardando..." : "Guardar mi semana"}
        </button>
      </form>
    </div>
  );
}
