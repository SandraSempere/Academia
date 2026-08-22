"use client";

import { useState, useTransition } from "react";
import { saveSymptomForm } from "@/app/(app)/actions";
import { PERSONAL_FIELDS, SECTIONS, type FieldDef } from "@/lib/symptom-form-fields";
import { BristolScale } from "@/components/bristol-scale";

type SymptomFormData = {
  fullName: string | null;
  dni: string | null;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  occupation: string | null;
  consultReason: string | null;
  answers: unknown;
  submittedAt: Date | string | null;
} | null;

const inputClass =
  "rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand-primary";

function Field({
  field,
  defaultValue,
  required,
}: {
  field: FieldDef;
  defaultValue?: string;
  required?: boolean;
}) {
  if (field.type === "textarea") {
    return (
      <textarea
        name={field.id}
        rows={3}
        defaultValue={defaultValue}
        required={required}
        className={inputClass}
      />
    );
  }
  if (field.type === "select") {
    return (
      <select
        name={field.id}
        defaultValue={defaultValue ?? ""}
        required={required}
        className={inputClass}
      >
        <option value="">Selecciona...</option>
        {field.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === "number") {
    return (
      <input
        name={field.id}
        type="number"
        defaultValue={defaultValue}
        required={required}
        className={inputClass}
      />
    );
  }
  return (
    <input
      name={field.id}
      type="text"
      defaultValue={defaultValue}
      required={required}
      className={inputClass}
    />
  );
}

function CheckboxesField({
  field,
  defaultValues,
}: {
  field: FieldDef;
  defaultValues: string[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {field.options?.map((opt) => (
        <label key={opt} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name={field.id}
            value={opt}
            defaultChecked={defaultValues.includes(opt)}
            className="h-4 w-4"
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

export function SymptomForm({ data }: { data: SymptomFormData }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(!!data?.submittedAt);

  const answers = (data?.answers ?? {}) as Record<string, string | string[]>;

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          await saveSymptomForm(formData);
          setSaved(true);
        })
      }
      className="flex flex-col gap-8"
    >
      {saved && (
        <p className="rounded-lg bg-brand-tertiary-soft px-4 py-3 text-sm">
          Ya tienes un formulario enviado. Puedes actualizarlo cuando quieras
          antes de tu primera consulta.
        </p>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-blanco-roto p-5">
        <h2 className="font-semibold">Tus datos</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {PERSONAL_FIELDS.map((field) => (
            <label key={field.id} className="flex flex-col gap-1 text-sm">
              {field.label} <span className="text-brand-primary">*</span>
              <Field
                field={field}
                required
                defaultValue={
                  data?.[field.id as keyof NonNullable<SymptomFormData>] != null
                    ? String(data[field.id as keyof NonNullable<SymptomFormData>])
                    : undefined
                }
              />
            </label>
          ))}
        </div>
        <p className="text-xs text-foreground/50">* Campo obligatorio</p>
      </section>

      {SECTIONS.map((section) => (
        <section
          key={section.title}
          className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-blanco-roto p-5"
        >
          <h2 className="font-semibold">{section.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {section.fields.map((field) =>
              field.type === "checkboxes" ? (
                <div key={field.id} className="flex flex-col gap-1 text-sm sm:col-span-2">
                  {field.label}
                  <CheckboxesField
                    field={field}
                    defaultValues={
                      Array.isArray(answers[field.id]) ? (answers[field.id] as string[]) : []
                    }
                  />
                </div>
              ) : (
                <label
                  key={field.id}
                  className={`flex flex-col gap-1 text-sm ${field.type === "textarea" ? "sm:col-span-2" : ""}`}
                >
                  {field.label}
                  <Field
                    field={field}
                    defaultValue={typeof answers[field.id] === "string" ? (answers[field.id] as string) : undefined}
                  />
                  {field.id === "tipoHeces" && <BristolScale />}
                </label>
              ),
            )}
          </div>
        </section>
      ))}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-brand-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Enviar mi formulario"}
      </button>
    </form>
  );
}
