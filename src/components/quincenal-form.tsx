"use client";

import { useState, useTransition } from "react";
import { saveQuincenalForm } from "@/app/(app)/actions";
import { QUINCENAL_SECTIONS, type QuincenalFieldDef, type Tone } from "@/lib/quincenal-form-fields";

type QuincenalFormData = {
  answers: unknown;
  submittedAt: Date | string | null;
} | null;

const inputClass =
  "rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-primary";

function toneClasses(tone: Tone, active: boolean) {
  if (!active) {
    return "border-black/10 bg-white text-foreground/70 hover:border-brand-primary";
  }
  switch (tone) {
    case "good":
      return "border-brand-tertiary bg-brand-tertiary text-white";
    case "concern":
      return "border-brand-primary bg-brand-primary text-white";
    case "neutral":
      return "border-brand-secondary-soft bg-brand-secondary-soft text-carbon";
    default:
      return "border-carbon bg-carbon text-white";
  }
}

function ChipsField({
  field,
  value,
  onChange,
}: {
  field: QuincenalFieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {field.options?.map((opt) => (
        <button
          key={opt.label}
          type="button"
          onClick={() => onChange(opt.label)}
          className={`appearance-none rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${toneClasses(opt.tone, value === opt.label)}`}
        >
          {opt.label}
        </button>
      ))}
      <input type="hidden" name={field.id} value={value} />
    </div>
  );
}

export function QuincenalForm({
  week,
  cycle = 1,
  data,
}: {
  week: number;
  cycle?: number;
  data: QuincenalFormData;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(!!data?.submittedAt);
  const initialAnswers = (data?.answers ?? {}) as Record<string, string>;
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          formData.set("week", String(week));
          formData.set("cycle", String(cycle));
          await saveQuincenalForm(formData);
          setSaved(true);
        })
      }
      className="flex flex-col gap-8"
    >
      {saved && (
        <p className="rounded-lg bg-brand-tertiary-soft px-4 py-3 text-sm">
          🌿 Revisión enviada. Gracias por rellenarla con detalle.
        </p>
      )}

      {QUINCENAL_SECTIONS.map((section) => (
        <section
          key={section.title}
          className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-blanco-roto p-5"
        >
          <h2 className="font-semibold">{section.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <label
                key={field.id}
                className={`flex flex-col gap-1.5 text-sm ${field.type === "textarea" ? "sm:col-span-2" : ""}`}
              >
                {field.label}
                {field.type === "chips" ? (
                  <ChipsField
                    field={field}
                    value={answers[field.id] ?? ""}
                    onChange={(v) => setAnswers((prev) => ({ ...prev, [field.id]: v }))}
                  />
                ) : field.type === "textarea" ? (
                  <textarea
                    name={field.id}
                    rows={2}
                    defaultValue={initialAnswers[field.id] ?? ""}
                    className={inputClass}
                  />
                ) : (
                  <input
                    name={field.id}
                    type="text"
                    defaultValue={initialAnswers[field.id] ?? ""}
                    className={inputClass}
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-brand-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Enviar mi revisión"}
      </button>
    </form>
  );
}
