"use client";

import { useState, useTransition } from "react";
import { saveRuleAuditForm } from "@/app/(app)/actions";
import { RULE_GROUPS, RULE_DECISION_OPTIONS } from "@/lib/rule-audit-fields";

type RuleAuditData = {
  [key: string]: unknown;
  submittedAt: Date | string | null;
} | null;

const inputClass =
  "rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-primary";

export function RuleAuditForm({ data }: { data: RuleAuditData }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(!!data?.submittedAt);

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          await saveRuleAuditForm(formData);
          setSaved(true);
        })
      }
      className="flex flex-col gap-6"
    >
      {saved && (
        <p className="rounded-lg bg-brand-tertiary-soft px-4 py-3 text-sm">
          Gracias por revisarlas con calma.
        </p>
      )}

      {RULE_GROUPS.map((group) => (
        <section
          key={group.n}
          className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-blanco-roto p-5"
        >
          <p className="font-semibold">Regla {group.n}</p>

          <label className="flex flex-col gap-1 text-sm">
            ¿Cuál es la regla?
            <input
              name={group.fields.text}
              type="text"
              defaultValue={typeof data?.[group.fields.text] === "string" ? (data[group.fields.text] as string) : ""}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            ¿De dónde crees que viene esta regla? ¿Sigue teniendo sentido ahora?
            <textarea
              name={group.fields.reflection}
              rows={2}
              defaultValue={
                typeof data?.[group.fields.reflection] === "string" ? (data[group.fields.reflection] as string) : ""
              }
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            ¿Qué decides hacer con ella?
            <select
              name={group.fields.decision}
              defaultValue={
                typeof data?.[group.fields.decision] === "string" ? (data[group.fields.decision] as string) : ""
              }
              className={`${inputClass} bg-blanco-roto`}
            >
              <option value="">Selecciona...</option>
              {RULE_DECISION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        </section>
      ))}

      <p className="text-sm text-foreground/70">
        No pasa nada si al final mantienes casi todas — puede que ya tuvieran
        sentido. Lo importante es que ahora las eliges tú de forma
        consciente, no porque siempre las hayas seguido sin pensarlo.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-brand-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Enviar"}
      </button>
    </form>
  );
}
