"use client";

import { useTransition } from "react";
import { saveIntakeScreening } from "@/app/(app)/actions";
import { IntakeScreeningSummary } from "@/components/intake-screening-summary";

type IntakeData = {
  bloatingFrequency: string | null;
  unbuttonPants: string | null;
  intolerantFoods: string | null;
  avoidsPlans: string | null;
  timeThinkingDigestion: string | null;
  triedRestrictiveDiets: string | null;
  confidence: number | null;
  oneThingToChange: string | null;
  completedAt: Date | null;
} | null;

const selectClass =
  "rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-primary bg-blanco-roto";
const textClass =
  "rounded-lg border border-black/10 px-2 py-1.5 text-sm outline-none focus:border-brand-primary";

export function IntakeScreeningForm({ data }: { data: IntakeData }) {
  const [pending, startTransition] = useTransition();

  if (data?.completedAt) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <p className="rounded-lg bg-brand-tertiary-soft px-3 py-2 text-xs text-foreground/70">
          Ya enviaste tus respuestas el{" "}
          {new Date(data.completedAt).toLocaleDateString("es-ES")}. En la
          semana 12 las miramos juntas 💛
        </p>
        <IntakeScreeningSummary data={data} />
      </div>
    );
  }

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          await saveIntakeScreening(formData);
        })
      }
      className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-blanco-roto p-5"
    >
      <label className="flex flex-col gap-1 text-sm">
        1. ¿Cuántos días a la semana notas hinchazón?
        <select
          name="bloatingFrequency"
          defaultValue={data?.bloatingFrequency ?? ""}
          className={selectClass}
        >
          <option value="">Selecciona...</option>
          <option value="Todos los días">Todos los días</option>
          <option value="Casi todos">Casi todos</option>
          <option value="Algunos">Algunos</option>
          <option value="Pocos">Pocos</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        2. ¿Te ha pasado tener que desabrocharte el pantalón después de comer?
        <select
          name="unbuttonPants"
          defaultValue={data?.unbuttonPants ?? ""}
          className={selectClass}
        >
          <option value="">Selecciona...</option>
          <option value="Sí, muy a menudo">Sí, muy a menudo</option>
          <option value="A veces">A veces</option>
          <option value="Casi nunca">Casi nunca</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        3. ¿Qué alimentos sientes que ya no toleras bien?
        <input
          name="intolerantFoods"
          defaultValue={data?.intolerantFoods ?? ""}
          className={textClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        4. ¿Evitas hacer planes por miedo a cómo te vas a encontrar?
        <select
          name="avoidsPlans"
          defaultValue={data?.avoidsPlans ?? ""}
          className={selectClass}
        >
          <option value="">Selecciona...</option>
          <option value="Sí, con frecuencia">Sí, con frecuencia</option>
          <option value="A veces">A veces</option>
          <option value="No">No</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        5. ¿Cuánto tiempo pasas pensando en tu digestión o en qué vas a comer?
        <input
          name="timeThinkingDigestion"
          defaultValue={data?.timeThinkingDigestion ?? ""}
          className={textClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        6. ¿Ya has probado dietas restrictivas o antibióticos para el SIBO sin
        mejorar?
        <select
          name="triedRestrictiveDiets"
          defaultValue={data?.triedRestrictiveDiets ?? ""}
          className={selectClass}
        >
          <option value="">Selecciona...</option>
          <option value="Sí">Sí</option>
          <option value="No">No</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        7. Del 0 al 10, ¿cuánto confías en volver a comer sin miedo?
        <input
          name="confidence"
          type="number"
          min={0}
          max={10}
          defaultValue={data?.confidence ?? ""}
          className={textClass}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        8. Si pudieras cambiar una cosa de tu digestión hoy, ¿cuál sería?
        <input
          name="oneThingToChange"
          defaultValue={data?.oneThingToChange ?? ""}
          className={textClass}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar mis respuestas"}
      </button>
    </form>
  );
}
