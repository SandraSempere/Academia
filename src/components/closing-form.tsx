"use client";

import { useState, useTransition } from "react";
import { saveClosingForm } from "@/app/(app)/actions";
import { CLOSING_FIELDS, TESTIMONIAL_OPTIONS } from "@/lib/closing-form-fields";

type ClosingFormData = {
  [key: string]: unknown;
  testimonialConsent: string | null;
  submittedAt: Date | string | null;
} | null;

export function ClosingForm({ data }: { data: ClosingFormData }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(!!data?.submittedAt);

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          await saveClosingForm(formData);
          setSaved(true);
        })
      }
      className="flex flex-col gap-6"
    >
      {saved && (
        <p className="rounded-lg bg-brand-tertiary-soft px-4 py-3 text-sm">
          Gracias por compartirlo. Ha sido un camino, y me alegra haberlo
          recorrido contigo.
        </p>
      )}

      {CLOSING_FIELDS.map((field) => (
        <label key={field.id} className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">
            {field.label} {field.required && <span className="text-brand-primary">*</span>}
          </span>
          {field.helper && <span className="text-xs text-foreground/60">{field.helper}</span>}
          {field.id === "name" ? (
            <input
              name={field.id}
              type="text"
              required={field.required}
              defaultValue={typeof data?.[field.id] === "string" ? (data[field.id] as string) : ""}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          ) : (
            <textarea
              name={field.id}
              rows={3}
              defaultValue={typeof data?.[field.id] === "string" ? (data[field.id] as string) : ""}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-primary"
            />
          )}
        </label>
      ))}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Uso del testimonio (opcional)</span>
        <span className="text-xs text-foreground/60">
          ¿Me autorizas a compartir alguna parte de tus respuestas de forma
          anónima en redes o en la web?
        </span>
        <select
          name="testimonialConsent"
          defaultValue={data?.testimonialConsent ?? ""}
          className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-primary bg-blanco-roto"
        >
          <option value="">Selecciona...</option>
          {TESTIMONIAL_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>

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
