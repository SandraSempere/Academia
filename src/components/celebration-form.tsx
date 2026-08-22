"use client";

import { useState, useTransition } from "react";
import { saveCelebrationForm } from "@/app/(app)/actions";
import { CELEBRATION_FIELDS } from "@/lib/celebration-form-fields";

type CelebrationFormData = {
  [key: string]: unknown;
  submittedAt: Date | string | null;
} | null;

export function CelebrationForm({ data }: { data: CelebrationFormData }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(!!data?.submittedAt);

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          await saveCelebrationForm(formData);
          setSaved(true);
        })
      }
      className="flex flex-col gap-6"
    >
      {saved && (
        <p className="rounded-lg bg-brand-tertiary-soft px-4 py-3 text-sm">
          🎉 Gracias por compartirlo. Lo voy a leer con calma.
        </p>
      )}

      {CELEBRATION_FIELDS.map((field) => (
        <label key={field.id} className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">{field.label}</span>
          <span className="text-xs text-foreground/60">{field.helper}</span>
          <textarea
            name={field.id}
            rows={3}
            defaultValue={typeof data?.[field.id] === "string" ? (data[field.id] as string) : ""}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
        </label>
      ))}

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
