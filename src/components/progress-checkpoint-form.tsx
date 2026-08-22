"use client";

import { useTransition } from "react";
import { saveProgressCheckpoint } from "@/app/(app)/progreso/actions";

type CheckpointData = {
  daysBloating: string;
  toleratedFoods: string;
  avoidsPlans: string;
  confidence: number | null;
};

export function ProgressCheckpointForm({
  week,
  data,
}: {
  week: number;
  data: CheckpointData | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => saveProgressCheckpoint(formData))}
      className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-blanco-roto p-4"
    >
      <input type="hidden" name="week" value={week} />
      <p className="font-semibold">Semana {week}</p>

      <label className="flex flex-col gap-1 text-xs">
        Días de hinchazón/semana
        <input
          name="daysBloating"
          defaultValue={data?.daysBloating ?? ""}
          className="rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-primary"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs">
        Alimentos que sientes que toleras
        <input
          name="toleratedFoods"
          defaultValue={data?.toleratedFoods ?? ""}
          className="rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-primary"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs">
        Evitas planes por tu digestión
        <input
          name="avoidsPlans"
          defaultValue={data?.avoidsPlans ?? ""}
          className="rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-primary"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs">
        Confianza en comer sin miedo (0-10)
        <input
          name="confidence"
          type="number"
          min={0}
          max={10}
          defaultValue={data?.confidence ?? ""}
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
