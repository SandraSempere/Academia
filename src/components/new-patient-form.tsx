"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPatient } from "@/app/coach/actions";

export function NewPatientForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          try {
            const result = await createPatient(formData);
            router.push(`/coach/pacientes/${result.userId}`);
          } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo crear la paciente.");
          }
        })
      }
      className="flex max-w-md flex-col gap-4"
    >
      {error && (
        <p className="rounded-lg bg-brand-primary-soft px-4 py-3 text-sm text-brand-primary">
          {error}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Nombre
        <input
          name="name"
          required
          className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-primary"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-primary"
        />
      </label>

      <p className="text-xs text-foreground/60">
        Se le genera sola una contraseña provisional (su nombre + &quot;1234&quot;)
        y se le manda por email con las instrucciones para instalar la app y
        entrar por primera vez.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-brand-primary px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Creando..." : "Crear paciente"}
      </button>
    </form>
  );
}
