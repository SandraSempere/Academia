"use client";

import { useState, useTransition } from "react";
import { saveCommitmentForm } from "@/app/(app)/actions";
import { ATTEMPT_GROUPS } from "@/lib/commitment-form-fields";

type CommitmentData = {
  [key: string]: unknown;
  submittedAt: Date | string | null;
} | null;

const inputClass =
  "rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-primary";

export function CommitmentForm({ data }: { data: CommitmentData }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(!!data?.submittedAt);

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          await saveCommitmentForm(formData);
          setSaved(true);
        })
      }
      className="flex flex-col gap-6"
    >
      {saved && (
        <p className="rounded-lg bg-brand-tertiary-soft px-4 py-3 text-sm">
          Guardada. Nos la volveremos a leer en la semana 12.
        </p>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <p className="font-semibold">Tu línea de intentos</p>
        <p className="text-sm text-foreground/70">
          Apunta aquí todo lo que has probado para tu digestión — dietas,
          eliminaciones, antibióticos, suplementos, lo que sea — y cómo te
          fue. Si nada de esto ha funcionado del todo, no es porque no te
          hayas esforzado lo suficiente. Es porque nadie trabajó el origen.
        </p>

        <div className="mt-2 hidden gap-2 text-xs font-medium uppercase tracking-wide text-foreground/50 sm:grid sm:grid-cols-3">
          <span>Qué probé</span>
          <span>Cuándo</span>
          <span>Cómo me fue</span>
        </div>

        <div className="flex flex-col gap-2">
          {ATTEMPT_GROUPS.map((group) => (
            <div key={group.n} className="grid gap-2 sm:grid-cols-3">
              <input
                name={group.fields.what}
                type="text"
                placeholder="Qué probé"
                defaultValue={typeof data?.[group.fields.what] === "string" ? (data[group.fields.what] as string) : ""}
                className={inputClass}
              />
              <input
                name={group.fields.when}
                type="text"
                placeholder="Cuándo"
                defaultValue={typeof data?.[group.fields.when] === "string" ? (data[group.fields.when] as string) : ""}
                className={inputClass}
              />
              <input
                name={group.fields.howItWent}
                type="text"
                placeholder="Cómo me fue"
                defaultValue={
                  typeof data?.[group.fields.howItWent] === "string" ? (data[group.fields.howItWent] as string) : ""
                }
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <p className="font-semibold">Tu carta de compromiso</p>
        <p className="text-sm text-foreground/70">
          Escríbete una carta breve a ti misma. No hace falta que suene bien
          ni que quede perfecta. Puede ayudarte pensar en: qué es distinto
          esta vez, qué te gustaría poder hacer sin miedo dentro de unos
          meses, y qué le dirías a la versión de ti que empezó este proceso.
        </p>
        <textarea
          name="letter"
          rows={10}
          defaultValue={typeof data?.letter === "string" ? (data.letter as string) : ""}
          className={inputClass}
        />
      </section>

      <p className="text-sm text-foreground/70">
        Guarda esta hoja. En la semana 12 vuelve a leerla — vas a ver el
        camino que has hecho, no solo en tu digestión, también en cómo te
        hablas a ti misma.
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
