"use client";

import { useState, useTransition } from "react";
import { requestPasswordReset } from "@/app/actions";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sent) {
    return (
      <p className="rounded-lg bg-brand-tertiary-soft px-4 py-3 text-sm">
        🌿 Si ese email está dado de alta, te hemos mandado un enlace para
        elegir una contraseña nueva. Revisa tu bandeja de entrada (y spam).
      </p>
    );
  }

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          try {
            await requestPasswordReset(formData);
            setSent(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo enviar el enlace.");
          }
        })
      }
      className="flex max-w-sm flex-col gap-4"
    >
      {error && (
        <p className="rounded-lg bg-brand-primary-soft px-4 py-3 text-sm text-brand-primary">
          {error}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          className="rounded-lg border border-black/10 px-3 py-2 outline-none focus:border-brand-primary"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Mandarme el enlace"}
      </button>
    </form>
  );
}
